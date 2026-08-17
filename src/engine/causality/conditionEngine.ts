import type { Condition, WorldState } from './types'
import { readerRemembers } from '../memory/readerMemory'
import type { ReaderMemory } from '../memory/types'

const hasOwn = (state: WorldState, key: string) => Object.prototype.hasOwnProperty.call(state, key)

function numericValue(state: WorldState, key: string): number | null {
  const value = state[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

export function evaluateCondition(condition: Condition, state: WorldState, memory: ReaderMemory = {}): boolean {
  switch (condition.type) {
    case 'equals':
      return hasOwn(state, condition.key) && state[condition.key] === condition.value
    case 'notEquals':
      return !hasOwn(state, condition.key) || state[condition.key] !== condition.value
    case 'greaterThan': {
      const value = numericValue(state, condition.key)
      return value !== null && value > condition.value
    }
    case 'greaterThanOrEqual': {
      const value = numericValue(state, condition.key)
      return value !== null && value >= condition.value
    }
    case 'lessThan': {
      const value = numericValue(state, condition.key)
      return value !== null && value < condition.value
    }
    case 'lessThanOrEqual': {
      const value = numericValue(state, condition.key)
      return value !== null && value <= condition.value
    }
    case 'exists':
      return hasOwn(state, condition.key)
    case 'notExists':
      return !hasOwn(state, condition.key)
    case 'hasFlag':
      return state[condition.key] === true
    case 'notFlag':
      return state[condition.key] !== true
    case 'readerRemembers':
      return readerRemembers(memory, condition.key)
    case 'all':
      return condition.conditions.every((nested) => evaluateCondition(nested, state, memory))
    case 'any':
      return condition.conditions.some((nested) => evaluateCondition(nested, state, memory))
  }
}
