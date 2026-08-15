import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'
import { READER_PREFERENCES_KEY } from '../reader/hooks/useReaderPreferences'
import { readerPositionKey } from '../reader/hooks/useReaderProgress'

describe('Book reader', () => {
  beforeEach(() => {
    window.localStorage.clear()
    Object.defineProperty(window, 'scrollTo', { configurable: true, value: vi.fn(), writable: true })
  })

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

  it('offers an explicit return to a saved reading position', () => {
    window.localStorage.setItem(
      readerPositionKey('phase-1-reader-demo'),
      JSON.stringify({ documentId: 'phase-1-reader-demo', progress: 42, updatedAt: '2026-08-15T00:00:00.000Z' }),
    )

    render(<App />)
    fireEvent.click(screen.getByRole('button', { name: '回到上次閱讀處' }))

    expect(window.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'auto' }))
    expect(screen.queryByRole('complementary', { name: '上次閱讀位置' })).not.toBeInTheDocument()
  })
})
