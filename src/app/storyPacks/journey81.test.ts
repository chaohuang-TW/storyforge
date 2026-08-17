import { describe, expect, it } from 'vitest'
import { createStoryRuntime } from '../../engine/runtime/storyRuntime'
import { loadStory } from '../../engine/story-loader/loadStory'
import type { StoryContent, StoryNode } from '../../engine/story/types'
import { journey81Pack } from './journey81'

const story = loadStory(journey81Pack)
const memoryKey = 'journey81.white-bone-truth'

function illustrationAssets(node: StoryNode): string[] {
  if (!('content' in node)) return []
  return node.content.flatMap((content: StoryContent) => content.type === 'illustration' ? [content.asset] : [])
}

function visibleText(runtime: ReturnType<typeof createStoryRuntime>): string {
  return runtime.getVisibleNodes().flatMap((node) => node.content.flatMap((content) => {
    if (content.type === 'dialogue') return content.lines
    if (content.type === 'heading' || content.type === 'paragraph' || content.type === 'quote') return [content.text]
    return []
  })).join('\n')
}

function advanceUntil(runtime: ReturnType<typeof createStoryRuntime>, nodeId: string) {
  for (let index = 0; index < 80; index += 1) {
    if (runtime.getCurrentNode().id === nodeId) return
    if (runtime.getPendingChoice()?.nodeId === nodeId) return
    if (!runtime.advance()) throw new Error(`Runtime stopped before ${nodeId}`)
  }
  throw new Error(`Runtime did not reach ${nodeId}`)
}

function reachWhiteboneChoice(firstChoice: 'light' | 'mist', readerMemory = {}) {
  const runtime = createStoryRuntime(story, { readerMemory })
  advanceUntil(runtime, 'wuxing-choice')
  runtime.choose(firstChoice)
  advanceUntil(runtime, 'whitebone-choice')
  return runtime
}

function finish(runtime: ReturnType<typeof createStoryRuntime>, secondChoice: 'canon' | 'water' | 'memory') {
  runtime.choose(secondChoice)
  advanceUntil(runtime, 'ending-001')
  expect(runtime.isEnding()).toBe(true)
}

describe('Journey81 Story Pack vertical slice', () => {
  it('loads the manifest, 34 nodes, and all 12 exact illustration keys', () => {
    expect(story.manifest).toMatchObject({
      id: 'journey81',
      title: '西遊：八十一劫',
      version: '0.1.0',
      schemaVersion: '0.1',
      language: 'zh-TW',
      entryNode: 'prologue-001',
    })
    expect(story.nodes.size).toBe(34)
    const refs = [...story.nodes.values()].flatMap(illustrationAssets)
    expect(new Set(refs)).toHaveLength(12)
    expect(refs.every((asset) => story.assets.has(asset))).toBe(true)
    expect(story.assets.size).toBe(12)
  })

  it('keeps the first-run Memory choice hidden', () => {
    const runtime = reachWhiteboneChoice('light')
    expect(runtime.getPendingChoice()?.choices.map((choice) => choice.id)).toEqual(['canon', 'water'])
  })

  it.each([
    ['light', 'canon'],
    ['light', 'water'],
    ['mist', 'canon'],
    ['mist', 'water'],
  ] as const)('reaches the shared ending on first run: %s × %s', (firstChoice, secondChoice) => {
    const runtime = reachWhiteboneChoice(firstChoice)
    finish(runtime, secondChoice)
    expect(runtime.getReaderMemory()).toEqual({ [memoryKey]: true })
    expect(runtime.getWorldState()).toMatchObject({
      wuxing_first_touch: firstChoice,
      whitebone_intervention: secondChoice,
    })
  })

  it.each(['light', 'mist'] as const)('preserves only the truth Memory flag across a fresh Runtime: %s', (firstChoice) => {
    const firstRun = reachWhiteboneChoice(firstChoice)
    finish(firstRun, 'water')
    const secondRun = createStoryRuntime(story, { readerMemory: firstRun.getReaderMemory() })

    expect(secondRun.getWorldState()).toEqual({})
    expect(secondRun.getChoiceHistory()).toEqual([])
    advanceUntil(secondRun, 'wuxing-choice')
    secondRun.choose(firstChoice)
    advanceUntil(secondRun, 'whitebone-choice')
    expect(secondRun.getPendingChoice()?.choices.map((choice) => choice.id)).toEqual(['canon', 'water', 'memory'])
    finish(secondRun, 'memory')
    expect(secondRun.getReaderMemory()).toEqual({ [memoryKey]: true })
  })

  it.each([
    ['light', 'whitebone-light-delay', 'whitebone-mist-delay'],
    ['mist', 'whitebone-mist-delay', 'whitebone-light-delay'],
  ] as const)('proves delayed consequence for %s', (firstChoice, expected, absent) => {
    const runtime = reachWhiteboneChoice(firstChoice)
    runtime.choose('canon')
    advanceUntil(runtime, expected)
    expect(runtime.getVisibleNodes().some((node) => node.id === expected)).toBe(true)
    expect(runtime.getVisibleNodes().some((node) => node.id === absent)).toBe(false)
  })

  it.each([
    ['canon', 'whitebone-outcome-canon', 'whitebone-outcome-water', 'whitebone-outcome-memory'],
    ['water', 'whitebone-outcome-water', 'whitebone-outcome-canon', 'whitebone-outcome-memory'],
    ['memory', 'whitebone-outcome-memory', 'whitebone-outcome-canon', 'whitebone-outcome-water'],
  ] as const)('routes the White Bone outcome through %s', (secondChoice, expected, absentA, absentB) => {
    const runtime = reachWhiteboneChoice('light', { [memoryKey]: true })
    expect(runtime.getPendingChoice()?.choices.map((choice) => choice.id)).toEqual(['canon', 'water', 'memory'])
    runtime.choose(secondChoice)
    advanceUntil(runtime, expected)
    const ids = runtime.getVisibleNodes().map((node) => node.id)
    expect(ids).toContain(expected)
    expect(ids).not.toContain(absentA)
    expect(ids).not.toContain(absentB)
  })

  it('keeps the branch continuity fact explicit at the shared rejoin', () => {
    const runtime = reachWhiteboneChoice('mist', { [memoryKey]: true })
    finish(runtime, 'memory')
    expect(visibleText(runtime)).toContain('悟空離開了取經隊伍')
    expect(visibleText(runtime)).toContain('卷一')
  })
})
