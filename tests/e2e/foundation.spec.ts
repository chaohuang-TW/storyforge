import { expect, test } from '@playwright/test'

test('renders the continuous reader and all presentation content', async ({ page }) => {
  const response = await page.goto('/')

  expect(response?.ok()).toBeTruthy()
  await expect(page).toHaveTitle('StoryForge — Web Interactive Novel Engine')
  await expect(page.getByRole('heading', { level: 1, name: '潮汐線以北' })).toBeVisible()
  await expect(page.getByRole('main')).toBeVisible()
  await expect(page.getByText(/清晨的雨停在六點以前/)).toBeVisible()
  await expect(page.getByText('「前面的路還通嗎？」')).toBeAttached()
  await expect(page.getByRole('img', { name: /層疊的灰藍山丘/ })).toBeAttached()
  await expect(page.getByText(/示例插圖：霧中的路徑/)).toBeAttached()

  const isLongForm = await page.evaluate(() => {
    const minimumScreens = window.innerWidth <= 430 ? 4 : 2
    return document.documentElement.scrollHeight > window.innerHeight * minimumScreens
  })
  expect(isLongForm).toBe(true)

  const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  expect(hasHorizontalOverflow).toBe(false)
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

test('persists preferences across reload and reaches the end without overflow', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('button', { name: '閱讀設定' }).click()
  const dialog = page.getByRole('dialog', { name: '閱讀設定' })
  await dialog.getByText('特大', { exact: true }).click()
  await dialog.getByText('淺色', { exact: true }).click()
  await page.getByRole('button', { name: '關閉' }).click()
  await page.reload()

  await expect(page.locator('.book-reader')).toHaveAttribute('data-font-size', 'x-large')
  await expect(page.locator('.book-reader')).toHaveAttribute('data-theme', 'light')

  await page.getByText('本篇示例閱讀完畢').scrollIntoViewIfNeeded()
  await expect(page.getByRole('progressbar', { name: '閱讀進度' })).toHaveAttribute('value', '100')
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false)
})
