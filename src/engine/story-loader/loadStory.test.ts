import { describe, expect, it } from 'vitest'
import { StoryLoadError } from '../story/schema'
import type { StoryPackSource } from '../story/types'
import { loadStory } from './loadStory'

const manifest = {
  id: 'test-story',
  title: 'Test Story',
  version: '0.1.0',
  schemaVersion: '0.1',
  language: 'zh-TW',
  entryNode: 'start',
}

const startNode = {
  id: 'start',
  type: 'narrative',
  content: [{ id: 'start-text', type: 'paragraph', text: '開始。' }],
  next: 'ending',
}

const endingNode = {
  id: 'ending',
  type: 'ending',
  content: [{ id: 'ending-text', type: 'paragraph', text: '結束。' }],
}

function source(overrides: Partial<StoryPackSource> = {}): StoryPackSource {
  return { manifest, nodes: [startNode, endingNode], ...overrides }
}

describe('loadStory', () => {
  it('rejects a missing manifest with a clear error', () => {
    expect(() => loadStory(source({ manifest: null }))).toThrow('manifest must be an object')
  })

  it('loads a valid linear story into a node map', () => {
    const story = loadStory(source())
    expect(story.manifest.entryNode).toBe('start')
    expect(story.nodes.get('start')?.type).toBe('narrative')
    expect(story.nodes.get('ending')?.type).toBe('ending')
  })

  it('rejects a missing entry node', () => {
    expect(() => loadStory(source({ manifest: { ...manifest, entryNode: 'missing' } }))).toThrow('Entry node does not exist: missing')
  })

  it('rejects a missing next target', () => {
    expect(() => loadStory(source({ nodes: [{ ...startNode, next: 'missing' }, endingNode] }))).toThrow(
      'Narrative node start references missing next node: missing',
    )
  })

  it('rejects duplicate node IDs', () => {
    expect(() => loadStory(source({ nodes: [startNode, { ...endingNode, id: 'start' }] }))).toThrow('Duplicate story node id: start')
  })

  it('rejects unsupported node types', () => {
    expect(() => loadStory(source({ nodes: [{ id: 'start', type: 'mystery', content: [] }] }))).toThrow(
      'Unsupported story node type: mystery',
    )
  })

  it('rejects a linear cycle with a clear StoryLoadError', () => {
    expect(() => loadStory(source({ nodes: [{ ...startNode, next: 'start' }] }))).toThrow(StoryLoadError)
  })
})
