import { describe, expect, it } from 'vitest'
import { evaluateCondition } from './conditionEngine'
import type { WorldState } from './types'

describe('evaluateCondition', () => {
  const state: WorldState = { score: 5, label: '5', enabled: true, empty: null }

  it.each([
    [{ type: 'equals', key: 'score', value: 5 }, true],
    [{ type: 'equals', key: 'score', value: '5' }, false],
    [{ type: 'notEquals', key: 'score', value: 4 }, true],
    [{ type: 'greaterThan', key: 'score', value: 4 }, true],
    [{ type: 'greaterThanOrEqual', key: 'score', value: 5 }, true],
    [{ type: 'lessThan', key: 'score', value: 6 }, true],
    [{ type: 'lessThanOrEqual', key: 'score', value: 5 }, true],
    [{ type: 'exists', key: 'empty' }, true],
    [{ type: 'notExists', key: 'missing' }, true],
    [{ type: 'hasFlag', key: 'enabled' }, true],
    [{ type: 'notFlag', key: 'missing' }, true],
  ] as const)('evaluates %j as %j', (condition, expected) => {
    expect(evaluateCondition(condition, state)).toBe(expected)
  })

  it('does not coerce numeric values', () => {
    expect(evaluateCondition({ type: 'greaterThan', key: 'label', value: 3 }, state)).toBe(false)
    expect(evaluateCondition({ type: 'greaterThan', key: 'missing', value: 3 }, state)).toBe(false)
  })

  it('evaluates nested all and any conditions recursively', () => {
    expect(
      evaluateCondition(
        {
          type: 'all',
          conditions: [
            { type: 'hasFlag', key: 'enabled' },
            { type: 'any', conditions: [{ type: 'equals', key: 'score', value: 5 }, { type: 'exists', key: 'missing' }] },
          ],
        },
        state,
      ),
    ).toBe(true)
  })

  it('does not mutate the state', () => {
    const before = { ...state }
    evaluateCondition({ type: 'equals', key: 'score', value: 5 }, state)
    expect(state).toEqual(before)
  })
})
