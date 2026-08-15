import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'
import { READER_PREFERENCES_KEY } from '../reader/hooks/useReaderPreferences'
import { readerPositionKey } from '../reader/hooks/useReaderProgress'

class TestIntersectionObserver {
  static instances: TestIntersectionObserver[] = []

  constructor(private readonly callback: IntersectionObserverCallback) {
    TestIntersectionObserver.instances.push(this)
  }

  disconnect() {}

  observe() {}

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

const positionKey = readerPositionKey('phase-1-reader-demo')

function seedSavedPosition() {
  window.localStorage.setItem(
    positionKey,
    JSON.stringify({ documentId: 'phase-1-reader-demo', progress: 42, updatedAt: '2026-08-15T00:00:00.000Z' }),
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

describe('Book reader', () => {
  beforeEach(() => {
    window.localStorage.clear()
    Object.defineProperty(window, 'scrollTo', { configurable: true, value: vi.fn(), writable: true })
    TestIntersectionObserver.instances = []
    vi.stubGlobal('IntersectionObserver', TestIntersectionObserver)
  })

  afterEach(() => vi.unstubAllGlobals())

  it('renders the reader presentation blocks and product identity', () => {
    render(<App />)

    expect(screen.getByRole('heading', { level: 1, name: '潮汐線以北' })).toBeInTheDocument()
    expect(screen.getByText('Web Interactive Novel Engine')).toBeInTheDocument()
    expect(screen.getByText(/清晨的雨停在六點以前/)).toBeInTheDocument()
    expect(screen.getByText('「前面的路還通嗎？」')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /層疊的灰藍山丘/ })).toBeInTheDocument()
    expect(screen.getByText(/示例插圖：霧中的路徑/)).toBeInTheDocument()
    expect(screen.getAllByRole('separator', { name: '場景分隔' })).toHaveLength(2)
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
    triggerProgress(12)

    expect(savedProgress()).toBe(48)
  })

  it('allows reading position persistence after resuming a saved position', () => {
    seedSavedPosition()

    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: '回到上次閱讀處' }))
    triggerProgress(12)

    expect(window.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'auto' }))
    expect(screen.queryByRole('complementary', { name: '上次閱讀位置' })).not.toBeInTheDocument()
    expect(savedProgress()).toBe(48)
  })
})
