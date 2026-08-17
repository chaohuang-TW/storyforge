import { evaluateCondition } from '../causality/conditionEngine'
import { applyStoryEffects } from '../causality/effectEngine'
import type { WorldState } from '../causality/types'
import { copyValidatedWorldState } from '../causality/worldState'
import { copyReaderMemory } from '../memory/readerMemory'
import type { ReaderMemory } from '../memory/types'
import type {
  ChoiceStoryNode,
  LoadedStory,
  RenderableStoryNode,
  StoryChoice,
  StoryNode,
  StoryRuntimeState,
} from '../story/types'
import { StoryRuntimeError } from './errors'
import { copyRuntimeSnapshot, validateRuntimeSnapshot, type RuntimeChoiceRecord, type StoryRuntimeSnapshot } from './runtimeSnapshot'

export { StoryRuntimeError } from './errors'
export type { RuntimeChoiceRecord, StoryRuntimeSnapshot } from './runtimeSnapshot'

export type StoryRuntimeOptions = {
  initialWorldState?: WorldState
  snapshot?: StoryRuntimeSnapshot
  readerMemory?: ReaderMemory
}

export type AvailableChoice = {
  id: string
  label: string
}

export type PendingChoice = {
  nodeId: string
  prompt?: string
  choices: AvailableChoice[]
}

export type ChoiceCommit = RuntimeChoiceRecord

export type StoryRuntime = {
  getState: () => StoryRuntimeState
  getWorldState: () => WorldState
  getReaderMemory: () => ReaderMemory
  getCurrentNode: () => RenderableStoryNode
  getVisibleNodes: () => RenderableStoryNode[]
  getPendingChoice: () => PendingChoice | null
  getChoiceHistory: () => ChoiceCommit[]
  exportSnapshot: () => StoryRuntimeSnapshot
  choose: (choiceId: string) => boolean
  advance: () => boolean
  isEnding: () => boolean
}

type RuntimeBoundary = RenderableStoryNode | ChoiceStoryNode

function nodeAt(story: LoadedStory, nodeId: string): StoryNode {
  const node = story.nodes.get(nodeId)
  if (!node) throw new StoryRuntimeError(`Runtime cannot find target node: ${nodeId}`)
  return node
}

function resolveRuntimeBoundary(
  story: LoadedStory,
  targetNodeId: string,
  worldState: WorldState,
  readerMemory: ReaderMemory,
): RuntimeBoundary {
  const visitedConditionalIds = new Set<string>()
  let nodeId = targetNodeId

  while (true) {
    const node = nodeAt(story, nodeId)
    if (node.type !== 'conditional') return node
    if (visitedConditionalIds.has(node.id)) {
      throw new StoryRuntimeError(`Conditional resolution cycle detected at node: ${node.id}`)
    }
    visitedConditionalIds.add(node.id)

    const matchingBranch = node.branches.find((branch) => evaluateCondition(branch.when, worldState, readerMemory))
    nodeId = matchingBranch?.next ?? node.fallback
  }
}

function choiceIsAvailable(choice: StoryChoice, worldState: WorldState, readerMemory: ReaderMemory): boolean {
  return (choice.conditions ?? []).every((condition) => evaluateCondition(condition, worldState, readerMemory))
}

function pendingChoiceFor(node: ChoiceStoryNode, worldState: WorldState, readerMemory: ReaderMemory): PendingChoice {
  const choices = node.choices
    .filter((choice) => choiceIsAvailable(choice, worldState, readerMemory))
    .map(({ id, label }) => ({ id, label }))
  if (choices.length === 0) {
    throw new StoryRuntimeError(`Choice node ${node.id} has no available choices`)
  }
  return { nodeId: node.id, prompt: node.prompt, choices }
}

export function createStoryRuntime(story: LoadedStory, options: StoryRuntimeOptions = {}): StoryRuntime {
  if (options.initialWorldState !== undefined && options.snapshot !== undefined) {
    throw new StoryRuntimeError('Runtime cannot receive both initialWorldState and snapshot')
  }

  if (options.snapshot !== undefined) {
    const restoredSnapshot = validateRuntimeSnapshot(story, options.snapshot)
    const pendingNode = restoredSnapshot.pendingChoiceNodeId
      ? nodeAt(story, restoredSnapshot.pendingChoiceNodeId)
      : null
    const readerMemory = copyReaderMemory(options.readerMemory ?? {})
    if (pendingNode?.type === 'choice') pendingChoiceFor(pendingNode, restoredSnapshot.worldState, readerMemory)

    const state: StoryRuntimeState = {
      currentNodeId: restoredSnapshot.currentNodeId,
      worldState: { ...restoredSnapshot.worldState },
      ...(restoredSnapshot.pendingChoiceNodeId ? { pendingChoiceNodeId: restoredSnapshot.pendingChoiceNodeId } : {}),
    }
    const visibleNodeIds = [...restoredSnapshot.visibleNodeIds]
    const choiceHistory: ChoiceCommit[] = restoredSnapshot.choiceHistory.map((record) => ({ ...record }))

    return createRuntimeApi(story, state, visibleNodeIds, choiceHistory, readerMemory)
  }

  const initialWorldState = copyValidatedWorldState(options.initialWorldState ?? {})
  const readerMemory = copyReaderMemory(options.readerMemory ?? {})
  const entryBoundary = resolveRuntimeBoundary(story, story.manifest.entryNode, initialWorldState, readerMemory)
  if (entryBoundary.type === 'choice') {
    throw new StoryRuntimeError(`Direct Choice entry is not supported in Phase 3B: ${entryBoundary.id}`)
  }

  const entryContext = applyStoryEffects({ worldState: initialWorldState, readerMemory }, entryBoundary.effects ?? [])
  const state: StoryRuntimeState = {
    currentNodeId: entryBoundary.id,
    worldState: entryContext.worldState,
  }
  const visibleNodeIds = [entryBoundary.id]
  const choiceHistory: ChoiceCommit[] = []

  return createRuntimeApi(story, state, visibleNodeIds, choiceHistory, entryContext.readerMemory)
}

function createRuntimeApi(
  story: LoadedStory,
  state: StoryRuntimeState,
  visibleNodeIds: string[],
  choiceHistory: ChoiceCommit[],
  readerMemory: ReaderMemory,
): StoryRuntime {

  const getCurrentNode = (): RenderableStoryNode => {
    const node = nodeAt(story, state.currentNodeId)
    if (node.type === 'conditional' || node.type === 'choice') {
      throw new StoryRuntimeError(`Runtime current node is not renderable: ${node.id}`)
    }
    return node
  }

  const getPendingChoiceNode = (): ChoiceStoryNode | null => {
    if (!state.pendingChoiceNodeId) return null
    const node = nodeAt(story, state.pendingChoiceNodeId)
    if (node.type !== 'choice') {
      throw new StoryRuntimeError(`Runtime pending choice is not a Choice node: ${node.id}`)
    }
    return node
  }

  return {
    getState: () => ({
      currentNodeId: state.currentNodeId,
      worldState: { ...state.worldState },
      ...(state.pendingChoiceNodeId ? { pendingChoiceNodeId: state.pendingChoiceNodeId } : {}),
    }),
    getWorldState: () => ({ ...state.worldState }),
    getReaderMemory: () => copyReaderMemory(readerMemory),
    getCurrentNode,
    getVisibleNodes: () =>
      visibleNodeIds
        .map((id) => nodeAt(story, id))
        .filter((node): node is RenderableStoryNode => node.type !== 'conditional' && node.type !== 'choice'),
    getPendingChoice: () => {
      const node = getPendingChoiceNode()
      return node ? pendingChoiceFor(node, state.worldState, readerMemory) : null
    },
    getChoiceHistory: () => choiceHistory.map((commit) => ({ ...commit })),
    exportSnapshot: () => copyRuntimeSnapshot({
      currentNodeId: state.currentNodeId,
      visibleNodeIds,
      worldState: state.worldState,
      choiceHistory,
      ...(state.pendingChoiceNodeId ? { pendingChoiceNodeId: state.pendingChoiceNodeId } : {}),
    }),
    choose: (choiceId: string) => {
      const pendingNode = getPendingChoiceNode()
      if (!pendingNode) return false

      const choice = pendingNode.choices.find((candidate) => candidate.id === choiceId)
      if (!choice) throw new StoryRuntimeError(`Choice node ${pendingNode.id} has no choice id: ${choiceId}`)
      if (!choiceIsAvailable(choice, state.worldState, readerMemory)) {
        throw new StoryRuntimeError(`Choice ${choiceId} is not available at choice node: ${pendingNode.id}`)
      }

      // Build the complete next snapshot before mutating runtime-owned data.
      const contextAfterChoice = applyStoryEffects({ worldState: state.worldState, readerMemory }, choice.effects ?? [])
      const nextBoundary = resolveRuntimeBoundary(story, choice.next, contextAfterChoice.worldState, contextAfterChoice.readerMemory)
      let nextState: StoryRuntimeState
      let nextVisibleNodeIds = visibleNodeIds

      if (nextBoundary.type === 'choice') {
        pendingChoiceFor(nextBoundary, contextAfterChoice.worldState, contextAfterChoice.readerMemory)
        nextState = {
          currentNodeId: state.currentNodeId,
          worldState: contextAfterChoice.worldState,
          pendingChoiceNodeId: nextBoundary.id,
        }
      } else {
        nextState = {
          currentNodeId: nextBoundary.id,
          worldState: contextAfterChoice.worldState,
        }
        const nextContext = applyStoryEffects(contextAfterChoice, nextBoundary.effects ?? [])
        nextState.worldState = nextContext.worldState
        readerMemory = nextContext.readerMemory
        nextVisibleNodeIds = [...visibleNodeIds, nextBoundary.id]
      }

      if (nextBoundary.type === 'choice') readerMemory = contextAfterChoice.readerMemory

      state = nextState
      visibleNodeIds = nextVisibleNodeIds
      choiceHistory = [...choiceHistory, { nodeId: pendingNode.id, choiceId }]
      return true
    },
    advance: () => {
      if (state.pendingChoiceNodeId) return false
      const currentNode = getCurrentNode()
      if (currentNode.type === 'ending') return false

      const nextBoundary = resolveRuntimeBoundary(story, currentNode.next, state.worldState, readerMemory)
      if (nextBoundary.type === 'choice') {
        pendingChoiceFor(nextBoundary, state.worldState, readerMemory)
        state = { ...state, pendingChoiceNodeId: nextBoundary.id }
        return true
      }

      const nextContext = applyStoryEffects({ worldState: state.worldState, readerMemory }, nextBoundary.effects ?? [])
      state = {
        currentNodeId: nextBoundary.id,
        worldState: nextContext.worldState,
      }
      readerMemory = nextContext.readerMemory
      visibleNodeIds = [...visibleNodeIds, nextBoundary.id]
      return true
    },
    isEnding: () => getCurrentNode().type === 'ending' && !state.pendingChoiceNodeId,
  }
}
