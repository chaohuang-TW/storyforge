import { StoryRuntimeError } from '../runtime/errors'
import type { WorldState } from './types'

export function assertValidWorldState(state: WorldState): void {
  for (const [key, value] of Object.entries(state)) {
    if (typeof value === 'number' && !Number.isFinite(value)) {
      throw new StoryRuntimeError(`World State key "${key}" contains a non-finite number`)
    }
  }
}

export function copyValidatedWorldState(state: WorldState): WorldState {
  assertValidWorldState(state)
  return { ...state }
}
