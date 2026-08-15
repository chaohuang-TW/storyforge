import type { LoadedStory, StoryNode, StoryRuntimeState } from '../story/types'

export type StoryRuntime = {
  getState: () => StoryRuntimeState
  getCurrentNode: () => StoryNode
  getVisibleNodes: () => StoryNode[]
  advance: () => boolean
  isEnding: () => boolean
}

export function createStoryRuntime(story: LoadedStory): StoryRuntime {
  let state: StoryRuntimeState = { currentNodeId: story.manifest.entryNode }
  const visibleNodeIds = [state.currentNodeId]

  const getCurrentNode = () => {
    const node = story.nodes.get(state.currentNodeId)
    if (!node) throw new Error(`Runtime cannot find current node: ${state.currentNodeId}`)
    return node
  }

  return {
    getState: () => ({ ...state }),
    getCurrentNode,
    getVisibleNodes: () => visibleNodeIds.map((id) => story.nodes.get(id)!).filter(Boolean),
    advance: () => {
      const node = getCurrentNode()
      if (node.type === 'ending') return false
      state = { currentNodeId: node.next }
      visibleNodeIds.push(node.next)
      return true
    },
    isEnding: () => getCurrentNode().type === 'ending',
  }
}
