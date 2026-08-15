import { describe, expect, it } from 'vitest'
import { applyEffect, applyEffects } from './effectEngine'
import { StoryRuntimeError } from '../runtime/errors'

describe('effect engine', () => {
  it('supports set, flags, and clearFlag', () => {
    const state = applyEffects({ old: 'value' }, [
      { type: 'set', key: 'score', value: 2 },
      { type: 'setFlag', key: 'signal' },
      { type: 'clearFlag', key: 'old' },
    ])

    expect(state).toEqual({ score: 2, signal: true })
  })

  it('increments and decrements existing and missing numeric keys', () => {
    expect(applyEffect({ score: 1 }, { type: 'increment', key: 'score', amount: 2 })).toEqual({ score: 3 })
    expect(applyEffect({}, { type: 'increment', key: 'score' })).toEqual({ score: 1 })
    expect(applyEffect({ score: 1 }, { type: 'decrement', key: 'score', amount: 2 })).toEqual({ score: -1 })
    expect(applyEffect({}, { type: 'decrement', key: 'score' })).toEqual({ score: -1 })
  })

  it('applies effects in definition order', () => {
    expect(applyEffects({}, [{ type: 'set', key: 'score', value: 3 }, { type: 'increment', key: 'score', amount: 2 }])).toEqual({ score: 5 })
  })

  it('does not mutate the input state', () => {
    const before = { score: 1 }
    const after = applyEffect(before, { type: 'increment', key: 'score' })

    expect(before).toEqual({ score: 1 })
    expect(after).toEqual({ score: 2 })
    expect(after).not.toBe(before)
  })

  it('throws a clear runtime error for invalid numeric state', () => {
    expect(() => applyEffect({ score: 'high' }, { type: 'increment', key: 'score' })).toThrow(StoryRuntimeError)
    expect(() => applyEffect({ score: 'high' }, { type: 'decrement', key: 'score' })).toThrow('Cannot decrement non-number state key: score')
  })

  it('rejects increment overflow', () => {
    expect(() => applyEffect({ score: 1e308 }, { type: 'increment', key: 'score', amount: 1e308 })).toThrow(
      'increment effect produced a non-finite value for key: score',
    )
  })

  it('rejects decrement overflow', () => {
    expect(() => applyEffect({ score: -1e308 }, { type: 'decrement', key: 'score', amount: 1e308 })).toThrow(
      'decrement effect produced a non-finite value for key: score',
    )
  })

  it('rejects a direct set of a non-finite number', () => {
    expect(() => applyEffect({}, { type: 'set', key: 'score', value: Infinity })).toThrow(
      'World State key "score" contains a non-finite number',
    )
  })

  it('preserves the input state when an effect sequence fails', () => {
    const before = { score: 1e308, untouched: true }

    expect(() => applyEffects(before, [
      { type: 'setFlag', key: 'started' },
      { type: 'increment', key: 'score', amount: 1e308 },
    ])).toThrow(StoryRuntimeError)
    expect(before).toEqual({ score: 1e308, untouched: true })
  })
})
