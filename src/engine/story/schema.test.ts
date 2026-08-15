import { describe, expect, it } from 'vitest'
import { parseCondition, parseEffect, parseStoryNode, StoryLoadError } from './schema'

describe('Phase 3A story schema', () => {
  it('parses narrative and ending effects without changing schema version', () => {
    expect(
      parseStoryNode({
        id: 'start',
        type: 'narrative',
        content: [],
        effects: [{ type: 'setFlag', key: 'signal-seen' }],
        next: 'ending',
      }),
    ).toMatchObject({ effects: [{ type: 'setFlag', key: 'signal-seen' }] })
    expect(parseStoryNode({ id: 'ending', type: 'ending', content: [], effects: [{ type: 'increment', key: 'trust' }] })).toMatchObject({
      effects: [{ type: 'increment', key: 'trust', amount: undefined }],
    })
  })

  it('parses a conditional node and recursive conditions', () => {
    expect(
      parseStoryNode({
        id: 'route',
        type: 'conditional',
        branches: [
          {
            when: { type: 'all', conditions: [{ type: 'hasFlag', key: 'signal' }, { type: 'greaterThan', key: 'trust', value: 1 }] },
            next: 'true-path',
          },
        ],
        fallback: 'false-path',
      }),
    ).toMatchObject({ type: 'conditional', fallback: 'false-path' })
  })

  it.each([
    { type: 'unknown', key: 'x' },
    { type: 'greaterThan', key: 'x', value: '5' },
    { type: 'all', conditions: [] },
    { type: 'any', conditions: [] },
  ])('rejects invalid condition %j', (condition) => {
    expect(() => parseCondition(condition)).toThrow(StoryLoadError)
  })

  it('rejects invalid effect types and values', () => {
    expect(() => parseEffect({ type: 'unknown', key: 'x' })).toThrow('Unsupported effect type: unknown')
    expect(() => parseEffect({ type: 'set', key: 'x', value: { nested: true } })).toThrow('JSON-safe primitive')
    expect(() => parseEffect({ type: 'increment', key: 'x', amount: '2' })).toThrow('amount must be a number')
  })

  it('rejects empty or side-effectful conditional nodes', () => {
    expect(() => parseStoryNode({ id: 'route', type: 'conditional', branches: [], fallback: 'end' })).toThrow('at least one branch')
    expect(() => parseStoryNode({ id: 'route', type: 'conditional', branches: [{ when: { type: 'exists', key: 'x' } }], fallback: 'end' })).toThrow(
      'next must be a non-empty string',
    )
    expect(() => parseStoryNode({ id: 'route', type: 'conditional', branches: [{ when: { type: 'exists', key: 'x' }, next: 'end' }] })).toThrow(
      'fallback must be a non-empty string',
    )
    expect(() => parseStoryNode({ id: 'route', type: 'conditional', content: [], branches: [{ when: { type: 'exists', key: 'x' }, next: 'end' }], fallback: 'end' })).toThrow(
      'must not define content',
    )
  })
})
