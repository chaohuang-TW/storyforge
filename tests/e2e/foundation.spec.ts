import { expect, test } from '@playwright/test'

test('loads the StoryForge foundation without horizontal overflow', async ({ page }) => {
  const response = await page.goto('/')

  expect(response?.ok()).toBeTruthy()
  await expect(page).toHaveTitle('StoryForge — Web Interactive Novel Engine')
  await expect(page.getByRole('heading', { name: 'StoryForge' })).toBeVisible()
  await expect(page.getByRole('main')).toBeVisible()

  const hasHorizontalOverflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
  expect(hasHorizontalOverflow).toBe(false)
})
