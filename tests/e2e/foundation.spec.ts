import { expect, test, type Page } from '@playwright/test'

const light = '讓一線天光穿過雲縫。'
const mist = '讓山霧再停一刻。'
const canon = '不動。讓這一刻照原來的速度發生。'
const water = '讓山泉漫過竹籃底。'

async function advanceUntil(page: Page, target: Parameters<Page['getByText']>[0] | ReturnType<Page['getByText']>, label: string, limit = 80) {
  const locator = typeof target === 'string' ? page.getByText(target) : target
  for (let index = 0; index < limit; index += 1) {
    if (await locator.count() > 0 && await locator.first().isVisible()) return
    const next = page.getByRole('button', { name: '繼續閱讀' })
    if (await next.count() === 0 || !await next.first().isVisible()) throw new Error(`Unable to reach ${label}; continuation ended early`)
    await next.first().click()
  }
  throw new Error(`Unable to reach ${label} within ${limit} continuation steps`)
}

async function reachWuxingChoice(page: Page) {
  await advanceUntil(page, page.getByRole('button', { name: light }), 'the 五行山 choice')
  await expect(page.getByRole('group', { name: '撥動因果' })).toBeVisible()
}

async function reachWhiteboneChoice(page: Page, firstChoice = light) {
  await reachWuxingChoice(page)
  await page.getByRole('button', { name: firstChoice }).click()
  await advanceUntil(page, page.getByRole('button', { name: water }), 'the 白骨嶺 choice')
  await expect(page.getByRole('button', { name: canon })).toBeVisible()
  await expect(page.getByRole('button', { name: water })).toBeVisible()
}

async function reachEnding(page: Page, firstChoice = light, secondChoice = water) {
  await reachWhiteboneChoice(page, firstChoice)
  await page.getByRole('button', { name: secondChoice }).click()
  await advanceUntil(page, page.getByText('閱讀完畢'), 'the Journey81 ending')
}

test('loads only the Journey81 entry node in the continuous reader', async ({ page }) => {
  const response = await page.goto('/')
  expect(response?.ok()).toBeTruthy()
  await expect(page).toHaveTitle('StoryForge — Web Interactive Novel Engine')
  await expect(page.getByRole('heading', { level: 1, name: '西遊：八十一劫' })).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: /沒有被風吹動的紙/ })).toBeVisible()
  await expect(page.getByText(/紙頁躺在石階中央/)).toBeVisible()
  await expect(page.getByText(/你不在西遊記裡/)).toBeVisible()
  await expect(page.getByRole('heading', { level: 3, name: '五行山・石下的聲音' })).toBeHidden()
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false)
  expect(await page.evaluate(() => document.documentElement.scrollHeight > window.innerHeight * (window.innerWidth <= 430 ? 1.5 : 1))).toBe(true)
})

test('uses real mobile emulation for the mobile project', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-chromium', 'Mobile profile assertion')
  const environment = await page.evaluate(() => ({ maxTouchPoints: navigator.maxTouchPoints, userAgent: navigator.userAgent }))
  expect(page.viewportSize()).toEqual({ width: 390, height: 844 })
  expect(environment.maxTouchPoints).toBeGreaterThan(0)
  expect(environment.userAgent).toContain('Mobile')
})

test('appends Journey81 nodes and preserves prior text through the light branch', async ({ page }) => {
  await page.goto('/')
  const prologue = page.getByText(/紙頁躺在石階中央/)
  await reachWuxingChoice(page)
  await expect(prologue).toBeVisible()
  await page.getByRole('button', { name: light }).click()
  await expect(page.getByText(/雲縫被光撐開一瞬/)).toBeVisible()
  await expect(page.getByRole('img', { name: /一線天光穿過雲縫/ })).toBeAttached()
  await expect(page.getByText('因果已定。')).toBeVisible()
  await expect(page.getByRole('button', { name: light })).toBeHidden()
  await expect(page.getByRole('button', { name: mist })).toBeHidden()
  expect(await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)).toBe(false)
})

test('reaches 100% only after the actual Journey81 ending', async ({ page }) => {
  await page.goto('/')
  const progress = page.getByRole('progressbar', { name: '閱讀進度' })
  await expect.poll(async () => Number(await progress.getAttribute('value'))).toBeLessThan(100)
  await reachEnding(page)
  await expect(page.getByRole('heading', { level: 2, name: /路還向西/ })).toBeVisible()
  await expect(page.getByText('閱讀完畢')).toBeVisible()
  await page.getByText('閱讀完畢').scrollIntoViewIfNeeded()
  await expect.poll(async () => Number(await progress.getAttribute('value'))).toBe(100)
})

test('chooses the mist consequence without rendering the light consequence', async ({ page }) => {
  await page.goto('/'); await reachWuxingChoice(page); await page.getByRole('button', { name: mist }).click()
  await expect(page.getByText(/霧沒有散/)).toBeVisible()
  await expect(page.getByText(/雲縫被光撐開一瞬/)).toBeHidden()
})

test('follows the light route through its delayed consequence and whitebone rejoin', async ({ page }) => {
  await page.goto('/'); await reachWhiteboneChoice(page, light); await page.getByRole('button', { name: water }).click()
  await advanceUntil(page, page.getByText(/山影裡那個人向前一步，臉被月光擦亮/), 'the light delayed consequence')
  await expect(page.getByText(/山影裡那個人向前一步，先有腳步聲/)).toBeHidden()
  await advanceUntil(page, page.getByText(/唐僧看過水裡的破綻/), 'the water outcome')
  await expect(page.getByText(/看見真相，和決定如何使用力量/)).toBeVisible()
})

test('keeps a committed Choice irreversible while revisiting earlier text', async ({ page }) => {
  await page.goto('/'); await reachWuxingChoice(page); const historyBefore = await page.evaluate(() => window.history.length)
  await page.getByRole('button', { name: light }).click(); await expect(page.getByText(/雲縫被光撐開一瞬/)).toBeVisible()
  expect(await page.evaluate(() => window.history.length)).toBe(historyBefore)
  await page.locator('#prologue-001-heading').scrollIntoViewIfNeeded()
  await expect(page.getByRole('button', { name: light })).toBeHidden()
  await expect(page.getByRole('button', { name: mist })).toBeHidden()
})

test('commits a Journey Choice with keyboard Enter', async ({ page }) => {
  await page.goto('/'); await reachWuxingChoice(page); const choice = page.getByRole('button', { name: light }); await choice.focus(); await expect(choice).toBeFocused(); await page.keyboard.press('Enter')
  await expect(page.getByText('因果已定。')).toBeVisible(); await expect(page.getByText(/雲縫被光撐開一瞬/)).toBeVisible()
})

test('preserves causal Journey runtime on reload while keeping Reader state independent', async ({ page }) => {
  await page.goto('/'); await reachWuxingChoice(page); await page.getByRole('button', { name: light }).click(); await page.reload()
  await expect(page.getByRole('heading', { level: 1, name: '西遊：八十一劫' })).toBeVisible()
  await expect(page.getByText(/雲縫被光撐開一瞬/)).toBeVisible()
  await expect(page.getByRole('button', { name: light })).toBeHidden()
  await expect.poll(async () => page.evaluate(() => JSON.parse(window.localStorage.getItem('storyforge.runtime.journey81') ?? '{}').snapshot.worldState.wuxing_first_touch)).toBe('light')
})

test('restores a pending whitebone Choice after reload and hides Memory on first run', async ({ page }) => {
  await page.goto('/'); await reachWhiteboneChoice(page); await page.reload()
  await expect(page.getByRole('button', { name: canon })).toBeVisible()
  await expect(page.getByRole('button', { name: water })).toBeVisible()
  await expect(page.getByRole('button', { name: /讓水光先照進她的左腕/ })).toBeHidden()
})

test('restores the Journey ending and completion controls after reload', async ({ page }) => {
  await page.goto('/'); await reachEnding(page); await page.reload()
  await expect(page.getByRole('heading', { level: 2, name: /路還向西/ })).toBeVisible()
  await expect(page.getByText('閱讀完畢')).toBeVisible(); await expect(page.getByRole('button', { name: '開始新一輪' })).toBeVisible()
})

test('saves a Journey bookmark before a Choice without undoing causality', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: '加入書籤' }).click(); await expect(page.getByText('書籤已更新。')).toBeVisible()
  expect(await page.evaluate(() => JSON.parse(window.localStorage.getItem('storyforge.bookmark.journey81') ?? '{}').location.markerId)).toBe('prologue-001-heading')
  await reachWuxingChoice(page); await page.getByRole('button', { name: light }).click(); await page.getByRole('button', { name: '回到書籤' }).click()
  await expect(page.getByRole('heading', { level: 2, name: /沒有被風吹動的紙/ })).toBeVisible(); await expect(page.getByRole('button', { name: light })).toBeHidden()
})

test('restores Bookmark controls after reload', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: '加入書籤' }).click(); await page.reload(); await expect(page.getByRole('button', { name: '更新書籤' })).toBeVisible(); await expect(page.getByRole('button', { name: '回到書籤' })).toBeVisible()
})

test('proves the full first-run to New Run to Memory lifecycle without seeding memory', async ({ page }) => {
  await page.goto('/')
  await reachWhiteboneChoice(page, light); await page.getByRole('button', { name: water }).click()
  await advanceUntil(page, page.getByText(/那個人走到泉邊/), 'the first-run truth node')
  await advanceUntil(page, page.getByText('閱讀完畢'), 'the first-run ending')
  const memory = await page.evaluate(() => JSON.parse(window.localStorage.getItem('storyforge.memory.journey81') ?? '{}'))
  expect(memory.storyId).toBe('journey81'); expect(memory.memory['journey81.white-bone-truth']).toBe(true)
  await page.getByRole('button', { name: '開始新一輪' }).click(); await page.getByRole('button', { name: '確認開始新一輪' }).click()
  await expect(page.getByRole('heading', { level: 2, name: /沒有被風吹動的紙/ })).toBeVisible()
  expect(await page.evaluate(() => window.localStorage.getItem('storyforge.runtime.journey81'))).toBeNull()
  expect(await page.evaluate(() => window.localStorage.getItem('storyforge.bookmark.journey81'))).toBeNull()
  await reachWhiteboneChoice(page, light)
  const memoryChoice = page.getByRole('button', { name: /讓水光先照進她的左腕/ })
  await expect(memoryChoice).toBeVisible(); await memoryChoice.click()
  await expect(page.getByText(/水光沒有等婦人把袖子放下/)).toBeVisible()
  await advanceUntil(page, page.getByText(/這一次，唐僧很早就知道/), 'the Memory outcome')
  await advanceUntil(page, page.getByText('閱讀完畢'), 'the Memory ending')
  await expect(page.getByRole('heading', { level: 2, name: /路還向西/ })).toBeVisible()
})

test('keeps Reader Memory after New Run and reload', async ({ page }) => {
  await page.goto('/'); await reachEnding(page); await page.getByRole('button', { name: '開始新一輪' }).click(); await page.getByRole('button', { name: '確認開始新一輪' }).click(); await page.reload()
  await expect(page.getByRole('heading', { level: 2, name: /沒有被風吹動的紙/ })).toBeVisible()
  expect(await page.evaluate(() => JSON.parse(window.localStorage.getItem('storyforge.memory.journey81') ?? '{}').memory['journey81.white-bone-truth'])).toBe(true)
})

test('closes and reopens a committed light branch', async ({ page }) => {
  await page.goto('/'); await reachWuxingChoice(page); await page.getByRole('button', { name: light }).click(); await page.reload(); await expect(page.getByText(/雲縫被光撐開一瞬/)).toBeVisible()
})

test('isolates a fresh browser context from Journey Memory', async ({ browser }) => {
  const context = await browser.newContext(); const page = await context.newPage(); await page.goto('http://127.0.0.1:4173/'); await reachWuxingChoice(page); await expect(page.getByRole('button', { name: /讓水光先照進她的左腕/ })).toBeHidden(); await context.close()
})

test('ignores malformed Journey runtime and stale runtime-demo keys', async ({ page }) => {
  await page.goto('/'); await page.evaluate(() => { localStorage.setItem('storyforge.runtime.journey81', '{bad'); localStorage.setItem('storyforge.runtime.runtime-demo', JSON.stringify({ storyId: 'runtime-demo', snapshot: { currentNodeId: 'wind-path' } })) }); await page.reload()
  await expect(page.getByRole('heading', { level: 2, name: /沒有被風吹動的紙/ })).toBeVisible(); await expect(page.getByRole('heading', { level: 3, name: '風進屋時' })).toBeHidden()
})

test('ignores malformed Journey Memory and keeps Memory choice hidden', async ({ page }) => {
  await page.goto('/'); await page.evaluate(() => localStorage.setItem('storyforge.memory.journey81', JSON.stringify({ formatVersion: 1, storyId: 'journey81', storyVersion: '0.1.0', schemaVersion: '0.1', memory: { broken: 'yes' } }))); await page.reload(); await reachWhiteboneChoice(page); await expect(page.getByRole('button', { name: /讓水光先照進她的左腕/ })).toBeHidden()
})

test('loads Journey81 illustrations without browser or asset errors', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', (error) => errors.push(error.message)); page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()) }); await page.goto('/'); await reachEnding(page)
  expect(errors).toEqual([]); expect(await page.locator('img').evaluateAll((images) => images.length >= 9 && images.every((image) => image.getAttribute('src')?.startsWith('data:image/')))).toBe(true)
})

test('keeps Reader settings accessible', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: '閱讀設定' }).click(); await expect(page.getByRole('dialog', { name: '閱讀設定' })).toBeVisible(); await expect(page.getByRole('radio', { name: '大', exact: true })).toBeVisible(); await page.getByRole('button', { name: '關閉' }).click(); await expect(page.getByRole('dialog', { name: '閱讀設定' })).toBeHidden()
})

test('persists Reader preference after reload', async ({ page }) => {
  await page.goto('/'); await page.getByRole('button', { name: '閱讀設定' }).click(); await page.locator('label').filter({ hasText: '寬鬆' }).click(); await page.reload(); await expect(page.locator('.book-reader')).toHaveAttribute('data-line-height', 'relaxed')
})

test('saves and resumes a Journey reader position', async ({ page }) => {
  await page.goto('/'); await page.evaluate(() => localStorage.setItem('storyforge.reader.position.story:journey81', JSON.stringify({ documentId: 'story:journey81', progress: 42, updatedAt: new Date().toISOString() }))); await page.reload(); await expect(page.getByRole('button', { name: '回到上次閱讀處' })).toBeVisible(); await page.getByRole('button', { name: '回到上次閱讀處' }).click(); await expect(page.getByRole('button', { name: '回到上次閱讀處' })).toBeHidden()
})
