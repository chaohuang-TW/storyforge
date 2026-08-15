import { describe, expect, it } from 'vitest'
import { loadStory } from '../story-loader/loadStory'
import type { LoadedStory } from '../story/types'
import { StoryRuntimeError, createStoryRuntime } from './storyRuntime'

const story = loadStory({
  manifest: { id: 'runtime-test', title: 'Runtime Test', version: '0.1.0', schemaVersion: '0.1', language: 'zh-TW', entryNode: 'prologue' },
  nodes: [
    { id: 'prologue', type: 'narrative', content: [], next: 'chapter-01' },
    { id: 'chapter-01', type: 'narrative', content: [], next: 'ending' },
    { id: 'ending', type: 'ending', content: [] },
  ],
})

describe('createStoryRuntime', () => {
  it('advances a deterministic linear path and retains visible nodes', () => {
    const runtime = createStoryRuntime(story)

    expect(runtime.getCurrentNode().id).toBe('prologue')
    expect(runtime.getVisibleNodes().map((node) => node.id)).toEqual(['prologue'])
    expect(runtime.advance()).toBe(true)
    expect(runtime.getCurrentNode().id).toBe('chapter-01')
    expect(runtime.getVisibleNodes().map((node) => node.id)).toEqual(['prologue', 'chapter-01'])
    expect(runtime.advance()).toBe(true)
    expect(runtime.isEnding()).toBe(true)
    expect(runtime.getVisibleNodes().map((node) => node.id)).toEqual(['prologue', 'chapter-01', 'ending'])
    expect(runtime.advance()).toBe(false)
  })

  it('applies entry effects once and exposes defensive world state copies', () => {
    const effectStory = loadStory({
      manifest: { id: 'effect-test', title: 'Effect Test', version: '0.1.0', schemaVersion: '0.1', language: 'zh-TW', entryNode: 'start' },
      nodes: [
        {
          id: 'start',
          type: 'narrative',
          content: [],
          effects: [{ type: 'set', key: 'counter', value: 1 }, { type: 'setFlag', key: 'signal' }],
          next: 'ending',
        },
        { id: 'ending', type: 'ending', content: [], effects: [{ type: 'increment', key: 'counter' }] },
      ],
    })
    const runtime = createStoryRuntime(effectStory)

    expect(runtime.getWorldState()).toEqual({ counter: 1, signal: true })
    expect(runtime.getState().worldState).toEqual({ counter: 1, signal: true })
    runtime.getWorldState().counter = 99
    runtime.getState().worldState.signal = false
    expect(runtime.getWorldState()).toEqual({ counter: 1, signal: true })
    runtime.getCurrentNode()
    runtime.getVisibleNodes()
    runtime.getState()
    expect(runtime.getWorldState().counter).toBe(1)
    expect(runtime.advance()).toBe(true)
    expect(runtime.getWorldState().counter).toBe(2)
    expect(runtime.advance()).toBe(false)
    expect(runtime.getWorldState().counter).toBe(2)
  })

  it('rejects an initial World State Infinity value', () => {
    expect(() => createStoryRuntime(story, { initialWorldState: { score: Infinity } })).toThrow(
      'World State key "score" contains a non-finite number',
    )
  })

  it('rejects an initial World State NaN value', () => {
    expect(() => createStoryRuntime(story, { initialWorldState: { score: NaN } })).toThrow(
      'World State key "score" contains a non-finite number',
    )
  })

  it('rejects an initial World State negative Infinity value', () => {
    expect(() => createStoryRuntime(story, { initialWorldState: { score: -Infinity } })).toThrow(
      'World State key "score" contains a non-finite number',
    )
  })

  it('accepts valid finite initial World State values', () => {
    const initialWorldState = { score: 10, trust: -2.5, flag: true, label: 'x', empty: null }
    const runtime = createStoryRuntime(story, { initialWorldState })

    expect(runtime.getWorldState()).toEqual(initialWorldState)
  })

  it('routes to the first matching conditional branch without exposing the control node', () => {
    const conditionalStory = loadStory({
      manifest: { id: 'conditional-test', title: 'Conditional Test', version: '0.1.0', schemaVersion: '0.1', language: 'zh-TW', entryNode: 'start' },
      nodes: [
        { id: 'start', type: 'narrative', content: [], effects: [{ type: 'setFlag', key: 'signal' }], next: 'route' },
        {
          id: 'route',
          type: 'conditional',
          branches: [
            { when: { type: 'hasFlag', key: 'signal' }, next: 'first' },
            { when: { type: 'hasFlag', key: 'signal' }, next: 'second' },
          ],
          fallback: 'fallback',
        },
        { id: 'first', type: 'narrative', content: [], next: 'ending' },
        { id: 'second', type: 'narrative', content: [], next: 'ending' },
        { id: 'fallback', type: 'narrative', content: [], next: 'ending' },
        { id: 'ending', type: 'ending', content: [] },
      ],
    })
    const runtime = createStoryRuntime(conditionalStory)

    expect(runtime.advance()).toBe(true)
    expect(runtime.getCurrentNode().id).toBe('first')
    expect(runtime.getVisibleNodes().map((node) => node.id)).toEqual(['start', 'first'])
  })

  it('uses fallback when no branch matches and supports initial state', () => {
    const conditionalStory = loadStory({
      manifest: { id: 'fallback-test', title: 'Fallback Test', version: '0.1.0', schemaVersion: '0.1', language: 'zh-TW', entryNode: 'start' },
      nodes: [
        { id: 'start', type: 'narrative', content: [], next: 'route' },
        { id: 'route', type: 'conditional', branches: [{ when: { type: 'hasFlag', key: 'signal' }, next: 'true-path' }], fallback: 'fallback' },
        { id: 'true-path', type: 'narrative', content: [], next: 'ending' },
        { id: 'fallback', type: 'narrative', content: [], next: 'ending' },
        { id: 'ending', type: 'ending', content: [] },
      ],
    })
    const runtime = createStoryRuntime(conditionalStory, { initialWorldState: {} })

    runtime.advance()
    expect(runtime.getCurrentNode().id).toBe('fallback')
  })

  it('uses the latest state after an effect to resolve a later condition', () => {
    const stateStory = loadStory({
      manifest: { id: 'state-routing-test', title: 'State Routing Test', version: '0.1.0', schemaVersion: '0.1', language: 'zh-TW', entryNode: 'start' },
      nodes: [
        { id: 'start', type: 'narrative', content: [], effects: [{ type: 'increment', key: 'trust', amount: 2 }], next: 'route' },
        { id: 'route', type: 'conditional', branches: [{ when: { type: 'greaterThanOrEqual', key: 'trust', value: 2 }, next: 'trusted' }], fallback: 'untrusted' },
        { id: 'trusted', type: 'narrative', content: [], next: 'ending' },
        { id: 'untrusted', type: 'narrative', content: [], next: 'ending' },
        { id: 'ending', type: 'ending', content: [] },
      ],
    })
    const runtime = createStoryRuntime(stateStory)

    runtime.advance()
    expect(runtime.getWorldState()).toEqual({ trust: 2 })
    expect(runtime.getCurrentNode().id).toBe('trusted')
  })

  it('guards against conditional resolution cycles even without loader validation', () => {
    const cyclicStory = {
      manifest: { id: 'cycle-test', title: 'Cycle Test', version: '0.1.0', schemaVersion: '0.1', language: 'zh-TW', entryNode: 'start' },
      nodes: new Map([
        ['start', { id: 'start', type: 'narrative', content: [], next: 'route' }],
        ['route', { id: 'route', type: 'conditional', branches: [{ when: { type: 'exists', key: 'never' }, next: 'route' }], fallback: 'route' }],
      ]),
      assets: new Map(),
    } as LoadedStory

    const runtime = createStoryRuntime(cyclicStory)
    expect(() => runtime.advance()).toThrow(StoryRuntimeError)
    expect(() => runtime.advance()).toThrow('Conditional resolution cycle detected at node: route')
  })
})

function choiceStory(choiceOverrides: Record<string, unknown> = {}) {
  return loadStory({
    manifest: { id: 'choice-test', title: 'Choice Test', version: '0.1.0', schemaVersion: '0.1', language: 'zh-TW', entryNode: 'start' },
    nodes: [
      { id: 'start', type: 'narrative', content: [], next: 'choice' },
      {
        id: 'choice',
        type: 'choice',
        prompt: 'Choose a path.',
        choices: [
          { id: 'available', label: 'Available', effects: [{ type: 'increment', key: 'counter' }], next: 'consequence' },
          { id: 'locked', label: 'Locked', conditions: [{ type: 'hasFlag', key: 'locked-open' }], next: 'ending' },
        ],
        ...choiceOverrides,
      },
      { id: 'consequence', type: 'narrative', content: [], next: 'ending' },
      { id: 'ending', type: 'ending', content: [] },
    ],
  })
}

describe('Phase 3B choice runtime', () => {
  it('halts at a Choice boundary without adding it to visible nodes', () => {
    const runtime = createStoryRuntime(choiceStory())

    expect(runtime.advance()).toBe(true)
    expect(runtime.getVisibleNodes().map((node) => node.id)).toEqual(['start'])
    expect(runtime.getCurrentNode().id).toBe('start')
    expect(runtime.getState().pendingChoiceNodeId).toBe('choice')
    expect(runtime.getPendingChoice()).toEqual({
      nodeId: 'choice',
      prompt: 'Choose a path.',
      choices: [{ id: 'available', label: 'Available' }],
    })
  })

  it('blocks advance while a choice is pending', () => {
    const runtime = createStoryRuntime(choiceStory())
    runtime.advance()
    const before = runtime.getState()

    expect(runtime.advance()).toBe(false)
    expect(runtime.getState()).toEqual(before)
    expect(runtime.getPendingChoice()?.nodeId).toBe('choice')
  })

  it('commits an available choice once, applies effects, appends its consequence, and records history', () => {
    const runtime = createStoryRuntime(choiceStory())
    runtime.advance()

    expect(runtime.choose('available')).toBe(true)
    expect(runtime.getWorldState()).toEqual({ counter: 1 })
    expect(runtime.getPendingChoice()).toBeNull()
    expect(runtime.getCurrentNode().id).toBe('consequence')
    expect(runtime.getVisibleNodes().map((node) => node.id)).toEqual(['start', 'consequence'])
    expect(runtime.getChoiceHistory()).toEqual([{ nodeId: 'choice', choiceId: 'available' }])

    expect(runtime.choose('available')).toBe(false)
    expect(runtime.getWorldState()).toEqual({ counter: 1 })
    expect(runtime.getChoiceHistory()).toHaveLength(1)
  })

  it('returns defensive Choice history copies', () => {
    const runtime = createStoryRuntime(choiceStory())
    runtime.advance()
    runtime.choose('available')

    const history = runtime.getChoiceHistory()
    history.push({ nodeId: 'fake', choiceId: 'fake' })
    history[0].choiceId = 'changed'

    expect(runtime.getChoiceHistory()).toEqual([{ nodeId: 'choice', choiceId: 'available' }])
  })

  it('rejects invalid and unavailable choice ids without changing state', () => {
    const runtime = createStoryRuntime(choiceStory())
    runtime.advance()
    const before = runtime.getState()

    expect(() => runtime.choose('missing')).toThrow('Choice node choice has no choice id: missing')
    expect(() => runtime.choose('locked')).toThrow('Choice locked is not available at choice node: choice')
    expect(runtime.getState()).toEqual(before)
    expect(runtime.getChoiceHistory()).toEqual([])
  })

  it('throws when a Choice boundary has no available choices', () => {
    const runtime = createStoryRuntime(
      choiceStory({
        choices: [{ id: 'locked', label: 'Locked', conditions: [{ type: 'hasFlag', key: 'never' }], next: 'ending' }],
      }),
    )

    expect(() => runtime.advance()).toThrow('Choice node choice has no available choices')
    expect(runtime.getVisibleNodes().map((node) => node.id)).toEqual(['start'])
    expect(runtime.getPendingChoice()).toBeNull()
  })

  it('applies choice effects before conditional routing', () => {
    const causalStory = loadStory({
      manifest: { id: 'causal-route', title: 'Causal Route', version: '0.1.0', schemaVersion: '0.1', language: 'zh-TW', entryNode: 'start' },
      nodes: [
        { id: 'start', type: 'narrative', content: [], next: 'choice' },
        {
          id: 'choice',
          type: 'choice',
          choices: [{ id: 'reveal', label: 'Reveal', effects: [{ type: 'setFlag', key: 'secret' }], next: 'route' }],
        },
        { id: 'route', type: 'conditional', branches: [{ when: { type: 'hasFlag', key: 'secret' }, next: 'secret-path' }], fallback: 'normal-path' },
        { id: 'secret-path', type: 'narrative', content: [], next: 'ending' },
        { id: 'normal-path', type: 'narrative', content: [], next: 'ending' },
        { id: 'ending', type: 'ending', content: [] },
      ],
    })
    const runtime = createStoryRuntime(causalStory)
    runtime.advance()

    runtime.choose('reveal')

    expect(runtime.getWorldState()).toEqual({ secret: true })
    expect(runtime.getCurrentNode().id).toBe('secret-path')
  })

  it('keeps the entire runtime snapshot unchanged when a causal commit fails', () => {
    const overflowStory = choiceStory({
      choices: [
        {
          id: 'overflow',
          label: 'Overflow',
          effects: [{ type: 'increment', key: 'score', amount: Number.MAX_VALUE }],
          next: 'consequence',
        },
      ],
    })
    const runtime = createStoryRuntime(overflowStory, { initialWorldState: { score: Number.MAX_VALUE } })
    runtime.advance()
    const stateBefore = runtime.getState()
    const visibleBefore = runtime.getVisibleNodes()
    const pendingBefore = runtime.getPendingChoice()

    expect(() => runtime.choose('overflow')).toThrow('increment effect produced a non-finite value for key: score')
    expect(runtime.getState()).toEqual(stateBefore)
    expect(runtime.getVisibleNodes()).toEqual(visibleBefore)
    expect(runtime.getPendingChoice()).toEqual(pendingBefore)
    expect(runtime.getChoiceHistory()).toEqual([])
  })

  it('supports Choice to Choice without rendering either control node', () => {
    const chainedStory = loadStory({
      manifest: { id: 'chained-choice', title: 'Chained Choice', version: '0.1.0', schemaVersion: '0.1', language: 'zh-TW', entryNode: 'start' },
      nodes: [
        { id: 'start', type: 'narrative', content: [], next: 'choice-a' },
        { id: 'choice-a', type: 'choice', choices: [{ id: 'a', label: 'A', next: 'choice-b' }] },
        { id: 'choice-b', type: 'choice', choices: [{ id: 'b', label: 'B', next: 'ending' }] },
        { id: 'ending', type: 'ending', content: [], effects: [{ type: 'increment', key: 'arrivals' }] },
      ],
    })
    const runtime = createStoryRuntime(chainedStory)
    runtime.advance()

    expect(runtime.choose('a')).toBe(true)
    expect(runtime.getPendingChoice()?.nodeId).toBe('choice-b')
    expect(runtime.getVisibleNodes().map((node) => node.id)).toEqual(['start'])
    expect(runtime.choose('b')).toBe(true)
    expect(runtime.isEnding()).toBe(true)
    expect(runtime.getWorldState().arrivals).toBe(1)
    expect(runtime.advance()).toBe(false)
    expect(runtime.getWorldState().arrivals).toBe(1)
  })

  it('rejects direct Choice entry in Phase 3B', () => {
    const directChoiceStory = loadStory({
      manifest: { id: 'direct-choice', title: 'Direct Choice', version: '0.1.0', schemaVersion: '0.1', language: 'zh-TW', entryNode: 'choice' },
      nodes: [
        { id: 'choice', type: 'choice', choices: [{ id: 'go', label: 'Go', next: 'ending' }] },
        { id: 'ending', type: 'ending', content: [] },
      ],
    })

    expect(() => createStoryRuntime(directChoiceStory)).toThrow('Direct Choice entry is not supported in Phase 3B: choice')
  })
})
