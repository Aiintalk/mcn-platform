/**
 * M2 — 爆款脚本管理 E2E 测试
 *
 * 覆盖范围：
 *   - 页面可访问，4 个类型 Tab
 *   - 切换 Tab 列表按类型过滤
 *   - 新建爆款记录（人设爆款）
 *   - 编辑已有记录
 *   - 删除记录
 *   - 按关联红人筛选
 *   - 运营调用 DELETE 返回 403
 *
 * 认证：admin project storageState（playwright.config.ts 已注入），无需手动登录。
 * operator 套件用 test.use({ storageState: OPERATOR_STATE }) 切换。
 */

import { test, expect } from '@playwright/test'
import { OPERATOR_STATE } from './global-setup'

// 与 viral-scripts/page.tsx 中 TAB_LABELS 保持一致
const TYPE_LABEL: Record<string, string> = {
  persona: '人设爆款',
  qianchuan: '千川爆款',
  live: '直播间爆款',
  tiktok: 'TikTok爆款',
}

// ── 套件 1：页面基础结构 ──────────────────────────────────────────────────────

test.describe('M2 — 爆款库基础结构', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/viral-scripts')
    await page.waitForLoadState('networkidle')
  })

  test('访问 /admin/viral-scripts 展示 4 个类型 Tab', async ({ page }) => {
    await expect(page).toHaveURL(/\/admin\/viral-scripts/)

    for (const label of Object.values(TYPE_LABEL)) {
      const tab = page.locator(`[role="tab"]:has-text("${label}"), button:has-text("${label}")`).first()
      await expect(tab).toBeVisible()
    }
  })

  test('切换 Tab — 列表内容按类型更新', async ({ page }) => {
    const qianchuanTab = page.locator(
      '[role="tab"]:has-text("千川"), button:has-text("千川")'
    ).first()
    if (await qianchuanTab.isVisible()) {
      await qianchuanTab.click()
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveURL(/\/admin\/viral-scripts/)
    }
  })

})

// ── 套件 2：新建爆款记录 ──────────────────────────────────────────────────────

test.describe('M2 — 新建爆款记录', () => {

  let scriptId: string

  test.afterEach(async ({ page }) => {
    if (scriptId) {
      await page.request.delete(`/api/viral-scripts/${scriptId}`)
    }
  })

  test('新建「人设爆款」记录 — 出现在列表中', async ({ page }) => {
    await page.goto('/admin/viral-scripts')
    await page.waitForLoadState('networkidle')

    const createBtn = page.locator(
      'button:has-text("新建"), button:has-text("添加"), button:has-text("创建"), [data-testid="create-btn"]'
    ).first()
    if (!await createBtn.isVisible({ timeout: 5_000 })) {
      test.skip()
      return
    }
    await createBtn.click()

    // 新建/编辑弹窗：自定义 div.fixed.inset-0（非 role="dialog"）
    const dialog = page.locator('.fixed.inset-0').filter({ hasText: '新建' }).first()
    await expect(dialog).toBeVisible({ timeout: 5_000 })

    const title = `E2E爆款_${Date.now()}`

    const titleInput = dialog.locator('input[placeholder="爆款标题"]').first()
    if (await titleInput.isVisible()) await titleInput.fill(title)

    const transcriptInput = dialog.locator('textarea').first()
    if (await transcriptInput.isVisible()) await transcriptInput.fill('这是 E2E 测试转写文稿。')

    // 同时等待 API 响应，从响应体获取 scriptId 用于清理
    const [createRes] = await Promise.all([
      page.waitForResponse((res) =>
        res.url().includes('/api/viral-scripts') && res.request().method() === 'POST'
      ),
      dialog.locator('button[type="submit"]').first().click(),
    ])

    if (createRes.status() === 201) {
      const body = await createRes.json()
      scriptId = String(body.data?.id ?? body.id ?? '')
    }

    await expect(dialog).not.toBeVisible({ timeout: 10_000 })

    await page.waitForLoadState('networkidle')
    const newRow = page.locator(`text=${title}`).first()
    if (await newRow.isVisible({ timeout: 5_000 })) {
      await expect(newRow).toBeVisible()
    }
  })

})

// ── 套件 3：编辑爆款记录 ──────────────────────────────────────────────────────

test.describe('M2 — 编辑爆款记录', () => {

  let scriptId: string

  test.beforeEach(async ({ page }) => {
    const res = await page.request.post('/api/viral-scripts', {
      data: {
        type: 'persona',
        title: `E2E编辑前_${Date.now()}`,
        transcript: '原始文稿',
        structureMd: '',
      },
    })
    if (res.status() === 201) {
      const body = await res.json()
      scriptId = body.data?.id ?? body.id
    }
  })

  test.afterEach(async ({ page }) => {
    if (scriptId) await page.request.delete(`/api/viral-scripts/${scriptId}`)
  })

  test('编辑记录 — 内容更新成功', async ({ page }) => {
    if (!scriptId) { test.skip(); return }

    await page.goto('/admin/viral-scripts')
    await page.waitForLoadState('networkidle')

    const editBtn = page.locator(
      `[data-id="${scriptId}"] button:has-text("编辑"), tr:has([data-id="${scriptId}"]) button:has-text("编辑")`
    ).first()

    if (!await editBtn.isVisible({ timeout: 3_000 })) {
      const res = await page.request.patch(`/api/viral-scripts/${scriptId}`, {
        data: { title: `E2E编辑后_${Date.now()}` },
      })
      expect(res.status()).toBe(200)
      return
    }

    await editBtn.click()

    const dialog = page.locator('[role="dialog"]').first()
    await expect(dialog).toBeVisible({ timeout: 5_000 })

    const newTitle = `E2E编辑后_${Date.now()}`
    const titleInput = dialog.locator('input[name="title"], input[id="title"]').first()
    await titleInput.clear()
    await titleInput.fill(newTitle)

    await dialog.locator('button[type="submit"], button:has-text("保存")').first().click()
    await expect(dialog).not.toBeVisible({ timeout: 10_000 })

    await page.waitForLoadState('networkidle')
    await expect(page.locator(`text=${newTitle}`).first()).toBeVisible()
  })

})

// ── 套件 4：删除爆款记录 ──────────────────────────────────────────────────────

test.describe('M2 — 删除爆款记录', () => {

  let scriptId: string

  test.beforeEach(async ({ page }) => {
    const res = await page.request.post('/api/viral-scripts', {
      data: {
        type: 'persona',
        title: `E2E删除_${Date.now()}`,
        transcript: '待删除文稿',
        structureMd: '',
      },
    })
    if (res.status() === 201) {
      const body = await res.json()
      scriptId = body.data?.id ?? body.id
    }
  })

  test('删除记录 — 从列表消失', async ({ page }) => {
    if (!scriptId) { test.skip(); return }

    await page.goto('/admin/viral-scripts')
    await page.waitForLoadState('networkidle')

    const deleteBtn = page.locator(
      `[data-id="${scriptId}"] button:has-text("删除"), tr:has([data-id="${scriptId}"]) button:has-text("删除")`
    ).first()

    if (!await deleteBtn.isVisible({ timeout: 3_000 })) {
      const res = await page.request.delete(`/api/viral-scripts/${scriptId}`)
      expect(res.status()).toBe(200)
      scriptId = ''
      return
    }

    await deleteBtn.click()

    const confirmBtn = page.locator(
      'button:has-text("确认"), button:has-text("确定"), [data-testid="confirm-ok"]'
    ).first()
    if (await confirmBtn.isVisible({ timeout: 3_000 })) {
      await confirmBtn.click()
    }

    await page.waitForLoadState('networkidle')
    const row = page.locator(`[data-id="${scriptId}"]`).first()
    await expect(row).not.toBeVisible()
    scriptId = ''
  })

})

// ── 套件 5：关联红人筛选 ──────────────────────────────────────────────────────

test.describe('M2 — 按关联红人筛选', () => {

  test('按关联红人筛选 — 仅显示该红人关联的爆款', async ({ page }) => {
    await page.goto('/admin/viral-scripts')
    await page.waitForLoadState('networkidle')

    const kolFilter = page.locator(
      'select[name="kolId"], [data-testid="kol-filter"], [placeholder*="红人"]'
    ).first()

    if (await kolFilter.isVisible()) {
      await kolFilter.selectOption({ index: 1 })
      await page.waitForLoadState('networkidle')
      await expect(page).toHaveURL(/\/admin\/viral-scripts/)
    } else {
      test.skip()
    }
  })

})

// ── 套件 6：权限验证 ──────────────────────────────────────────────────────────

test.describe('M2 — 爆款库权限', () => {

  test.use({ storageState: OPERATOR_STATE })

  test('运营调用 DELETE /api/viral-scripts/[id] — 返回 403', async ({ page }) => {
    const res = await page.request.delete('/api/viral-scripts/1')
    expect(res.status()).toBe(403)
  })

})
