import { expect, test } from '@playwright/test'

async function reachChoice(page: import('@playwright/test').Page) {
  await page.getByRole('button', { name: '繼續閱讀' }).click()
  await page.getByRole('button', { name: '繼續閱讀' }).click()
  await expect(page.getByRole('group', { name: '撥動因果' })).toBeVisible()
}

async function reachSecondChoice(page: import('@playwright/test').Page, firstChoice: string) {
  await reachChoice(page)
  await page.getByRole('button', { name: firstChoice }).click()
  await page.getByRole('button', { name: '繼續閱讀' }).click()
  await page.getByRole('button', { name: '繼續閱讀' }).click()
  await page.getByRole('button', { name: '繼續閱讀' }).click()
  await page.getByRole('button', { name: '繼續閱讀' }).click()
  await expect(page.getByRole('group', { name: '撥動因果' })).toBeVisible()
}

async function reachWindEnding(page: import('@playwright/test').Page) {
  await reachSecondChoice(page, '讓風把信吹進屋內')
  await page.getByRole('button', { name: '讓鐘聲早一拍傳到碼頭' }).click()
  await page.getByRole('button', { name: '繼續閱讀' }).click()
  await expect(page.getByText('閱讀完畢')).toBeVisible()
}

test('loads only the runtime entry node in the continuous reader', async ({ page }) => {
  const response = await page.goto('/')

  expect(response?.ok()).toBeTruthy()
  await expect(page).toHaveTitle('StoryForge — Web Interactive Novel Engine')
  await expect(page.getByRole('heading', { level: 1, name: '霧港書簡' })).toBeVisible()
  await expect(page.getByRole('main')).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: /潮線以外/ })).toBeVisible()
  await expect(page.getByText(/港口的鐘在天色尚未亮透時響了一次/)).toBeVisible()
  await expect(page.getByRole('heading', { name: '霧中的郵亭' })).toBeHidden()
  await expect(page.getByRole('heading', { name: '寄出以後' })).toBeHidden()

  const isLongForm = await page.evaluate(() => {
    const minimumScreens = window.innerWidth <= 430 ? 1.5 : 1
    return document.documentElement.scrollHeight > window.innerHeight * minimumScreens
  })
  expect(isLongForm).toBe(true)

  const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  expect(hasHorizontalOverflow).toBe(false)
})

test('uses real mobile emulation for the mobile project', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'Mobile profile assertion')

  const mobileEnvironment = await page.evaluate(() => ({
    maxTouchPoints: navigator.maxTouchPoints,
    userAgent: navigator.userAgent,
  }))
  const mobileViewport = page.viewportSize()

  expect(mobileViewport).toEqual({ width: 390, height: 844 })
  expect(mobileEnvironment.maxTouchPoints).toBeGreaterThan(0)
  expect(mobileEnvironment.userAgent).toContain('Mobile')
})

test('appends runtime nodes and reaches the wind ending without removing prior text', async ({ page }) => {
  await page.goto('/')
  const prologue = page.getByText(/港口的鐘在天色尚未亮透時響了一次/)

  await page.getByRole('button', { name: '繼續閱讀' }).click()
  await expect(prologue).toBeVisible()
  await expect(page.getByRole('heading', { level: 3, name: '霧中的郵亭' })).toBeVisible()
  await expect(page.getByRole('img', { name: /霧色山丘與海岸/ })).toBeAttached()

  await page.getByRole('button', { name: '繼續閱讀' }).click()
  await expect(prologue).toBeVisible()
  await expect(page.getByText('門縫裡卡著一封沒有署名的信。')).toBeVisible()
  await expect(page.getByText('觀者可以回看已發生之事。')).toBeVisible()
  await expect(page.getByRole('button', { name: '繼續閱讀' })).toBeHidden()

  await page.getByRole('button', { name: '讓風把信吹進屋內' }).click()
  await expect(page.getByRole('heading', { level: 3, name: '風進屋時' })).toBeVisible()
  await expect(page.getByRole('img', { name: /風把深藍色信封吹過郵亭門檻/ })).toBeAttached()
  await expect(page.getByText('因果已定。')).toBeVisible()
  await expect(page.getByRole('button', { name: '讓風把信吹進屋內' })).toBeHidden()
  await expect(page.getByRole('button', { name: '讓雨水暈開信封上的墨' })).toBeHidden()

  await page.getByRole('button', { name: '繼續閱讀' }).click()
  await expect(page.getByRole('heading', { level: 3, name: '寄出以後' })).toBeVisible()
  await page.getByRole('button', { name: '繼續閱讀' }).click()
  await expect(page.getByRole('heading', { level: 3, name: '燈下的信' })).toBeVisible()
  await expect(page.getByRole('img', { name: /暖黃燈光下/ })).toBeAttached()
  await page.getByRole('button', { name: '繼續閱讀' }).click()
  await expect(page.getByRole('heading', { level: 3, name: '最後一班渡船' })).toBeVisible()
  await page.getByRole('button', { name: '繼續閱讀' }).click()
  await expect(page.getByRole('group', { name: '撥動因果' })).toBeVisible()
  await page.getByRole('button', { name: '讓鐘聲早一拍傳到碼頭' }).click()
  await expect(page.getByRole('heading', { level: 3, name: '鐘聲早了一拍' })).toBeVisible()
  await page.getByRole('button', { name: '繼續閱讀' }).click()
  await expect(page.getByRole('heading', { level: 3, name: '潮線之後' })).toBeVisible()
  await expect(page.getByText('閱讀完畢')).toBeVisible()
  await expect(page.getByRole('button', { name: '繼續閱讀' })).toBeHidden()
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false)
})

test('reaches 100% only after the actual ending', async ({ page }) => {
  await page.goto('/')
  const progress = page.getByRole('progressbar', { name: '閱讀進度' })
  const prologueBottom = page.locator('#prologue-3')
  await prologueBottom.scrollIntoViewIfNeeded()
  await expect.poll(async () => Number(await progress.getAttribute('value'))).toBeGreaterThan(0)
  await expect.poll(async () => Number(await progress.getAttribute('value'))).toBeLessThan(100)
  await expect(page.getByRole('button', { name: '繼續閱讀' })).toBeVisible()

  await page.getByRole('button', { name: '繼續閱讀' }).click()
  const chapterBottom = page.locator('#chapter-3')
  await chapterBottom.scrollIntoViewIfNeeded()
  await expect.poll(async () => Number(await progress.getAttribute('value'))).toBeGreaterThan(0)
  await expect.poll(async () => Number(await progress.getAttribute('value'))).toBeLessThan(100)
  await expect(page.getByRole('button', { name: '繼續閱讀' })).toBeVisible()

  await page.getByRole('button', { name: '繼續閱讀' }).click()
  const choiceButton = page.getByRole('button', { name: '讓風把信吹進屋內' })
  await choiceButton.scrollIntoViewIfNeeded()
  await expect.poll(async () => Number(await progress.getAttribute('value'))).toBeLessThan(100)

  await choiceButton.click()
  const consequenceBottom = page.locator('#wind-3')
  await consequenceBottom.scrollIntoViewIfNeeded()
  await expect.poll(async () => Number(await progress.getAttribute('value'))).toBeLessThan(100)

  await page.getByRole('button', { name: '繼續閱讀' }).click()
  await page.getByRole('button', { name: '繼續閱讀' }).click()
  const delayedBottom = page.locator('#delayed-wind-3')
  await delayedBottom.scrollIntoViewIfNeeded()
  await expect.poll(async () => Number(await progress.getAttribute('value'))).toBeLessThan(100)
  await page.getByRole('button', { name: '繼續閱讀' }).click()
  await page.getByRole('button', { name: '繼續閱讀' }).click()
  const secondChoice = page.getByRole('group', { name: '撥動因果' })
  await secondChoice.scrollIntoViewIfNeeded()
  await expect.poll(async () => Number(await progress.getAttribute('value'))).toBeLessThan(100)
  await page.getByRole('button', { name: '讓鐘聲早一拍傳到碼頭' }).click()
  await page.locator('#bell-path-2').scrollIntoViewIfNeeded()
  await expect.poll(async () => Number(await progress.getAttribute('value'))).toBeLessThan(100)
  await page.getByRole('button', { name: '繼續閱讀' }).click()
  const ending = page.getByText('閱讀完畢')
  await ending.scrollIntoViewIfNeeded()
  await expect.poll(async () => Number(await progress.getAttribute('value'))).toBe(100)
  await expect(page.getByRole('button', { name: '繼續閱讀' })).toBeHidden()
})

test('chooses the rain consequence without rendering the wind consequence', async ({ page }) => {
  await page.goto('/')
  await reachChoice(page)

  await page.getByRole('button', { name: '讓雨水暈開信封上的墨' }).click()

  await expect(page.getByRole('heading', { level: 3, name: '墨跡散開時' })).toBeVisible()
  await expect(page.getByRole('img', { name: /雨落在郵亭石階/ })).toBeAttached()
  await expect(page.getByText(/雨沿著屋簷落下/)).toBeVisible()
  await expect(page.getByRole('heading', { level: 3, name: '風進屋時' })).toBeHidden()
  await expect(page.getByRole('group', { name: '撥動因果' })).toBeHidden()
})

test('follows the rain route through its delayed consequence and ferry rejoin', async ({ page }) => {
  await page.goto('/')
  await reachSecondChoice(page, '讓雨水暈開信封上的墨')

  await expect(page.getByRole('heading', { level: 3, name: '石階上的藍痕' })).toBeVisible()
  await expect(page.getByRole('img', { name: /雨後石階留著深藍色墨痕/ })).toBeAttached()
  await page.getByRole('button', { name: '讓繫纜繩在木樁上多停半分鐘' }).click()
  await expect(page.getByRole('heading', { level: 3, name: '繫纜多停半分鐘' })).toBeVisible()
  await expect(page.getByRole('heading', { level: 3, name: '風進屋時' })).toBeHidden()
  await page.getByRole('button', { name: '繼續閱讀' }).click()
  await expect(page.getByRole('heading', { level: 3, name: '潮線之後' })).toBeVisible()
  await expect(page.getByRole('img', { name: /暮色港口的潮線交錯延伸/ })).toBeAttached()
})

test('keeps a committed Choice irreversible while revisiting earlier text and does not add browser history', async ({ page }) => {
  await page.goto('/')
  await reachChoice(page)
  const historyBefore = await page.evaluate(() => window.history.length)

  await page.getByRole('button', { name: '讓風把信吹進屋內' }).click()
  const consequence = page.getByRole('heading', { level: 3, name: '風進屋時' })
  await expect(consequence).toBeVisible()
  expect(await page.evaluate(() => window.history.length)).toBe(historyBefore)

  await page.locator('#prologue-heading').scrollIntoViewIfNeeded()
  await page.locator('#wind-3').scrollIntoViewIfNeeded()

  await expect(page.getByRole('button', { name: '讓風把信吹進屋內' })).toBeHidden()
  await expect(page.getByRole('button', { name: '讓雨水暈開信封上的墨' })).toBeHidden()
  await expect(consequence).toBeVisible()
})

test('commits a Choice with keyboard Enter', async ({ page }) => {
  await page.goto('/')
  await reachChoice(page)
  const windChoice = page.getByRole('button', { name: '讓風把信吹進屋內' })

  await windChoice.focus()
  await expect(windChoice).toBeFocused()
  await page.keyboard.press('Enter')

  await expect(page.getByText('因果已定。')).toBeVisible()
  await expect(page.getByRole('heading', { level: 3, name: '風進屋時' })).toBeVisible()
})

test('preserves causal runtime on reload while keeping Reader state independent', async ({ page }) => {
  await page.goto('/')
  await reachChoice(page)
  await page.getByRole('button', { name: '讓風把信吹進屋內' }).click()
  await expect(page.getByRole('heading', { level: 3, name: '風進屋時' })).toBeVisible()

  await page.reload()

  await expect(page.getByRole('heading', { level: 2, name: /潮線以外/ })).toBeVisible()
  await expect(page.getByRole('heading', { level: 3, name: '霧中的郵亭' })).toBeVisible()
  await expect(page.getByRole('heading', { level: 3, name: '風進屋時' })).toBeVisible()
  await expect(page.getByRole('button', { name: '讓風把信吹進屋內' })).toBeHidden()
  await expect(page.getByRole('button', { name: '讓雨水暈開信封上的墨' })).toBeHidden()
  await expect.poll(async () =>
    page.evaluate(() => JSON.parse(window.localStorage.getItem('storyforge.runtime.runtime-demo') ?? '{}').snapshot.worldState['letter-entered']),
  ).toBe(true)
})

test('restores a delayed consequence after reload without switching causal branches', async ({ page }) => {
  await page.goto('/')
  await reachChoice(page)
  await page.getByRole('button', { name: '讓風把信吹進屋內' }).click()
  await page.getByRole('button', { name: '繼續閱讀' }).click()
  await page.getByRole('button', { name: '繼續閱讀' }).click()
  await expect(page.getByRole('heading', { level: 3, name: '燈下的信' })).toBeVisible()

  await page.reload()

  await expect(page.getByRole('heading', { level: 3, name: '燈下的信' })).toBeVisible()
  await expect(page.getByRole('img', { name: /暖黃燈光下/ })).toBeAttached()
  await expect(page.getByRole('heading', { level: 3, name: '石階上的藍痕' })).toBeHidden()
})

test('restores a second pending Choice without repeating the first Choice notice', async ({ page }) => {
  await page.goto('/')
  await reachSecondChoice(page, '讓風把信吹進屋內')
  await expect(page.getByText('觀者可以回看已發生之事。')).toBeHidden()

  await page.reload()

  await expect(page.getByRole('group', { name: '撥動因果' })).toBeVisible()
  await expect(page.getByRole('button', { name: '讓鐘聲早一拍傳到碼頭' })).toBeVisible()
  await expect(page.getByRole('button', { name: '讓繫纜繩在木樁上多停半分鐘' })).toBeVisible()
  await expect(page.getByText('觀者可以回看已發生之事。')).toBeHidden()
  await expect.poll(async () =>
    page.evaluate(() => JSON.parse(window.localStorage.getItem('storyforge.runtime.runtime-demo') ?? '{}').snapshot.choiceHistory.length),
  ).toBe(1)
})

test('restores the ending and completion state after reload', async ({ page }) => {
  await page.goto('/')
  await reachSecondChoice(page, '讓風把信吹進屋內')
  await page.getByRole('button', { name: '讓鐘聲早一拍傳到碼頭' }).click()
  await page.getByRole('button', { name: '繼續閱讀' }).click()
  await expect(page.getByText('閱讀完畢')).toBeVisible()

  await page.reload()
  await expect(page.getByRole('heading', { level: 3, name: '潮線之後' })).toBeVisible()
  await expect(page.getByText('閱讀完畢')).toBeVisible()
  await expect(page.getByRole('button', { name: '繼續閱讀' })).toBeHidden()
  await expect(page.getByRole('group', { name: '撥動因果' })).toBeHidden()
})

test('saves a single Bookmark before Choice and returns without undoing causality', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '加入書籤' }).click()
  await expect(page.getByText('書籤已更新。')).toBeVisible()
  await expect.poll(async () => page.evaluate(() => {
    const value = JSON.parse(window.localStorage.getItem('storyforge.bookmark.runtime-demo') ?? '{}')
    return value.location?.markerId
  })).toBe('prologue-heading')

  await reachChoice(page)
  await page.getByRole('button', { name: '讓風把信吹進屋內' }).click()
  await page.getByRole('button', { name: '回到書籤' }).click()
  await expect(page.getByRole('heading', { level: 3, name: '風進屋時' })).toBeVisible()
  await expect(page.getByRole('button', { name: '讓風把信吹進屋內' })).toBeHidden()
  await expect(page.getByRole('button', { name: '讓雨水暈開信封上的墨' })).toBeHidden()
})

test('restores Bookmark controls after reload without treating Bookmark as a Runtime save', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '加入書籤' }).click()
  await page.reload()

  await expect(page.getByRole('button', { name: '更新書籤' })).toBeVisible()
  await expect(page.getByRole('button', { name: '回到書籤' })).toBeVisible()
  await page.getByRole('button', { name: '回到書籤' }).click()
  await expect(page.locator('#prologue-heading')).toBeFocused()
})

test('starts a second route only from Ending and clears the first run', async ({ page }) => {
  await page.goto('/')
  await reachWindEnding(page)
  await page.getByRole('button', { name: '加入書籤' }).click()

  await page.getByRole('button', { name: '開始新一輪' }).click()
  await expect(page.getByText('這會清除目前這一輪的因果與書籤，從序章重新開始。閱讀偏好不受影響。')).toBeVisible()
  await page.getByRole('button', { name: '取消' }).click()
  await expect(page.getByText('閱讀完畢')).toBeVisible()
  await page.getByRole('button', { name: '開始新一輪' }).click()
  await page.getByRole('button', { name: '確認開始新一輪' }).click()

  await expect(page.getByRole('heading', { level: 2, name: /潮線以外/ })).toBeVisible()
  await expect(page.getByText('閱讀完畢')).toBeHidden()
  await expect(page.getByRole('button', { name: '回到書籤' })).toBeHidden()
  await expect.poll(async () => page.evaluate(() => ({
    runtime: window.localStorage.getItem('storyforge.runtime.runtime-demo'),
    bookmark: window.localStorage.getItem('storyforge.bookmark.runtime-demo'),
  }))).toEqual({ runtime: null, bookmark: null })

  await reachChoice(page)
  await page.getByRole('button', { name: '讓雨水暈開信封上的墨' }).click()
  await expect(page.getByRole('heading', { level: 3, name: '墨跡散開時' })).toBeVisible()
})

test('reloads into the fresh entry after New Run without restoring the old Ending', async ({ page }) => {
  await page.goto('/')
  await reachWindEnding(page)
  await page.getByRole('button', { name: '開始新一輪' }).click()
  await page.getByRole('button', { name: '確認開始新一輪' }).click()
  await page.reload()

  await expect(page.getByRole('heading', { level: 2, name: /潮線以外/ })).toBeVisible()
  await expect(page.getByText('閱讀完畢')).toBeHidden()
  await expect(page.getByRole('button', { name: '回到書籤' })).toBeHidden()
  await reachChoice(page)
  await expect(page.getByRole('button', { name: '讓風把信吹進屋內' })).toBeVisible()
})

test('restores a committed route after closing and reopening the page', async ({ page }) => {
  await page.goto('/')
  await reachChoice(page)
  await page.getByRole('button', { name: '讓雨水暈開信封上的墨' }).click()
  const context = page.context()
  await page.close()

  const reopened = await context.newPage()
  await reopened.goto('/')
  await expect(reopened.getByRole('heading', { level: 3, name: '墨跡散開時' })).toBeVisible()
  await expect(reopened.getByRole('heading', { level: 3, name: '風進屋時' })).toBeHidden()
  await reopened.close()
})

test('starts fresh in an isolated browser context', async ({ browser }) => {
  const firstContext = await browser.newContext()
  const firstPage = await firstContext.newPage()
  await firstPage.goto('http://127.0.0.1:4173/')
  await reachChoice(firstPage)
  await firstPage.getByRole('button', { name: '讓風把信吹進屋內' }).click()
  await firstContext.close()

  const secondContext = await browser.newContext()
  const secondPage = await secondContext.newPage()
  await secondPage.goto('http://127.0.0.1:4173/')
  await expect(secondPage.getByRole('heading', { level: 2, name: /潮線以外/ })).toBeVisible()
  await expect(secondPage.getByRole('heading', { level: 3, name: '風進屋時' })).toBeHidden()
  await secondContext.close()
})

test('falls back to a fresh runtime for malformed or incompatible saves', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => window.localStorage.setItem('storyforge.runtime.runtime-demo', '{invalid'))
  await page.reload()
  await expect(page.getByRole('heading', { level: 2, name: /潮線以外/ })).toBeVisible()
  await expect(page.getByRole('heading', { level: 3, name: '霧中的郵亭' })).toBeHidden()

  await page.evaluate(() => window.localStorage.setItem(
    'storyforge.runtime.runtime-demo',
    JSON.stringify({
      formatVersion: 999,
      storyId: 'runtime-demo',
      storyVersion: '0.1.0',
      schemaVersion: '0.1',
      snapshot: { currentNodeId: 'prologue', visibleNodeIds: ['prologue'], worldState: {}, choiceHistory: [] },
    }),
  ))
  await page.reload()
  await expect(page.getByRole('heading', { level: 2, name: /潮線以外/ })).toBeVisible()
  await expect(page.getByRole('heading', { level: 3, name: '霧中的郵亭' })).toBeHidden()
})

test('runs the Choice journey without console, page, or asset errors', async ({ page }) => {
  const errors: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`)
  })
  page.on('pageerror', (error) => errors.push(`page: ${error.message}`))
  page.on('response', (response) => {
    if (response.status() >= 400) errors.push(`response ${response.status()}: ${response.url()}`)
  })

  await page.goto('/')
  await reachChoice(page)
  await page.getByRole('button', { name: '讓風把信吹進屋內' }).click()
  await page.getByRole('button', { name: '繼續閱讀' }).click()
  await page.getByRole('button', { name: '繼續閱讀' }).click()
  await page.getByRole('button', { name: '繼續閱讀' }).click()
  await page.getByRole('button', { name: '繼續閱讀' }).click()
  await page.getByRole('button', { name: '讓鐘聲早一拍傳到碼頭' }).click()
  await page.getByRole('button', { name: '繼續閱讀' }).click()
  await expect(page.getByText('閱讀完畢')).toBeVisible()

  expect(errors).toEqual([])
})

test('opens keyboard-accessible settings and applies reader preferences', async ({ page }) => {
  await page.goto('/')
  const reader = page.locator('.book-reader')
  const content = page.locator('.reader-content')
  const initialFontSize = await content.evaluate((element) => getComputedStyle(element).fontSize)

  await page.getByRole('button', { name: '閱讀設定' }).click()
  const dialog = page.getByRole('dialog', { name: '閱讀設定' })
  await expect(dialog).toBeVisible()
  await dialog.getByText('大', { exact: true }).click()
  await dialog.getByText('寬鬆', { exact: true }).click()
  await dialog.getByText('深色', { exact: true }).click()

  await expect(reader).toHaveAttribute('data-font-size', 'large')
  await expect(reader).toHaveAttribute('data-line-height', 'relaxed')
  await expect(reader).toHaveAttribute('data-theme', 'dark')
  expect(await content.evaluate((element) => getComputedStyle(element).fontSize)).not.toBe(initialFontSize)

  await page.keyboard.press('Escape')
  await expect(page.getByRole('dialog', { name: '閱讀設定' })).toBeHidden()
  await expect(page.getByRole('button', { name: '閱讀設定' })).toBeFocused()
})

test('persists reader preferences across a runtime reload', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '閱讀設定' }).click()
  const dialog = page.getByRole('dialog', { name: '閱讀設定' })
  await dialog.getByText('特大', { exact: true }).click()
  await dialog.getByText('淺色', { exact: true }).click()
  await page.getByRole('button', { name: '關閉' }).click()
  await page.reload()

  await expect(page.locator('.book-reader')).toHaveAttribute('data-font-size', 'x-large')
  await expect(page.locator('.book-reader')).toHaveAttribute('data-theme', 'light')

  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false)
})

test('preserves a saved reading position before the resume decision', async ({ page }) => {
  await page.goto('/')
  await page.evaluate(() => {
    window.localStorage.setItem(
      'storyforge.reader.position.story:runtime-demo',
      JSON.stringify({ documentId: 'story:runtime-demo', progress: 42, updatedAt: '2026-08-15T00:00:00.000Z' }),
    )
  })
  await page.reload()

  await expect(page.getByRole('button', { name: '回到上次閱讀處' })).toBeVisible()
  await expect.poll(async () =>
    page.evaluate(() => {
      const stored = window.localStorage.getItem('storyforge.reader.position.story:runtime-demo')
      return stored ? JSON.parse(stored).progress : null
    }),
  ).toBe(42)
})
