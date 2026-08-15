import { describe, expect, it } from 'vitest'
import { loadStory } from '../../engine/story-loader/loadStory'
import { createStoryRuntime } from '../../engine/runtime/storyRuntime'
import type { StoryContent, StoryNode } from '../../engine/story/types'
import { runtimeDemoPack } from './runtimeDemo'

function reachFirstChoice() {
  const runtime = createStoryRuntime(loadStory(runtimeDemoPack))
  runtime.advance()
  runtime.advance()
  return runtime
}

function reachSecondChoice(firstChoice: 'wind' | 'rain') {
  const runtime = reachFirstChoice()
  runtime.choose(firstChoice)
  runtime.advance()
  runtime.advance()
  runtime.advance()
  runtime.advance()
  return runtime
}

function illustrationAssets(node: StoryNode): string[] {
  if (!('content' in node)) return []
  return node.content.flatMap((content: StoryContent) => content.type === 'illustration' ? [content.asset] : [])
}

describe('runtime-demo illustrated causal slice', () => {
  it('loads every Story Pack node and resolves every illustration reference', () => {
    const story = loadStory(runtimeDemoPack)
    expect(story.nodes.size).toBe(14)
    expect([...story.nodes.keys()]).toEqual([
      'prologue', 'chapter-01', 'letter-choice', 'wind-path', 'rain-path', 'after-send',
      'delayed-letter-route', 'delayed-wind', 'delayed-rain', 'second-intervention',
      'second-choice', 'bell-path', 'ferry-path', 'ending',
    ])

    const refs = [...story.nodes.values()].flatMap(illustrationAssets)
    expect(refs).toHaveLength(9)
    expect(refs.every((asset) => story.assets.has(asset))).toBe(true)
  })

  it('commits the wind route through immediate and delayed consequences', () => {
    const runtime = reachFirstChoice()
    expect(runtime.getPendingChoice()?.nodeId).toBe('letter-choice')
    runtime.choose('wind')
    expect(runtime.getWorldState()).toEqual({ 'letter-entered': true })
    expect(runtime.getCurrentNode().id).toBe('wind-path')
    runtime.advance()
    runtime.advance()
    expect(runtime.getCurrentNode().id).toBe('delayed-wind')
    runtime.advance()
    runtime.advance()
    expect(runtime.getPendingChoice()?.nodeId).toBe('second-choice')
    runtime.choose('bell')
    expect(runtime.getWorldState()).toEqual({ 'letter-entered': true, 'bell-early': true })
    expect(runtime.getCurrentNode().id).toBe('bell-path')
    runtime.advance()
    expect(runtime.isEnding()).toBe(true)
    expect(runtime.getCurrentNode().id).toBe('ending')
  })

  it('commits the rain route through immediate and delayed consequences', () => {
    const runtime = reachSecondChoice('rain')
    expect(runtime.getCurrentNode().id).toBe('second-intervention')
    runtime.advance()
    expect(runtime.getPendingChoice()?.nodeId).toBe('second-choice')
    runtime.choose('ferry')
    expect(runtime.getWorldState()).toEqual({ 'ink-washed': true, 'ferry-held': true })
    expect(runtime.getCurrentNode().id).toBe('ferry-path')
    runtime.advance()
    expect(runtime.isEnding()).toBe(true)
  })

  it('keeps branch-specific illustrations and narrative isolated', () => {
    const wind = reachFirstChoice()
    wind.choose('wind')
    expect(wind.getCurrentNode().content.some((content) => content.type === 'illustration' && content.asset === 'wind-letter')).toBe(true)
    expect(wind.getCurrentNode().content.some((content) => content.type === 'illustration' && content.asset === 'rain-ink')).toBe(false)

    const rain = reachFirstChoice()
    rain.choose('rain')
    expect(rain.getCurrentNode().content.some((content) => content.type === 'illustration' && content.asset === 'rain-ink')).toBe(true)
    expect(rain.getCurrentNode().content.some((content) => content.type === 'illustration' && content.asset === 'wind-letter')).toBe(false)
  })
})
