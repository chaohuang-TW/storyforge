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

  it('parses Reader Memory conditions and effects while retaining schema 0.1', () => {
    expect(parseCondition({ type: 'readerRemembers', key: 'saw-signal' })).toEqual({ type: 'readerRemembers', key: 'saw-signal' })
    expect(parseEffect({ type: 'remember', key: 'saw-signal' })).toEqual({ type: 'remember', key: 'saw-signal' })
    expect(() => parseCondition({ type: 'readerRemembers', key: '' })).toThrow('non-empty string')
    expect(() => parseEffect({ type: 'remember', key: '' })).toThrow('non-empty string')
    expect(() => parseCondition({ type: 'readerMemory', key: 'saw-signal' })).toThrow('Unsupported condition type')
    expect(() => parseEffect({ type: 'remembered', key: 'saw-signal' })).toThrow('Unsupported effect type')
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

describe('Phase 3B choice schema', () => {
  const validChoice = {
    id: 'letter-choice',
    type: 'choice',
    prompt: 'Choose.',
    choices: [
      {
        id: 'open',
        label: 'Open it',
        conditions: [{ type: 'hasFlag', key: 'ready' }],
        effects: [{ type: 'setFlag', key: 'opened' }],
        next: 'ending',
      },
    ],
  }

  it('parses a valid choice node with conditions, effects, and prompt', () => {
    expect(parseStoryNode(validChoice)).toEqual({
      id: 'letter-choice',
      type: 'choice',
      prompt: 'Choose.',
      choices: [
        {
          id: 'open',
          label: 'Open it',
          conditions: [{ type: 'hasFlag', key: 'ready' }],
          effects: [{ type: 'setFlag', key: 'opened' }],
          next: 'ending',
        },
      ],
    })
  })

  it('rejects empty choices and duplicate choice ids within a node', () => {
    expect(() => parseStoryNode({ id: 'empty', type: 'choice', choices: [] })).toThrow(
      'Choice node empty.choices must contain at least one choice',
    )
    expect(() =>
      parseStoryNode({
        id: 'duplicate',
        type: 'choice',
        choices: [
          { id: 'same', label: 'First', next: 'ending' },
          { id: 'same', label: 'Second', next: 'ending' },
        ],
      }),
    ).toThrow('Choice node duplicate has duplicate choice id: same')
  })

  it.each([
    { choices: [{ id: '', label: 'Open', next: 'ending' }], message: '.id must be a non-empty string' },
    { choices: [{ id: 'open', label: '', next: 'ending' }], message: '.label must be a non-empty string' },
    { choices: [{ id: 'open', label: 'Open', next: '' }], message: '.next must be a non-empty string' },
    { choices: [{ id: 'open', label: 'Open', conditions: [], next: 'ending' }], message: 'must contain at least one condition' },
  ])('rejects an invalid choice item', ({ choices, message }) => {
    expect(() => parseStoryNode({ id: 'invalid', type: 'choice', choices })).toThrow(message)
  })

  it('continues to reject unknown conditions and effects inside choices', () => {
    expect(() =>
      parseStoryNode({
        id: 'invalid-condition',
        type: 'choice',
        choices: [{ id: 'a', label: 'A', conditions: [{ type: 'mystery' }], next: 'ending' }],
      }),
    ).toThrow('Unsupported condition type: mystery')
    expect(() =>
      parseStoryNode({
        id: 'invalid-effect',
        type: 'choice',
        choices: [{ id: 'a', label: 'A', effects: [{ type: 'mystery' }], next: 'ending' }],
      }),
    ).toThrow('Unsupported effect type: mystery')
  })

  it.each(['content', 'effects', 'title', 'next'])('rejects Choice node field %s', (field) => {
    expect(() =>
      parseStoryNode({
        id: 'invalid-node',
        type: 'choice',
        choices: [{ id: 'a', label: 'A', next: 'ending' }],
        [field]: field === 'content' || field === 'effects' ? [] : 'invalid',
      }),
    ).toThrow(`Choice node invalid-node must not define ${field}`)
  })
})
