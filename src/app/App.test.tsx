import { act, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'
import { READER_PREFERENCES_KEY } from '../reader/hooks/useReaderPreferences'
import { readerPositionKey } from '../reader/hooks/useReaderProgress'
import { BookReader } from '../reader/components/BookReader'
import { demoDocument } from '../reader/fixtures/demoDocument'
import { StorySession } from './StorySession'
import { loadStory } from '../engine/story-loader/loadStory'
import { readerMemoryKey } from '../persistence/readerMemory'
import { runtimeStorageKey } from '../persistence/runtimeSave'
import { storyBookmarkKey } from '../persistence/storyBookmark'

class TestIntersectionObserver {
  static instances: TestIntersectionObserver[] = []
  readonly observed: Element[] = []
  disconnected = false

  constructor(private readonly callback: IntersectionObserverCallback) {
    TestIntersectionObserver.instances.push(this)
  }

  disconnect() { this.disconnected = true }
  observe(marker: Element) { this.observed.push(marker) }
  trigger(marker: Element) {
    this.callback([{ intersectionRatio: 1, isIntersecting: true, target: marker } as IntersectionObserverEntry], this as unknown as IntersectionObserver)
  }
}

const storyId = 'journey81'
const documentId = `story:${storyId}`
const positionKey = readerPositionKey(documentId)

function clickUntil(predicate: () => boolean, label: string, limit = 80) {
  for (let index = 0; index < limit; index += 1) {
    if (predicate()) return
    const button = screen.queryByRole('button', { name: '繼續閱讀' })
    if (!button) throw new Error(`Unable to reach ${label}; continuation ended early`)
    fireEvent.click(button)
  }
  throw new Error(`Unable to reach ${label} within ${limit} continuation steps`)
}

function reachWuxingChoice() {
  clickUntil(() => Boolean(screen.queryByRole('button', { name: '讓一線天光穿過雲縫。' })), 'the 五行山 choice')
}

function reachWhiteboneChoice(firstChoice: 'light' | 'mist' = 'light') {
  reachWuxingChoice()
  fireEvent.click(screen.getByRole('button', { name: firstChoice === 'light' ? '讓一線天光穿過雲縫。' : '讓山霧再停一刻。' }))
  clickUntil(() => Boolean(screen.queryByRole('button', { name: '讓山泉漫過竹籃底。' })), 'the 白骨嶺 choice')
}

function reachEnding(firstChoice: 'light' | 'mist' = 'light', secondChoice: 'water' | 'canon' = 'water') {
  reachWhiteboneChoice(firstChoice)
  fireEvent.click(screen.getByRole('button', { name: secondChoice === 'water' ? '讓山泉漫過竹籃底。' : '不動。讓這一刻照原來的速度發生。' }))
  clickUntil(() => Boolean(screen.queryByText('閱讀完畢')), 'the Journey81 ending')
}

function triggerProgress(markerId: string) {
  const marker = document.querySelector(`#${markerId}`)
  expect(marker).not.toBeNull()
  const observer = [...TestIntersectionObserver.instances].reverse().find((instance) => instance.observed.includes(marker!))
  expect(observer).toBeDefined()
  act(() => observer!.trigger(marker!))
}

function progressValue() { return Number(screen.getByRole('progressbar').getAttribute('value')) }

function seedSavedPosition() {
  window.localStorage.setItem(positionKey, JSON.stringify({ documentId, progress: 42, updatedAt: '2026-08-15T00:00:00.000Z' }))
}

function mainObserverFor(markerId: string) {
  const observer = [...TestIntersectionObserver.instances].reverse().find((instance) => instance.observed.some((marker) => marker.id === markerId))
  expect(observer).toBeDefined()
  return observer!
}

describe('Book reader', () => {
  beforeEach(() => {
    ;[
      runtimeStorageKey(storyId), runtimeStorageKey('choice-ending-ui'), runtimeStorageKey('choice-choice-ui'),
      readerMemoryKey(storyId), storyBookmarkKey(storyId), storyBookmarkKey('choice-ending-ui'), storyBookmarkKey('choice-choice-ui'),
      READER_PREFERENCES_KEY, positionKey,
    ].forEach((key) => window.localStorage.removeItem(key))
    Object.defineProperty(window, 'scrollTo', { configurable: true, value: vi.fn(), writable: true })
    TestIntersectionObserver.instances = []
    vi.stubGlobal('IntersectionObserver', TestIntersectionObserver)
  })

  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals() })

  it('loads Journey81 entry content without future nodes', () => {
    render(<App />)
    expect(screen.getByRole('heading', { level: 1, name: '西遊：八十一劫' })).toBeInTheDocument()
    expect(screen.getByText('Web Interactive Novel Engine')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: /沒有被風吹動的紙/ })).toBeInTheDocument()
    expect(screen.getByText(/紙頁躺在石階中央/)).toBeInTheDocument()
    expect(screen.getByText(/你不在西遊記裡/)).toBeInTheDocument()
    expect(screen.queryByText('五行山・一線天光')).not.toBeInTheDocument()
  })

  it('provides a skip link and stable main landmark for keyboard readers', () => {
    render(<App />)
    expect(screen.getByRole('link', { name: '跳至正文' })).toHaveAttribute('href', '#reader-main')
    expect(screen.getByRole('main', { name: '西遊：八十一劫' })).toHaveAttribute('id', 'reader-main')
    expect(screen.getByRole('main', { name: '西遊：八十一劫' })).toHaveAttribute('tabindex', '-1')
  })

  it('keeps progress accessible without announcing every visual percentage update', () => {
    render(<App />)
    expect(screen.getByRole('progressbar', { name: '閱讀進度' })).toHaveAttribute('value', '0')
    expect(screen.getByText('0%')).toHaveAttribute('aria-hidden', 'true')
    expect(screen.getByText('0%')).not.toHaveAttribute('aria-live')
  })

  it('appends Journey81 nodes until its first causal Choice', () => {
    render(<App />); reachWuxingChoice()
    expect(screen.getByRole('group', { name: '撥動因果' })).toBeInTheDocument()
    expect(screen.getByText(/山風正要換一個方向/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '讓一線天光穿過雲縫。' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '讓山霧再停一刻。' })).toBeInTheDocument()
    expect(screen.getByText('觀者可以回看已發生之事。')).toBeInTheDocument()
  })

  it('commits the light Choice and renders only its consequence', () => {
    render(<App />); reachWuxingChoice(); fireEvent.click(screen.getByRole('button', { name: '讓一線天光穿過雲縫。' }))
    expect(screen.getByText(/雲縫被光撐開一瞬/)).toBeInTheDocument()
    expect(screen.getByText('因果已定。')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '讓一線天光穿過雲縫。' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '讓山霧再停一刻。' })).not.toBeInTheDocument()
  })

  it('commits the mist Choice without rendering the light branch', () => {
    render(<App />); reachWuxingChoice(); fireEvent.click(screen.getByRole('button', { name: '讓山霧再停一刻。' }))
    expect(screen.getByText(/霧沒有散/)).toBeInTheDocument()
    expect(screen.queryByText(/雲縫被光撐開一瞬/)).not.toBeInTheDocument()
  })

  it('persists the active Journey runtime across a remount without changing Reader storage', () => {
    const firstRender = render(<App />); reachWuxingChoice(); fireEvent.click(screen.getByRole('button', { name: '讓一線天光穿過雲縫。' }))
    const savedPreferences = window.localStorage.getItem(READER_PREFERENCES_KEY); firstRender.unmount(); render(<App />)
    expect(screen.getByText(/雲縫被光撐開一瞬/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '讓一線天光穿過雲縫。' })).not.toBeInTheDocument()
    expect(window.localStorage.getItem(READER_PREFERENCES_KEY)).toBe(savedPreferences)
    expect(JSON.parse(window.localStorage.getItem(runtimeStorageKey(storyId)) ?? '{}')).toMatchObject({ formatVersion: 1, storyId, snapshot: { currentNodeId: 'wuxing-light', worldState: { wuxing_first_touch: 'light' } } })
  })

  it('restores a pending Journey Choice and its first-choice notice', () => {
    const firstRender = render(<App />); reachWuxingChoice(); expect(screen.getByText('觀者可以回看已發生之事。')).toBeInTheDocument(); firstRender.unmount(); render(<App />)
    expect(screen.getByRole('group', { name: '撥動因果' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '讓一線天光穿過雲縫。' })).toBeInTheDocument()
    expect(screen.getByText('觀者可以回看已發生之事。')).toBeInTheDocument()
  })

  it('shows a polite runtime warning without blocking a Journey Choice', () => {
    const originalSetItem = Storage.prototype.setItem
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) { if (key.startsWith('storyforge.runtime.')) throw new Error('quota exceeded'); originalSetItem.call(this, key, value) })
    render(<App />); reachWuxingChoice(); fireEvent.click(screen.getByRole('button', { name: '讓一線天光穿過雲縫。' }))
    expect(screen.getByText(/雲縫被光撐開一瞬/)).toBeInTheDocument()
    expect(screen.getByText('此瀏覽器目前無法保存因果。重新整理後進度可能遺失。')).toHaveAttribute('aria-live', 'polite')
  })

  it('shows a persistence warning when the final runtime save fails', () => {
    render(<App />); reachWhiteboneChoice(); fireEvent.click(screen.getByRole('button', { name: '讓山泉漫過竹籃底。' }))
    clickUntil(() => Boolean(screen.queryByText(/悟空離開了取經隊伍/)), 'the departure node')
    const originalSetItem = Storage.prototype.setItem
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) { if (key.startsWith('storyforge.runtime.')) throw new Error('quota exceeded'); originalSetItem.call(this, key, value) })
    fireEvent.click(screen.getByRole('button', { name: '繼續閱讀' }))
    expect(screen.getByRole('heading', { level: 2, name: /路還向西/ })).toBeInTheDocument()
    expect(screen.getByText('閱讀完畢')).toBeInTheDocument()
    expect(screen.getByText('此瀏覽器目前無法保存因果。重新整理後進度可能遺失。')).toHaveAttribute('aria-live', 'polite')
  })

  it('re-registers observers for appended Journey markers', () => {
    render(<App />); const initialObserver = mainObserverFor('prologue-001-heading'); fireEvent.click(screen.getByRole('button', { name: '繼續閱讀' })); const expandedObserver = mainObserverFor('prologue-002-quote')
    expect(initialObserver.disconnected).toBe(true); expect(expandedObserver).not.toBe(initialObserver); expect(expandedObserver.observed.map((marker) => marker.id)).toContain('prologue-002-quote')
  })

  it('calculates progress against expanded Journey content without reaching ending', () => {
    render(<App />); const initialObserver = mainObserverFor('prologue-001-heading'); act(() => initialObserver.trigger(document.querySelector('#prologue-001-heading')!)); const initialProgress = progressValue(); fireEvent.click(screen.getByRole('button', { name: '繼續閱讀' })); const expandedObserver = mainObserverFor('prologue-002-p4'); act(() => expandedObserver.trigger(document.querySelector('#prologue-002-p4')!)); expect(progressValue()).toBeGreaterThan(initialProgress); expect(progressValue()).toBeLessThan(100)
  })

  it('keeps the loaded Journey content below 100 while continuation remains available', () => {
    render(<App />); triggerProgress('prologue-001-p4'); const endMarker = document.querySelector('#reader-end-marker')!; const observer = [...TestIntersectionObserver.instances].reverse().find((instance) => instance.observed.includes(endMarker)); expect(observer).toBeDefined(); act(() => observer!.trigger(endMarker)); expect(progressValue()).toBeLessThan(100); expect(screen.getByRole('button', { name: '繼續閱讀' })).toBeInTheDocument()
  })

  it('keeps expanded Journey content below 100 before its ending is appended', () => {
    render(<App />); fireEvent.click(screen.getByRole('button', { name: '繼續閱讀' })); triggerProgress('prologue-002-p4'); expect(progressValue()).toBeLessThan(100); expect(screen.getByRole('button', { name: '繼續閱讀' })).toBeInTheDocument()
  })

  it('observes the Journey ending marker and reaches 100 only when visible', () => {
    render(<App />); reachEnding(); const ending = document.querySelector('.reader-end')!; const observer = [...TestIntersectionObserver.instances].reverse().find((instance) => instance.observed.includes(ending)); expect(observer).toBeDefined(); act(() => observer!.trigger(ending)); expect(progressValue()).toBe(100); expect(screen.getByText('閱讀完畢')).toBeInTheDocument()
  })

  it('renders an accessible Journey Choice and commits only the selected consequence', () => {
    render(<App />); reachWhiteboneChoice(); expect(screen.getByRole('region', { name: '故事選擇' })).toBeInTheDocument(); fireEvent.click(screen.getByRole('button', { name: '讓山泉漫過竹籃底。' })); expect(screen.getByText(/泉水漫過竹籃底/)).toBeInTheDocument(); expect(screen.queryByRole('region', { name: '故事選擇' })).not.toBeInTheDocument(); expect(screen.getByText('因果已定。')).toHaveAttribute('aria-live', 'polite')
  })

  it('keeps progress below 100 while a Journey Choice is pending', () => {
    render(<App />); reachWuxingChoice(); const endMarker = document.querySelector('#reader-end-marker')!; const observer = [...TestIntersectionObserver.instances].reverse().find((instance) => instance.observed.includes(endMarker)); act(() => observer!.trigger(endMarker)); expect(progressValue()).toBeLessThan(100); expect(screen.getByRole('region', { name: '故事選擇' })).toBeInTheDocument()
  })

  it('shows causal feedback when a Choice commits directly to Ending', () => {
    const story = loadStory({ manifest: { id: 'choice-ending-ui', title: 'Choice Ending UI', version: '0.1.0', schemaVersion: '0.1', language: 'zh-TW', entryNode: 'start' }, nodes: [
      { id: 'start', type: 'narrative', content: [{ id: 'start-copy', type: 'paragraph', text: '開始。' }], next: 'choice' }, { id: 'choice', type: 'choice', choices: [{ id: 'finish', label: '直接結束', next: 'ending' }] }, { id: 'ending', type: 'ending', content: [{ id: 'ending-copy', type: 'paragraph', text: '結束。' }] },
    ] })
    render(<StorySession story={story} />); fireEvent.click(screen.getByRole('button', { name: '繼續閱讀' })); fireEvent.click(screen.getByRole('button', { name: '直接結束' })); expect(screen.getByText('因果已定。')).toBeVisible(); expect(screen.getByText('閱讀完畢')).toBeVisible()
  })

  it('keeps causal feedback visible when a Choice commits into another Choice', () => {
    const story = loadStory({ manifest: { id: 'choice-choice-ui', title: 'Choice Choice UI', version: '0.1.0', schemaVersion: '0.1', language: 'zh-TW', entryNode: 'start' }, nodes: [
      { id: 'start', type: 'narrative', content: [{ id: 'start-copy', type: 'paragraph', text: '開始。' }], next: 'choice-a' }, { id: 'choice-a', type: 'choice', choices: [{ id: 'a', label: '先做 A', next: 'choice-b' }] }, { id: 'choice-b', type: 'choice', choices: [{ id: 'b', label: '再做 B', next: 'ending' }] }, { id: 'ending', type: 'ending', content: [{ id: 'ending-copy', type: 'paragraph', text: '結束。' }] },
    ] })
    render(<StorySession story={story} />); fireEvent.click(screen.getByRole('button', { name: '繼續閱讀' })); fireEvent.click(screen.getByRole('button', { name: '先做 A' })); expect(screen.getByText('因果已定。')).toBeVisible(); expect(screen.getByRole('button', { name: '再做 B' })).toBeVisible()
  })

  it('treats a standalone ReaderDocument as complete by default', () => {
    render(<BookReader document={demoDocument} />); const ending = document.querySelector('.reader-end')!; const observer = [...TestIntersectionObserver.instances].reverse().find((instance) => instance.observed.includes(ending)); act(() => observer!.trigger(ending)); expect(progressValue()).toBe(100)
  })

  it('changes font size, line height, and theme immediately', () => {
    const { container } = render(<App />); const reader = container.querySelector('.book-reader'); fireEvent.click(screen.getByRole('button', { name: '閱讀設定' })); fireEvent.click(screen.getByRole('radio', { name: '大' })); fireEvent.click(screen.getByRole('radio', { name: '寬鬆' })); fireEvent.click(screen.getByRole('radio', { name: '深色' })); expect(reader).toHaveAttribute('data-font-size', 'large'); expect(reader).toHaveAttribute('data-line-height', 'relaxed'); expect(reader).toHaveAttribute('data-theme', 'dark')
  })

  it('describes Reader Settings, locks background scroll, and restores trigger focus', () => {
    render(<App />)
    const settingsButton = screen.getByRole('button', { name: '閱讀設定' })
    settingsButton.focus()
    fireEvent.click(settingsButton)
    const dialog = screen.getByRole('dialog', { name: '閱讀設定' })
    expect(dialog).toHaveAttribute('aria-describedby', 'reader-settings-description')
    expect(screen.getByText('調整只會儲存在這個瀏覽器。')).toHaveAttribute('id', 'reader-settings-description')
    expect(document.body.style.overflow).toBe('hidden')
    expect(screen.getByRole('button', { name: '關閉' })).toHaveFocus()
    fireEvent.keyDown(document, { key: 'Escape' })
    expect(screen.queryByRole('dialog', { name: '閱讀設定' })).not.toBeInTheDocument()
    expect(settingsButton).toHaveFocus()
    expect(document.body.style.overflow).toBe('')
  })

  it('persists preferences and restores them after remount', () => {
    const firstRender = render(<App />); fireEvent.click(screen.getByRole('button', { name: '閱讀設定' })); fireEvent.click(screen.getByRole('radio', { name: '特大' })); fireEvent.click(screen.getByRole('radio', { name: '淺色' })); firstRender.unmount(); const secondRender = render(<App />); const reader = secondRender.container.querySelector('.book-reader'); expect(reader).toHaveAttribute('data-font-size', 'x-large'); expect(reader).toHaveAttribute('data-theme', 'light')
  })

  it('uses system theme by default and allows returning to it', () => {
    const { container } = render(<App />); const reader = container.querySelector('.book-reader'); expect(reader).toHaveAttribute('data-theme', 'system'); fireEvent.click(screen.getByRole('button', { name: '閱讀設定' })); fireEvent.click(screen.getByRole('radio', { name: '深色' })); fireEvent.click(screen.getByRole('radio', { name: '系統' })); expect(reader).toHaveAttribute('data-theme', 'system')
  })

  it('preserves a pending saved reading position for Journey81', () => {
    seedSavedPosition(); render(<App />); triggerProgress('prologue-001-p2'); expect(screen.getByRole('button', { name: '回到上次閱讀處' })).toBeInTheDocument(); expect(JSON.parse(window.localStorage.getItem(positionKey) ?? '{}').progress).toBe(42)
  })

  it('allows reading position persistence after closing the resume prompt', () => {
    seedSavedPosition(); render(<App />); triggerProgress('prologue-001-p2'); fireEvent.click(screen.getByRole('button', { name: '關閉' })); triggerProgress('prologue-001-p4'); expect(JSON.parse(window.localStorage.getItem(positionKey) ?? '{}').progress).not.toBe(42)
  })

  it('allows reading position persistence after resuming a saved Journey position', () => {
    seedSavedPosition(); render(<App />); fireEvent.click(screen.getByRole('button', { name: '回到上次閱讀處' })); triggerProgress('prologue-001-p4'); expect(window.scrollTo).toHaveBeenCalledWith(expect.objectContaining({ behavior: 'auto' })); expect(screen.queryByRole('complementary', { name: '上次閱讀位置' })).not.toBeInTheDocument()
  })

  it('saves one Journey location before a Choice and never rolls back causality', () => {
    render(<App />); fireEvent.click(screen.getByRole('button', { name: '加入書籤' })); expect(screen.getByText('書籤已更新。')).toHaveAttribute('aria-live', 'polite'); expect(JSON.parse(window.localStorage.getItem(storyBookmarkKey(storyId)) ?? '{}')).toMatchObject({ formatVersion: 1, storyId, location: { documentId, markerId: 'prologue-001-heading' } }); reachWuxingChoice(); fireEvent.click(screen.getByRole('button', { name: '讓一線天光穿過雲縫。' })); fireEvent.click(screen.getByRole('button', { name: '回到書籤' })); expect(screen.getByRole('heading', { level: 2, name: /沒有被風吹動的紙/ })).toBeInTheDocument(); expect(screen.queryByRole('button', { name: '讓一線天光穿過雲縫。' })).not.toBeInTheDocument(); expect(JSON.parse(window.localStorage.getItem(runtimeStorageKey(storyId)) ?? '{}').snapshot.choiceHistory).toHaveLength(1)
  })

  it('restores Bookmark controls after a remount without restoring runtime through it', () => {
    const firstRender = render(<App />); fireEvent.click(screen.getByRole('button', { name: '加入書籤' })); firstRender.unmount(); render(<App />); expect(screen.getByRole('button', { name: '更新書籤' })).toBeInTheDocument(); expect(screen.getByRole('button', { name: '回到書籤' })).toBeInTheDocument(); expect(screen.getByRole('heading', { level: 2, name: /沒有被風吹動的紙/ })).toBeInTheDocument()
  })

  it('shows a warning and keeps runtime when Bookmark storage writes fail', () => {
    const originalSetItem = Storage.prototype.setItem; vi.spyOn(Storage.prototype, 'setItem').mockImplementation(function (this: Storage, key, value) { if (key.startsWith('storyforge.bookmark.')) throw new Error('quota exceeded'); originalSetItem.call(this, key, value) }); render(<App />); fireEvent.click(screen.getByRole('button', { name: '加入書籤' })); expect(screen.getByText('此瀏覽器目前無法保存書籤。')).toHaveAttribute('aria-live', 'polite'); expect(window.localStorage.getItem(storyBookmarkKey(storyId))).toBeNull(); expect(window.localStorage.getItem(runtimeStorageKey(storyId))).not.toBeNull()
  })

  it('requires confirmation for New Run, clears the active run, and preserves Reader Memory', () => {
    render(<App />); fireEvent.click(screen.getByRole('button', { name: '閱讀設定' })); fireEvent.click(screen.getByRole('radio', { name: '深色' })); reachEnding('light', 'water'); expect(screen.getByText('閱讀完畢')).toBeInTheDocument(); fireEvent.click(screen.getByRole('button', { name: '開始新一輪' })); expect(screen.getByText('這會清除目前這一輪的因果與書籤，從序章重新開始。閱讀偏好不受影響。')).toBeInTheDocument(); fireEvent.click(screen.getByRole('button', { name: '取消' })); expect(screen.getByText('閱讀完畢')).toBeInTheDocument(); fireEvent.click(screen.getByRole('button', { name: '開始新一輪' })); fireEvent.click(screen.getByRole('button', { name: '確認開始新一輪' })); expect(screen.getByRole('heading', { level: 2, name: /沒有被風吹動的紙/ })).toBeInTheDocument(); expect(screen.queryByText('閱讀完畢')).not.toBeInTheDocument(); expect(screen.getByRole('radio', { name: '深色' })).toBeInTheDocument(); expect(window.localStorage.getItem(runtimeStorageKey(storyId))).toBeNull(); expect(window.localStorage.getItem(storyBookmarkKey(storyId))).toBeNull(); expect(window.localStorage.getItem(positionKey)).toBeNull(); expect(JSON.parse(window.localStorage.getItem(readerMemoryKey(storyId)) ?? '{}').memory['journey81.white-bone-truth']).toBe(true)
  })

  it('keeps the active run when Reader position cleanup fails before New Run', () => {
    render(<App />); reachEnding(); const originalRemoveItem = Storage.prototype.removeItem; vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(function (this: Storage, key) { if (key.startsWith('storyforge.reader.position.')) throw new Error('blocked'); originalRemoveItem.call(this, key) }); fireEvent.click(screen.getByRole('button', { name: '開始新一輪' })); fireEvent.click(screen.getByRole('button', { name: '確認開始新一輪' })); expect(screen.getByText('閱讀完畢')).toBeInTheDocument(); expect(screen.getByText('目前無法開始新一輪，請確認瀏覽器儲存空間可用。')).toHaveAttribute('aria-live', 'polite'); expect(window.localStorage.getItem(runtimeStorageKey(storyId))).not.toBeNull()
  })

  it('keeps the active run when Bookmark cleanup fails before Runtime removal', () => {
    render(<App />); reachEnding(); fireEvent.click(screen.getByRole('button', { name: '加入書籤' })); const originalRemoveItem = Storage.prototype.removeItem; vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(function (this: Storage, key) { if (key.startsWith('storyforge.bookmark.')) throw new Error('blocked'); originalRemoveItem.call(this, key) }); fireEvent.click(screen.getByRole('button', { name: '開始新一輪' })); fireEvent.click(screen.getByRole('button', { name: '確認開始新一輪' })); expect(screen.getByText('閱讀完畢')).toBeInTheDocument(); expect(screen.getByText('目前無法開始新一輪，請確認瀏覽器儲存空間可用。')).toHaveAttribute('aria-live', 'polite'); expect(window.localStorage.getItem(runtimeStorageKey(storyId))).not.toBeNull(); expect(window.localStorage.getItem(storyBookmarkKey(storyId))).not.toBeNull()
  })
})
