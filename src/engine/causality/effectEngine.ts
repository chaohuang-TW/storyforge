import { StoryRuntimeError } from '../runtime/errors'
import type { Effect, WorldState } from './types'

function numericAmount(amount: number | undefined, effectType: string, key: string): number {
  const value = amount ?? 1
  if (!Number.isFinite(value)) {
    throw new StoryRuntimeError(`${effectType} effect amount must be a finite number for key: ${key}`)
  }
  return value
}

export function applyEffect(state: WorldState, effect: Effect): WorldState {
  const next = { ...state }

  switch (effect.type) {
    case 'set':
      next[effect.key] = effect.value
      return next
    case 'increment': {
      const current = Object.prototype.hasOwnProperty.call(state, effect.key) ? state[effect.key] : 0
      if (typeof current !== 'number' || !Number.isFinite(current)) {
        throw new StoryRuntimeError(`Cannot increment non-number state key: ${effect.key}`)
      }
      next[effect.key] = current + numericAmount(effect.amount, 'increment', effect.key)
      return next
    }
    case 'decrement': {
      const current = Object.prototype.hasOwnProperty.call(state, effect.key) ? state[effect.key] : 0
      if (typeof current !== 'number' || !Number.isFinite(current)) {
        throw new StoryRuntimeError(`Cannot decrement non-number state key: ${effect.key}`)
      }
      next[effect.key] = current - numericAmount(effect.amount, 'decrement', effect.key)
      return next
    }
    case 'setFlag':
      next[effect.key] = true
      return next
    case 'clearFlag':
      delete next[effect.key]
      return next
  }
}

export function applyEffects(state: WorldState, effects: Effect[]): WorldState {
  return effects.reduce((current, effect) => applyEffect(current, effect), { ...state })
}
