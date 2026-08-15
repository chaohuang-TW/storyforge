import { StoryLoadError, parseStoryManifest, parseStoryNode } from '../story/schema'
import type { LoadedStory, StoryNode, StoryPackSource } from '../story/types'

function assertLinearPathEnds(nodes: Map<string, StoryNode>, entryNode: string) {
  const visited = new Set<string>()
  let nodeId = entryNode

  while (true) {
    if (visited.has(nodeId)) throw new StoryLoadError(`Linear story cycle detected at node: ${nodeId}`)
    visited.add(nodeId)
    const node = nodes.get(nodeId)
    if (!node) throw new StoryLoadError(`Missing story node: ${nodeId}`)
    if (node.type === 'ending') return
    nodeId = node.next
  }
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
  }
  assertLinearPathEnds(nodes, manifest.entryNode)

  return { manifest, nodes, assets: new Map(Object.entries(source.assets ?? {})) }
}
