import { expect, test } from '@playwright/test'

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

test('appends runtime nodes and reaches the ending without removing prior text', async ({ page }) => {
  await page.goto('/')
  const prologue = page.getByText(/港口的鐘在天色尚未亮透時響了一次/)

  await page.getByRole('button', { name: '繼續閱讀' }).click()
  await expect(prologue).toBeVisible()
  await expect(page.getByRole('heading', { level: 3, name: '霧中的郵亭' })).toBeVisible()
  await expect(page.getByRole('img', { name: /霧色山丘與海岸/ })).toBeAttached()

  await page.getByRole('button', { name: '繼續閱讀' }).click()
  await expect(prologue).toBeVisible()
  await expect(page.getByRole('heading', { level: 3, name: '寄出以後' })).toBeVisible()
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
  const ending = page.getByText('閱讀完畢')
  await ending.scrollIntoViewIfNeeded()
  await expect.poll(async () => Number(await progress.getAttribute('value'))).toBe(100)
  await expect(page.getByRole('button', { name: '繼續閱讀' })).toBeHidden()
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
