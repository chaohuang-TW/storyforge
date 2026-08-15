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
