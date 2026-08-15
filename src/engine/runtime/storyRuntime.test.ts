import { describe, expect, it } from 'vitest'
import { loadStory } from '../story-loader/loadStory'
import { createStoryRuntime } from './storyRuntime'

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
})
