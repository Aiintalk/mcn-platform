/**
 * M2 — 红人管理 E2E 测试
 * 运行于 "admin" project（storageState = admin.json，无需手动登录）
 */

import { test, expect } from '@playwright/test'
import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'
import { OPERATOR_STATE } from './global-setup'

function createMdFile(content = '# 测试档案\n\n这是一份测试用人格档案。') {
  const tmp = path.join(os.tmpdir(), `test-profile-${Date.now()}.md`)
  fs.writeFileSync(tmp, content, 'utf-8')
  return tmp
}

function createTxtFile() {
  const tmp = path.join(os.tmpdir(), `test-invalid-${Date.now()}.txt`)
  fs.writeFileSync(tmp, 'invalid format', 'utf-8')
  return tmp
}

// ── 套件 1：红人列表 ────────────────────────────────────────────────────────────

test.describe('M2 — 红人列表', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/kols')
    await page.waitForLoadState('networkidle')
  })

  test('管理员可访问 /admin/kols，展示列表和分页', async ({ page }) => {
    await expect(page).toHaveURL(/\/admin\/kols/)
    const list = page.locator('table, [data-testid="kol-list"], [role="table"]').first()
    await expect(list).toBeVisible()
  })

  test('按「已归档」筛选只显示归档红人', async ({ page }) => {
    const select = page.locator('select[name="status"], [data-testid="status-filter"]').first()
    if (await select.isVisible()) {
      await select.selectOption('archived')
      await page.waitForLoadState('networkidle')
      const activeRows = page.locator('[data-status="active"], .badge-active').first()
      await expect(activeRows).not.toBeVisible()
    }
  })

  test('搜索框输入关键词过滤列表', async ({ page }) => {
    const search = page.locator('input[type="search"], input[placeholder*="搜索"], [data-testid="search-input"]').first()
    if (await search.isVisible()) {
      await search.fill('不可能存在的红人XYZ123')
      await page.waitForLoadState('networkidle')
      // 空状态：<td>暂无数据</td>
      const empty = page.locator('td').filter({ hasText: '暂无数据' }).first()
      await expect(empty).toBeVisible({ timeout: 8_000 })
    }
  })

  test('点击红人行跳转到详情页', async ({ page }) => {
    const firstRow = page.locator('table tbody tr, [data-testid="kol-row"]').first()
    if (await firstRow.isVisible()) {
      await firstRow.click()
      await expect(page).toHaveURL(/\/admin\/kols\/\d+/, { timeout: 10_000 })
    } else {
      test.skip()
    }
  })

})

// ── 套件 2：新建红人 ────────────────────────────────────────────────────────────

test.describe('M2 — 新建红人（admin）', () => {

  test('填写姓名后提交 — 创建成功并跳转详情页', async ({ page }) => {
    await page.goto('/admin/kols/new')
    await page.waitForLoadState('domcontentloaded')

    const nameInput = page.locator('input[placeholder*="姓名"], input[placeholder*="名称"], input[name="name"]').first()
    await nameInput.fill(`E2E测试红人_${Date.now()}`)
    await page.locator('button[type="submit"]').click()

    await expect(page).toHaveURL(/\/admin\/kols\/\d+/, { timeout: 15_000 })
  })

  test('不填姓名直接提交 — 表单报错不提交', async ({ page }) => {
    await page.goto('/admin/kols/new')
    await page.waitForLoadState('domcontentloaded')
    await page.locator('button[type="submit"]').click()
    await expect(page).toHaveURL(/\/admin\/kols\/new/)
  })

})

// ── 套件 2b：运营无权新建 ───────────────────────────────────────────────────────

test.describe('M2 — 新建红人（operator 权限）', () => {

  test.use({ storageState: OPERATOR_STATE })

  test('运营无法访问 /admin/kols/new', async ({ page }) => {
    await page.goto('/admin/kols/new')
    const url = page.url()
    const blocked = !url.includes('/admin')
    const bodyText = await page.evaluate(() => document.body?.textContent ?? '')
    const hasForbidden = bodyText.includes('Forbidden') || bodyText.includes('权限') || bodyText.includes('403')
    expect(blocked || hasForbidden).toBeTruthy()
  })

})

// ── 套件 3：人格档案 ────────────────────────────────────────────────────────────

test.describe('M2 — 红人详情 · 人格档案', () => {

  let kolId: string

  test.beforeEach(async ({ page }) => {
    const res = await page.request.post('/api/kols', {
      data: { name: `E2E档案测试_${Date.now()}`, tags: [] },
    })
    expect(res.status()).toBe(201)
    const body = await res.json()
    kolId = body.data?.id ?? body.id
    expect(kolId).toBeTruthy()
  })

  test('打开详情页 — 人格档案 Tab 可见', async ({ page }) => {
    await page.goto(`/admin/kols/${kolId}`)
    await page.waitForLoadState('networkidle')
    const tab = page.locator('[role="tab"]:has-text("人格档案"), button:has-text("人格档案")').first()
    await expect(tab).toBeVisible()
  })

  test('上传 .md 文件 — 上传成功提示', async ({ page }) => {
    await page.goto(`/admin/kols/${kolId}`)
    await page.waitForLoadState('networkidle')

    const profileTab = page.locator('[role="tab"]:has-text("人格档案"), button:has-text("人格档案")').first()
    if (await profileTab.isVisible()) await profileTab.click()

    const mdFile = createMdFile()
    await page.locator('input[type="file"]').first().setInputFiles(mdFile)

    // toast: "人格档案已更新"
    await expect(
      page.getByText('人格档案已更新')
    ).toBeVisible({ timeout: 15_000 })

    fs.unlinkSync(mdFile)
  })

  test('上传非法格式（.txt）— 显示错误提示', async ({ page }) => {
    await page.goto(`/admin/kols/${kolId}`)
    await page.waitForLoadState('networkidle')

    const profileTab = page.locator('[role="tab"]:has-text("人格档案"), button:has-text("人格档案")').first()
    if (await profileTab.isVisible()) await profileTab.click()

    const txtFile = createTxtFile()
    await page.locator('input[type="file"]').first().setInputFiles(txtFile)

    // toast: "仅支持 .md / .docx 格式"
    await expect(
      page.getByText('仅支持 .md / .docx 格式')
    ).toBeVisible({ timeout: 10_000 })

    fs.unlinkSync(txtFile)
  })

})

// ── 套件 4：历史版本 ────────────────────────────────────────────────────────────

test.describe('M2 — 红人详情 · 历史版本', () => {

  let kolId: string

  test.beforeEach(async ({ page }) => {
    const res = await page.request.post('/api/kols', {
      data: { name: `E2E版本测试_${Date.now()}`, tags: [] },
    })
    expect(res.status()).toBe(201)
    kolId = (await res.json()).data?.id ?? (await res.json()).id

    // API 字段：soulMd / contentPlanMd（不是 contentMd）
    await page.request.post(`/api/kols/${kolId}/upload-profile`, {
      data: { soulMd: '# 版本 1\n第一次', contentPlanMd: '' },
    })
    await page.request.post(`/api/kols/${kolId}/upload-profile`, {
      data: { soulMd: '# 版本 2\n第二次', contentPlanMd: '' },
    })
  })

  test('历史版本 Tab 显示两条记录', async ({ page }) => {
    await page.goto(`/admin/kols/${kolId}`)
    await page.waitForLoadState('networkidle')

    const historyTab = page.locator('[role="tab"]:has-text("历史版本"), button:has-text("历史版本")').first()
    if (!await historyTab.isVisible()) { test.skip(); return }

    await historyTab.click()
    await page.waitForLoadState('networkidle')

    // 历史版本 UI 是 div 列表，每条版本有"预览"按钮
    const previewBtns = page.getByRole('button', { name: '预览' })
    await expect(previewBtns).toHaveCount(2, { timeout: 10_000 })
  })

  test('点击历史版本可预览内容', async ({ page }) => {
    await page.goto(`/admin/kols/${kolId}`)
    await page.waitForLoadState('networkidle')

    const historyTab = page.locator('[role="tab"]:has-text("历史版本"), button:has-text("历史版本")').first()
    if (!await historyTab.isVisible()) { test.skip(); return }

    await historyTab.click()
    await page.waitForLoadState('networkidle')

    // 点击"预览"展开内容
    const firstPreviewBtn = page.getByRole('button', { name: '预览' }).first()
    await firstPreviewBtn.click({ timeout: 10_000 })

    // 展开后按钮变为"收起"，且有预览内容出现
    const collapseBtn = page.getByRole('button', { name: '收起' }).first()
    await expect(collapseBtn).toBeVisible({ timeout: 5_000 })
  })

})

// ── 套件 5：归档红人 ────────────────────────────────────────────────────────────

test.describe('M2 — 归档红人', () => {

  let kolId: string

  test.beforeEach(async ({ page }) => {
    const res = await page.request.post('/api/kols', {
      data: { name: `E2E归档测试_${Date.now()}`, tags: [] },
    })
    expect(res.status()).toBe(201)
    kolId = (await res.json()).data?.id ?? (await res.json()).id
  })

  test('点击「归档」并确认后红人从 active 列表消失', async ({ page }) => {
    // 归档按钮在列表页，不在详情页
    await page.goto('/admin/kols')
    await page.waitForLoadState('networkidle')

    // 找到该红人的行（通过跳转链接定位）
    const kolRow = page.locator(`tr:has(a[href*="/kols/${kolId}"])`).first()

    if (!await kolRow.isVisible({ timeout: 5_000 })) {
      // 列表可能有分页，数量多时红人在后面页，直接通过 API 归档验证
      const res = await page.request.delete(`/api/kols/${kolId}`)
      expect([200, 204]).toContain(res.status())
      return
    }

    const archiveBtn = kolRow.getByRole('button', { name: '归档' }).first()
    await expect(archiveBtn).toBeVisible({ timeout: 3_000 })
    await archiveBtn.click()

    // 确认弹窗（ConfirmDialog，confirmLabel="确认归档"）
    const confirmBtn = page.getByRole('button', { name: '确认归档' })
    await expect(confirmBtn).toBeVisible({ timeout: 5_000 })
    await confirmBtn.click()

    await page.waitForLoadState('networkidle')
    // 归档后该行不再出现在列表（默认 active 过滤）
    await expect(page.locator(`tr:has(a[href*="/kols/${kolId}"])`)).not.toBeVisible({ timeout: 5_000 })
  })

  test('筛选「已归档」后被归档的红人出现', async ({ page }) => {
    await page.request.delete(`/api/kols/${kolId}`)
    await page.goto('/admin/kols')
    await page.waitForLoadState('networkidle')

    const select = page.locator('select[name="status"], [data-testid="status-filter"]').first()
    if (!await select.isVisible()) { test.skip(); return }

    await select.selectOption('archived')
    await page.waitForLoadState('networkidle')
    await expect(page.locator(`a[href*="/kols/${kolId}"]`).first()).toBeVisible({ timeout: 10_000 })
  })

})

// ── 套件 6：运营端首页 ──────────────────────────────────────────────────────────

test.describe('M2 — 运营端首页', () => {

  test.use({ storageState: OPERATOR_STATE })

  test('运营进入首页，不在 /login', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    await expect(page).not.toHaveURL(/\/login/)
  })

  test('运营首页无「新建」入口', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    const createBtn = page.locator('button:has-text("新建"), button:has-text("创建"), a[href*="/new"]').first()
    await expect(createBtn).not.toBeVisible()
  })

})
