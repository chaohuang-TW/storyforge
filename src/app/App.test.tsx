import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'
import { READER_PREFERENCES_KEY } from '../reader/hooks/useReaderPreferences'
import { readerPositionKey } from '../reader/hooks/useReaderProgress'
import { BookReader } from '../reader/components/BookReader'
import { demoDocument } from '../reader/fixtures/demoDocument'

class TestIntersectionObserver {
  static instances: TestIntersectionObserver[] = []
  readonly observed: Element[] = []
  disconnected = false

  constructor(private readonly callback: IntersectionObserverCallback) {
    TestIntersectionObserver.instances.push(this)
  }

  disconnect() {
    this.disconnected = true
  }

  observe(marker: Element) {
    this.observed.push(marker)
  }

  trigger(marker: Element) {
    this.callback(
      [
        {
          intersectionRatio: 1,
          isIntersecting: true,
          target: marker,
        } as IntersectionObserverEntry,
      ],
      this as unknown as IntersectionObserver,
    )
  }
}

const positionKey = readerPositionKey('story:runtime-demo')

function seedSavedPosition() {
  window.localStorage.setItem(
    positionKey,
    JSON.stringify({ documentId: 'story:runtime-demo', progress: 42, updatedAt: '2026-08-15T00:00:00.000Z' }),
  )
}

function triggerProgress(markerIndex: number) {
  const marker = document.querySelector(`[data-reader-progress-marker="${markerIndex}"]`)
  expect(marker).not.toBeNull()
  act(() => TestIntersectionObserver.instances[0].trigger(marker!))
}

function savedProgress() {
  return JSON.parse(window.localStorage.getItem(positionKey) ?? '{}').progress
}

function progressValue() {
  return Number(screen.getByRole('progressbar').getAttribute('value'))
}

function mainObserverFor(markerId: string) {
  const observer = [...TestIntersectionObserver.instances]
    .reverse()
    .find((instance) => instance.observed.some((marker) => marker.id === markerId))
  expect(observer).toBeDefined()
  return observer!
}

describe('Book reader', () => {
  beforeEach(() => {
    window.localStorage.clear()
    Object.defineProperty(window, 'scrollTo', { configurable: true, value: vi.fn(), writable: true })
    TestIntersectionObserver.instances = []
    vi.stubGlobal('IntersectionObserver', TestIntersectionObserver)
  })

  afterEach(() => vi.unstubAllGlobals())

  it('loads the runtime entry node without future nodes', () => {
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: '霧港書簡' })).toBeInTheDocument()
    expect(screen.getByText('Web Interactive Novel Engine')).toBeInTheDocument()
    expect(screen.queryByText('由 Story Runtime 載入的線性示例')).not.toBeInTheDocument()
    expect(document.querySelector('.reader-title-page__subtitle')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: /潮線以外/ })).toBeInTheDocument()
    expect(screen.getByText(/港口的鐘在天色尚未亮透時響了一次/)).toBeInTheDocument()
    expect(screen.queryByText('霧中的郵亭')).not.toBeInTheDocument()
    expect(screen.queryByText('寄出以後')).not.toBeInTheDocument()
  })

  it('appends runtime nodes and stops at the ending', () => {
    render(<App />)

    fireEvent.click(screen.getByRole('button', { name: '繼續閱讀' }))
    expect(screen.getByText(/港口的鐘在天色尚未亮透時響了一次/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 3, name: '霧中的郵亭' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /霧色山丘與海岸/ })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: '繼續閱讀' }))
    expect(screen.getByRole('heading', { level: 3, name: '寄出以後' })).toBeInTheDocument()
    expect(screen.getByText('閱讀完畢')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '繼續閱讀' })).not.toBeInTheDocument()
  })

  it('re-registers observers and observes markers from appended nodes', () => {
    render(<App />)
    const initialObserver = mainObserverFor('prologue-heading')

    expect(initialObserver.observed.map((marker) => marker.id)).toContain('prologue-heading')

    fireEvent.click(screen.getByRole('button', { name: '繼續閱讀' }))
    const expandedObserver = mainObserverFor('chapter-heading')

    expect(initialObserver.disconnected).toBe(true)
    expect(expandedObserver).not.toBe(initialObserver)
    expect(expandedObserver.observed.map((marker) => marker.id)).toContain('chapter-heading')
  })

  it('calculates progress against the expanded content without reaching the ending', () => {
    render(<App />)
    const initialObserver = mainObserverFor('prologue-heading')

    act(() => initialObserver.trigger(document.querySelector('#prologue-2')!))
    const initialProgress = progressValue()

    fireEvent.click(screen.getByRole('button', { name: '繼續閱讀' }))
    const expandedObserver = mainObserverFor('chapter-heading')
    act(() => expandedObserver.trigger(document.querySelector('#chapter-heading')!))

    expect(progressValue()).toBeGreaterThan(initialProgress)
    expect(progressValue()).toBeLessThan(100)
  })

  it('keeps the loaded prologue bottom below 100 while continuation remains available', () => {
    render(<App />)
    const initialObserver = mainObserverFor('prologue-heading')
    const incompleteEndObserver = [...TestIntersectionObserver.instances]
      .reverse()
      .find((instance) => instance.observed.some((marker) => marker.classList.contains('reader-end-marker')))

    act(() => initialObserver.trigger(document.querySelector('#prologue-3')!))
    expect(incompleteEndObserver).toBeDefined()
    act(() => incompleteEndObserver!.trigger(document.querySelector('.reader-end-marker')!))

    expect(progressValue()).toBeLessThan(100)
    expect(screen.getByRole('button', { name: '繼續閱讀' })).toBeInTheDocument()
  })

  it('keeps the loaded chapter bottom below 100 before the ending is appended', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: '繼續閱讀' }))
    const chapterObserver = mainObserverFor('chapter-heading')

    act(() => chapterObserver.trigger(document.querySelector('#chapter-3')!))

    expect(progressValue()).toBeLessThan(100)
    expect(screen.getByRole('button', { name: '繼續閱讀' })).toBeInTheDocument()
  })

  it('observes the ending marker and reaches 100% only when it is visible', () => {
    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: '繼續閱讀' }))
    fireEvent.click(screen.getByRole('button', { name: '繼續閱讀' }))

    const endingObserver = [...TestIntersectionObserver.instances]
      .reverse()
      .find((instance) => instance.observed.some((marker) => marker.classList.contains('reader-end')))
    expect(endingObserver).toBeDefined()

    act(() => endingObserver!.trigger(document.querySelector('.reader-end')!))

    expect(progressValue()).toBe(100)
    expect(screen.queryByRole('button', { name: '繼續閱讀' })).not.toBeInTheDocument()
    expect(screen.getByText('閱讀完畢')).toBeInTheDocument()
  })

  it('treats a standalone ReaderDocument as complete by default', () => {
    render(<BookReader document={demoDocument} />)
    const endingObserver = [...TestIntersectionObserver.instances]
      .reverse()
      .find((instance) => instance.observed.some((marker) => marker.classList.contains('reader-end')))
    expect(endingObserver).toBeDefined()

    act(() => endingObserver!.trigger(document.querySelector('.reader-end')!))

    expect(progressValue()).toBe(100)
  })

  it('changes font size, line height, and theme immediately', () => {
    const { container } = render(<App />)
    const reader = container.querySelector('.book-reader')

    fireEvent.click(screen.getByRole('button', { name: '閱讀設定' }))
    fireEvent.click(screen.getByRole('radio', { name: '大' }))
    fireEvent.click(screen.getByRole('radio', { name: '寬鬆' }))
    fireEvent.click(screen.getByRole('radio', { name: '深色' }))

    expect(reader).toHaveAttribute('data-font-size', 'large')
    expect(reader).toHaveAttribute('data-line-height', 'relaxed')
    expect(reader).toHaveAttribute('data-theme', 'dark')
  })

  it('persists preferences and restores them after remount', () => {
    const firstRender = render(<App />)
    fireEvent.click(screen.getByRole('button', { name: '閱讀設定' }))
    fireEvent.click(screen.getByRole('radio', { name: '特大' }))
    fireEvent.click(screen.getByRole('radio', { name: '淺色' }))
    firstRender.unmount()

    const secondRender = render(<App />)
    const reader = secondRender.container.querySelector('.book-reader')

    expect(reader).toHaveAttribute('data-font-size', 'x-large')
    expect(reader).toHaveAttribute('data-theme', 'light')
    expect(JSON.parse(window.localStorage.getItem(READER_PREFERENCES_KEY) ?? '{}')).toMatchObject({
      fontSize: 'x-large',
      theme: 'light',
    })
  })

  it('uses system theme by default and allows returning to it', () => {
    const { container } = render(<App />)
    const reader = container.querySelector('.book-reader')

    expect(reader).toHaveAttribute('data-theme', 'system')
    fireEvent.click(screen.getByRole('button', { name: '閱讀設定' }))
    fireEvent.click(screen.getByRole('radio', { name: '深色' }))
    fireEvent.click(screen.getByRole('radio', { name: '系統' }))
    expect(reader).toHaveAttribute('data-theme', 'system')
  })

  it('preserves a pending saved reading position when observer progress changes', () => {
    seedSavedPosition()

    render(<App />)
    triggerProgress(1)

    expect(screen.getByRole('button', { name: '回到上次閱讀處' })).toBeInTheDocument()
    expect(savedProgress()).toBe(42)
  })

  it('allows reading position persistence after closing the resume prompt', () => {
    seedSavedPosition()

    render(<App />)
    triggerProgress(1)
    fireEvent.click(screen.getByRole('button', { name: '關閉' }))
    triggerProgress(3)

    expect(savedProgress()).not.toBe(42)
  })

  it('allows reading position persistence after resuming a saved position', () => {
    seedSavedPosition()

    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: '回到上次閱讀處' }))
    triggerProgress(3)

    expect(window.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'auto' }))
    expect(screen.queryByRole('complementary', { name: '上次閱讀位置' })).not.toBeInTheDocument()
    expect(savedProgress()).not.toBe(42)
  })
})
