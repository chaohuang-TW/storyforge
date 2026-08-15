import { evaluateCondition } from '../causality/conditionEngine'
import { applyEffects } from '../causality/effectEngine'
import type { WorldState } from '../causality/types'
import { copyValidatedWorldState } from '../causality/worldState'
import type { LoadedStory, RenderableStoryNode, StoryNode, StoryRuntimeState } from '../story/types'
import { StoryRuntimeError } from './errors'

export { StoryRuntimeError } from './errors'

export type StoryRuntimeOptions = {
  initialWorldState?: WorldState
}

export type StoryRuntime = {
  getState: () => StoryRuntimeState
  getWorldState: () => WorldState
  getCurrentNode: () => RenderableStoryNode
  getVisibleNodes: () => RenderableStoryNode[]
  advance: () => boolean
  isEnding: () => boolean
}

function nodeAt(story: LoadedStory, nodeId: string): StoryNode {
  const node = story.nodes.get(nodeId)
  if (!node) throw new StoryRuntimeError(`Runtime cannot find target node: ${nodeId}`)
  return node
}

function resolveVisibleNode(story: LoadedStory, targetNodeId: string, worldState: WorldState): RenderableStoryNode {
  const visitedConditionalIds = new Set<string>()
  let nodeId = targetNodeId

  while (true) {
    const node = nodeAt(story, nodeId)
    if (node.type !== 'conditional') return node
    if (visitedConditionalIds.has(node.id)) {
      throw new StoryRuntimeError(`Conditional resolution cycle detected at node: ${node.id}`)
    }
    visitedConditionalIds.add(node.id)

    const matchingBranch = node.branches.find((branch) => evaluateCondition(branch.when, worldState))
    nodeId = matchingBranch?.next ?? node.fallback
  }
}

export function createStoryRuntime(story: LoadedStory, options: StoryRuntimeOptions = {}): StoryRuntime {
  const initialWorldState = copyValidatedWorldState(options.initialWorldState ?? {})
  const entryNode = resolveVisibleNode(story, story.manifest.entryNode, initialWorldState)
  let state: StoryRuntimeState = {
    currentNodeId: entryNode.id,
    worldState: applyEffects(initialWorldState, entryNode.effects ?? []),
  }
  const visibleNodeIds = [entryNode.id]

  const getCurrentNode = (): RenderableStoryNode => {
    const node = nodeAt(story, state.currentNodeId)
    if (node.type === 'conditional') {
      throw new StoryRuntimeError(`Runtime current node is not renderable: ${node.id}`)
    }
    return node
  }

  return {
    getState: () => ({ currentNodeId: state.currentNodeId, worldState: { ...state.worldState } }),
    getWorldState: () => ({ ...state.worldState }),
    getCurrentNode,
    getVisibleNodes: () => visibleNodeIds.map((id) => nodeAt(story, id)).filter((node): node is RenderableStoryNode => node.type !== 'conditional'),
    advance: () => {
      const currentNode = getCurrentNode()
      if (currentNode.type === 'ending') return false

      const nextNode = resolveVisibleNode(story, currentNode.next, state.worldState)
      state = {
        currentNodeId: nextNode.id,
        worldState: applyEffects(state.worldState, nextNode.effects ?? []),
      }
      visibleNodeIds.push(nextNode.id)
      return true
    },
    isEnding: () => getCurrentNode().type === 'ending',
  }
}
