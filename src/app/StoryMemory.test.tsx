import { fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { StorySession } from './StorySession'
import { loadStory } from '../engine/story-loader/loadStory'
import { readerMemoryKey } from '../persistence/readerMemory'
import { runtimeStorageKey } from '../persistence/runtimeSave'
import { storyBookmarkKey } from '../persistence/storyBookmark'

class QuietIntersectionObserver {
  disconnect() {}
  observe() {}
  unobserve() {}
}

const story = loadStory({
  manifest: { id: 'memory-ui-test', title: 'Memory UI Test', version: '0.1.0', schemaVersion: '0.1', language: 'en', entryNode: 'start' },
  nodes: [
    { id: 'start', type: 'narrative', content: [{ id: 'start-copy', type: 'paragraph', text: 'Start.' }], next: 'choice' },
    {
      id: 'choice',
      type: 'choice',
      choices: [
        { id: 'ordinary', label: 'Ordinary path', effects: [{ type: 'remember', key: 'saw-signal' }], next: 'ending' },
        { id: 'remembered', label: 'Remembered path', conditions: [{ type: 'readerRemembers', key: 'saw-signal' }], next: 'ending' },
      ],
    },
    { id: 'ending', type: 'ending', content: [{ id: 'ending-copy', type: 'paragraph', text: 'Ending.' }] },
  ],
})

describe('StorySession Reader Memory integration', () => {
  beforeEach(() => {
    window.localStorage.removeItem(readerMemoryKey(story.manifest.id))
    window.localStorage.removeItem(runtimeStorageKey(story.manifest.id))
    window.localStorage.removeItem(storyBookmarkKey(story.manifest.id))
    Object.defineProperty(window, 'scrollTo', { configurable: true, value: vi.fn(), writable: true })
    vi.stubGlobal('IntersectionObserver', QuietIntersectionObserver)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('preserves Reader Memory through New Run while resetting current runtime', () => {
    const firstRender = render(<StorySession story={story} />)
    fireEvent.click(screen.getByRole('button', { name: '繼續閱讀' }))
    expect(screen.getByRole('button', { name: 'Ordinary path' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Ordinary path' }))
    expect(screen.getByText('閱讀完畢')).toBeInTheDocument()
    expect(JSON.parse(window.localStorage.getItem(readerMemoryKey(story.manifest.id)) ?? '{}').memory).toEqual({ 'saw-signal': true })

    firstRender.unmount()
    render(<StorySession story={story} />)
    expect(screen.getByText('閱讀完畢')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '開始新一輪' }))
    fireEvent.click(screen.getByRole('button', { name: '確認開始新一輪' }))
    expect(screen.getByText('Start.')).toBeInTheDocument()
    expect(screen.queryByText('閱讀完畢')).not.toBeInTheDocument()
    expect(window.localStorage.getItem(runtimeStorageKey(story.manifest.id))).toBeNull()

    fireEvent.click(screen.getByRole('button', { name: '繼續閱讀' }))
    expect(screen.getByRole('button', { name: 'Remembered path' })).toBeInTheDocument()
  })

  it('saves Memory before Runtime and skips Runtime when Memory storage fails', () => {
    const originalSetItem = Storage.prototype.setItem
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
      if (key.startsWith('storyforge.memory.')) throw new Error('memory unavailable')
      originalSetItem.call(this, key, value)
    })

    render(<StorySession story={story} />)
    fireEvent.click(screen.getByRole('button', { name: '繼續閱讀' }))

    expect(screen.getByText('此瀏覽器目前無法保存觀者記憶。重新整理後跨周目記憶可能遺失。')).toHaveAttribute('aria-live', 'polite')
    expect(screen.getByText('此瀏覽器目前無法保存因果。重新整理後進度可能遺失。')).toHaveAttribute('aria-live', 'polite')
    expect(window.localStorage.getItem(runtimeStorageKey(story.manifest.id))).toBeNull()
  })

  it('keeps persisted Memory when the later Runtime write fails', () => {
    const originalSetItem = Storage.prototype.setItem
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) {
      if (key.startsWith('storyforge.runtime.')) throw new Error('runtime unavailable')
      originalSetItem.call(this, key, value)
    })

    render(<StorySession story={story} />)
    fireEvent.click(screen.getByRole('button', { name: '繼續閱讀' }))

    expect(window.localStorage.getItem(readerMemoryKey(story.manifest.id))).not.toBeNull()
    expect(window.localStorage.getItem(runtimeStorageKey(story.manifest.id))).toBeNull()
    expect(screen.getByText('此瀏覽器目前無法保存因果。重新整理後進度可能遺失。')).toBeInTheDocument()
  })
})
