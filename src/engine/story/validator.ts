import { parseStoryManifest, parseStoryNode } from './schema.ts'
import type { StoryManifest, StoryNode, StoryPackSource, StoryContent } from './types'

export type StoryValidationCode =
  | 'SCHEMA_INVALID'
  | 'SCHEMA_VERSION_UNSUPPORTED'
  | 'DUPLICATE_NODE_ID'
  | 'ENTRY_NOT_FOUND'
  | 'TARGET_NOT_FOUND'
  | 'NODE_UNREACHABLE'
  | 'NON_ENDING_DEAD_END'
  | 'GRAPH_CYCLE'
  | 'NO_REACHABLE_ENDING'
  | 'ASSET_NOT_FOUND'
  | 'ASSET_PATH_ESCAPE'

export type StoryValidationIssue = {
  code: StoryValidationCode
  message: string
  path?: string
  nodeId?: string
}

export type StoryValidationResult = {
  valid: boolean
  issues: StoryValidationIssue[]
}

export type StoryValidationOptions = {
  /** Asset keys known to exist, supplied by the Node filesystem adapter. */
  assetPaths?: ReadonlySet<string>
}

type UnknownRecord = Record<string, unknown>

type StoryEdge = {
  target: string
  path: string
}

function isRecord(value: unknown): value is UnknownRecord {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function rawNodeId(value: unknown): string | undefined {
  return isRecord(value) && typeof value.id === 'string' && value.id.length > 0 ? value.id : undefined
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function issue(
  code: StoryValidationCode,
  message: string,
  path?: string,
  nodeId?: string,
): StoryValidationIssue {
  return { code, message, ...(path ? { path } : {}), ...(nodeId ? { nodeId } : {}) }
}

function sortIssues(issues: StoryValidationIssue[]): StoryValidationIssue[] {
  return [...issues].sort((left, right) =>
    (left.path ?? '').localeCompare(right.path ?? '') ||
    (left.nodeId ?? '').localeCompare(right.nodeId ?? '') ||
    left.code.localeCompare(right.code) ||
    left.message.localeCompare(right.message),
  )
}

function schemaIssueForManifest(source: unknown, error: unknown): StoryValidationIssue {
  const schemaVersion = isRecord(source) ? source.schemaVersion : undefined
  const code = schemaVersion !== undefined && schemaVersion !== '0.1' ? 'SCHEMA_VERSION_UNSUPPORTED' : 'SCHEMA_INVALID'
  return issue(code, errorMessage(error), 'manifest')
}

function outgoingEdges(node: StoryNode): StoryEdge[] {
  if (node.type === 'narrative') return [{ target: node.next, path: `nodes.${node.id}.next` }]
  if (node.type === 'conditional') {
    return [
      ...node.branches.map((branch, index) => ({ target: branch.next, path: `nodes.${node.id}.branches[${index}].next` })),
      { target: node.fallback, path: `nodes.${node.id}.fallback` },
    ]
  }
  if (node.type === 'choice') {
    return node.choices.map((choice, index) => ({ target: choice.next, path: `nodes.${node.id}.choices[${index}].next` }))
  }
  return []
}

function storyContent(node: StoryNode): StoryContent[] {
  return node.type === 'narrative' || node.type === 'ending' ? node.content : []
}

function isExternalAssetReference(asset: string): boolean {
  return /^(?:https?:|data:|blob:)/i.test(asset)
}

function assetEscapesPackRoot(asset: string): boolean {
  if (asset.startsWith('/') || asset.startsWith('\\') || /^[A-Za-z]:[\\/]/.test(asset)) return true

  let depth = 0
  for (const segment of asset.split(/[\\/]/)) {
    if (!segment || segment === '.') continue
    if (segment === '..') {
      depth -= 1
      if (depth < 0) return true
    } else {
      depth += 1
    }
  }
  return false
}

function validateAssets(nodes: Iterable<StoryNode>, assetPaths: ReadonlySet<string> | undefined, issues: StoryValidationIssue[]) {
  if (!assetPaths) return

  for (const node of nodes) {
    for (const [contentIndex, content] of storyContent(node).entries()) {
      if (content.type !== 'illustration' || isExternalAssetReference(content.asset)) continue
      const path = `nodes.${node.id}.content[${contentIndex}].asset`
      if (assetEscapesPackRoot(content.asset)) {
        issues.push(issue('ASSET_PATH_ESCAPE', `Story-local asset path escapes the Story Pack root: ${content.asset}`, path, node.id))
      } else if (!assetPaths.has(content.asset)) {
        issues.push(issue('ASSET_NOT_FOUND', `Story-local asset was not found: ${content.asset}`, path, node.id))
      }
    }
  }
}

function validateCycles(nodes: Map<string, StoryNode>, edges: Map<string, StoryEdge[]>, issues: StoryValidationIssue[]) {
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const cycleKeys = new Set<string>()
  const stack: string[] = []

  const visit = (nodeId: string) => {
    if (visiting.has(nodeId)) {
      const cycleStart = stack.indexOf(nodeId)
      if (cycleStart >= 0) {
        const cycle = [...stack.slice(cycleStart), nodeId]
        const closed = cycle.slice(0, -1)
        const rotations = closed.map((_item, index) => [...closed.slice(index), ...closed.slice(0, index)])
        const key = (rotations.sort((left, right) => left.join('\u0000').localeCompare(right.join('\u0000')))[0] ?? closed).join('\u0000')
        if (!cycleKeys.has(key)) {
          cycleKeys.add(key)
          issues.push(issue('GRAPH_CYCLE', `Structural cycle: ${cycle.join(' → ')}`, 'graph', cycle[0]))
        }
      }
      return
    }
    if (visited.has(nodeId)) return

    visiting.add(nodeId)
    stack.push(nodeId)
    for (const edge of edges.get(nodeId) ?? []) {
      if (nodes.has(edge.target)) visit(edge.target)
    }
    stack.pop()
    visiting.delete(nodeId)
    visited.add(nodeId)
  }

  for (const nodeId of [...nodes.keys()].sort()) visit(nodeId)
}

function finalize(issues: StoryValidationIssue[]): StoryValidationResult {
  const sortedIssues = sortIssues(issues)
  return { valid: sortedIssues.length === 0, issues: sortedIssues }
}

/**
 * Validate a Story Pack without filesystem access or runtime execution.
 * Filesystem-backed asset keys are supplied by the Node CLI adapter.
 */
export function validateStoryPack(source: StoryPackSource, options: StoryValidationOptions = {}): StoryValidationResult {
  const issues: StoryValidationIssue[] = []
  let manifest: StoryManifest
  try {
    manifest = parseStoryManifest(source.manifest)
  } catch (error) {
    issues.push(schemaIssueForManifest(source.manifest, error))
    return finalize(issues)
  }

  const nodes = new Map<string, StoryNode>()
  let schemaFailure = false
  source.nodes.forEach((rawNode, index) => {
    try {
      const node = parseStoryNode(rawNode)
      if (nodes.has(node.id)) {
        issues.push(issue('DUPLICATE_NODE_ID', `Duplicate Story node id: ${node.id}`, `nodes[${index}].id`, node.id))
        schemaFailure = true
      } else {
        nodes.set(node.id, node)
      }
    } catch (error) {
      issues.push(issue('SCHEMA_INVALID', errorMessage(error), `nodes[${index}]`, rawNodeId(rawNode)))
      schemaFailure = true
    }
  })

  if (schemaFailure) return finalize(issues)

  if (!nodes.has(manifest.entryNode)) {
    issues.push(issue('ENTRY_NOT_FOUND', `Manifest entry node does not exist: ${manifest.entryNode}`, 'manifest.entryNode'))
  }

  const edges = new Map<string, StoryEdge[]>()
  for (const node of nodes.values()) {
    const nodeEdges = outgoingEdges(node)
    edges.set(node.id, nodeEdges)
    for (const edge of nodeEdges) {
      if (!nodes.has(edge.target)) {
        issues.push(issue('TARGET_NOT_FOUND', `Node target does not exist: ${edge.target}`, edge.path, node.id))
      }
    }
  }

  validateAssets(nodes.values(), options.assetPaths, issues)
  validateCycles(nodes, edges, issues)

  const reachable = new Set<string>()
  if (nodes.has(manifest.entryNode)) {
    const queue = [manifest.entryNode]
    while (queue.length > 0) {
      const nodeId = queue.shift() as string
      if (reachable.has(nodeId)) continue
      reachable.add(nodeId)
      for (const edge of edges.get(nodeId) ?? []) {
        if (nodes.has(edge.target) && !reachable.has(edge.target)) queue.push(edge.target)
      }
    }
  }

  for (const nodeId of [...nodes.keys()].sort()) {
    if (!reachable.has(nodeId)) {
      issues.push(issue('NODE_UNREACHABLE', `Node is not reachable from manifest entry: ${nodeId}`, `nodes.${nodeId}`, nodeId))
    }
    const node = nodes.get(nodeId) as StoryNode
    const validTargets = (edges.get(nodeId) ?? []).filter((edge) => nodes.has(edge.target))
    if (node.type !== 'ending' && validTargets.length === 0) {
      issues.push(issue('NON_ENDING_DEAD_END', `Non-ending node has no valid outbound target: ${nodeId}`, `nodes.${nodeId}`, nodeId))
    }
  }

  const reachableEnding = [...reachable].some((nodeId) => nodes.get(nodeId)?.type === 'ending')
  if (!reachableEnding) {
    issues.push(issue('NO_REACHABLE_ENDING', 'No structurally reachable ending node exists', 'graph'))
  }

  return finalize(issues)
}
