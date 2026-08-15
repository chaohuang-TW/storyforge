import { StoryLoadError, parseStoryManifest, parseStoryNode } from '../story/schema'
import type { LoadedStory, StoryNode, StoryPackSource } from '../story/types'

function outgoingNodeIds(node: StoryNode): string[] {
  if (node.type === 'narrative') return [node.next]
  if (node.type === 'conditional') return [...node.branches.map((branch) => branch.next), node.fallback]
  return []
}

function assertAcyclicStoryGraph(nodes: Map<string, StoryNode>, entryNode: string) {
  const visiting = new Set<string>()
  const visited = new Set<string>()

  const visit = (nodeId: string) => {
    if (visiting.has(nodeId)) throw new StoryLoadError(`Story graph cycle detected at node: ${nodeId}`)
    if (visited.has(nodeId)) return

    const node = nodes.get(nodeId)
    if (!node) throw new StoryLoadError(`Missing story node: ${nodeId}`)
    visiting.add(nodeId)
    outgoingNodeIds(node).forEach(visit)
    visiting.delete(nodeId)
    visited.add(nodeId)
  }

  visit(entryNode)
  nodes.forEach((_node, nodeId) => visit(nodeId))
}

export function loadStory(source: StoryPackSource): LoadedStory {
  const manifest = parseStoryManifest(source.manifest)
  const nodes = new Map<string, StoryNode>()

  for (const rawNode of source.nodes) {
    const node = parseStoryNode(rawNode)
    if (nodes.has(node.id)) throw new StoryLoadError(`Duplicate story node id: ${node.id}`)
    nodes.set(node.id, node)
  }

  if (!nodes.has(manifest.entryNode)) throw new StoryLoadError(`Entry node does not exist: ${manifest.entryNode}`)
  for (const node of nodes.values()) {
    if (node.type === 'narrative' && !nodes.has(node.next)) {
      throw new StoryLoadError(`Narrative node ${node.id} references missing next node: ${node.next}`)
    }
    if (node.type === 'conditional') {
      for (const branch of node.branches) {
        if (!nodes.has(branch.next)) {
          throw new StoryLoadError(`Conditional node ${node.id} references missing branch target: ${branch.next}`)
        }
      }
      if (!nodes.has(node.fallback)) {
        throw new StoryLoadError(`Conditional node ${node.id} references missing fallback target: ${node.fallback}`)
      }
    }
  }
  assertAcyclicStoryGraph(nodes, manifest.entryNode)

  return { manifest, nodes, assets: new Map(Object.entries(source.assets ?? {})) }
}
