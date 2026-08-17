import type { WorldState } from '../causality/types'
import { StoryRuntimeError } from './errors'
import type { LoadedStory, RenderableStoryNode, StoryNode } from '../story/types'

export type RuntimeChoiceRecord = {
  nodeId: string
  choiceId: string
}

export type StoryRuntimeSnapshot = {
  currentNodeId: string
  visibleNodeIds: string[]
  worldState: WorldState
  choiceHistory: RuntimeChoiceRecord[]
  pendingChoiceNodeId?: string
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isRenderableNode(node: StoryNode | undefined): node is RenderableStoryNode {
  return Boolean(node && node.type !== 'conditional' && node.type !== 'choice')
}

function copySnapshotWorldState(value: unknown): WorldState {
  if (!isRecord(value)) throw new StoryRuntimeError('Runtime snapshot worldState must be an object')

  const worldState: WorldState = {}
  for (const [key, stateValue] of Object.entries(value)) {
    if (
      stateValue !== null &&
      typeof stateValue !== 'string' &&
      typeof stateValue !== 'boolean' &&
      typeof stateValue !== 'number'
    ) {
      throw new StoryRuntimeError(`Runtime snapshot worldState key "${key}" is not JSON-safe`)
    }
    if (typeof stateValue === 'number' && !Number.isFinite(stateValue)) {
      throw new StoryRuntimeError(`Runtime snapshot worldState key "${key}" contains a non-finite number`)
    }
    worldState[key] = stateValue
  }
  return worldState
}

function copyChoiceHistory(value: unknown, story: LoadedStory): RuntimeChoiceRecord[] {
  if (!Array.isArray(value)) throw new StoryRuntimeError('Runtime snapshot choiceHistory must be an array')

  return value.map((record, index) => {
    if (!isRecord(record) || typeof record.nodeId !== 'string' || typeof record.choiceId !== 'string') {
      throw new StoryRuntimeError(`Runtime snapshot choiceHistory[${index}] is invalid`)
    }
    const node = story.nodes.get(record.nodeId)
    if (!node || node.type !== 'choice') {
      throw new StoryRuntimeError(`Runtime snapshot choiceHistory references an unknown Choice node: ${record.nodeId}`)
    }
    if (!node.choices.some((choice) => choice.id === record.choiceId)) {
      throw new StoryRuntimeError(`Runtime snapshot choiceHistory references an unknown Choice: ${record.choiceId}`)
    }
    return { nodeId: record.nodeId, choiceId: record.choiceId }
  })
}

export function copyRuntimeSnapshot(snapshot: StoryRuntimeSnapshot): StoryRuntimeSnapshot {
  return {
    currentNodeId: snapshot.currentNodeId,
    visibleNodeIds: [...snapshot.visibleNodeIds],
    worldState: { ...snapshot.worldState },
    choiceHistory: snapshot.choiceHistory.map((record) => ({ ...record })),
    ...(snapshot.pendingChoiceNodeId ? { pendingChoiceNodeId: snapshot.pendingChoiceNodeId } : {}),
  }
}

export function validateRuntimeSnapshot(story: LoadedStory, value: unknown): StoryRuntimeSnapshot {
  if (!isRecord(value)) throw new StoryRuntimeError('Runtime snapshot must be an object')
  if ('readerMemory' in value || 'memory' in value) {
    throw new StoryRuntimeError('Runtime snapshot must not contain Reader Memory')
  }
  if (typeof value.currentNodeId !== 'string') throw new StoryRuntimeError('Runtime snapshot currentNodeId is invalid')
  if (!Array.isArray(value.visibleNodeIds) || value.visibleNodeIds.length === 0) {
    throw new StoryRuntimeError('Runtime snapshot visibleNodeIds must be a non-empty array')
  }
  if (value.visibleNodeIds.some((nodeId) => typeof nodeId !== 'string')) {
    throw new StoryRuntimeError('Runtime snapshot visibleNodeIds must contain strings')
  }

  const visibleNodeIds = value.visibleNodeIds as string[]
  if (new Set(visibleNodeIds).size !== visibleNodeIds.length) {
    throw new StoryRuntimeError('Runtime snapshot visibleNodeIds must not contain duplicates')
  }
  for (const nodeId of visibleNodeIds) {
    if (!isRenderableNode(story.nodes.get(nodeId))) {
      throw new StoryRuntimeError(`Runtime snapshot visibleNodes references an unknown renderable node: ${nodeId}`)
    }
  }
  if (visibleNodeIds.at(-1) !== value.currentNodeId) {
    throw new StoryRuntimeError('Runtime snapshot currentNodeId must be the last visible node')
  }
  if (!isRenderableNode(story.nodes.get(value.currentNodeId))) {
    throw new StoryRuntimeError(`Runtime snapshot currentNodeId is not a renderable node: ${value.currentNodeId}`)
  }

  const worldState = copySnapshotWorldState(value.worldState)
  const choiceHistory = copyChoiceHistory(value.choiceHistory, story)
  let pendingChoiceNodeId: string | undefined
  if (value.pendingChoiceNodeId !== undefined) {
    if (typeof value.pendingChoiceNodeId !== 'string') {
      throw new StoryRuntimeError('Runtime snapshot pendingChoiceNodeId is invalid')
    }
    const pendingNode = story.nodes.get(value.pendingChoiceNodeId)
    if (!pendingNode || pendingNode.type !== 'choice') {
      throw new StoryRuntimeError(`Runtime snapshot pendingChoiceNodeId is not a Choice node: ${value.pendingChoiceNodeId}`)
    }
    if (choiceHistory.some((record) => record.nodeId === value.pendingChoiceNodeId)) {
      throw new StoryRuntimeError('Runtime snapshot pending Choice is already committed')
    }
    if (story.nodes.get(value.currentNodeId)?.type === 'ending') {
      throw new StoryRuntimeError('Runtime snapshot ending cannot have a pending Choice')
    }
    pendingChoiceNodeId = value.pendingChoiceNodeId
  }

  return {
    currentNodeId: value.currentNodeId,
    visibleNodeIds,
    worldState,
    choiceHistory,
    ...(pendingChoiceNodeId ? { pendingChoiceNodeId } : {}),
  }
}
