/**
 * M2 — 产品管理 E2E 测试
 *
 * 覆盖范围：
 *   - 产品列表（管理员）
 *   - 新建产品（有效 / 无效）
 *   - 产品详情页
 *   - 编辑产品基础信息
 *   - 上传卖点文档（.md / .docx）
 *   - 删除产品
 *
 * 认证：admin project storageState（playwright.config.ts 已注入），无需手动登录。
 * operator 套件用 test.use({ storageState: OPERATOR_STATE }) 切换。
 */

import { test, expect } from '@playwright/test'
import * as path from 'path'
import * as fs from 'fs'
import * as os from 'os'
import { OPERATOR_STATE } from './global-setup'

/** 创建三段 ## 分节的 .md 文件，用于卖点上传 */
function createSellingPointsMd() {
  const content = `## 背书

这是背书内容，品牌合作信息。

## 机制

产品使用方法和核心机制说明。

## 种草

种草文案，适合 KOL 二次创作。
`
  const tmp = path.join(os.tmpdir(), `test-selling-points-${Date.now()}.md`)
  fs.writeFileSync(tmp, content, 'utf-8')
  return tmp
}

function createTxtFile() {
  const tmp = path.join(os.tmpdir(), `test-invalid-${Date.now()}.txt`)
  fs.writeFileSync(tmp, 'invalid', 'utf-8')
  return tmp
}

// ── 套件 1：产品列表 ──────────────────────────────────────────────────────────

test.describe('M2 — 产品列表', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/admin/products')
    await page.waitForLoadState('networkidle')
  })

  test('管理员访问 /admin/products 展示产品列表', async ({ page }) => {
    await expect(page).toHaveURL(/\/admin\/products/)
    const list = page.locator('table, [data-testid="product-list"], [role="table"]').first()
    await expect(list).toBeVisible()
  })

  test('点击产品行跳转到详情页', async ({ page }) => {
    const firstRow = page.locator('table tbody tr, [data-testid="product-row"]').first()
    if (await firstRow.isVisible()) {
      await firstRow.click()
      await expect(page).toHaveURL(/\/admin\/products\/\d+/, { timeout: 10_000 })
    } else {
      test.skip()
    }
  })

})

// ── 套件 2：新建产品（admin）─────────────────────────────────────────────────

test.describe('M2 — 新建产品（admin）', () => {

  test('填写产品名后提交 — 创建成功跳转详情页', async ({ page }) => {
    await page.goto('/admin/products/new')
    await page.waitForLoadState('domcontentloaded')

    // placeholder="产品正式名称"，无 name/id 属性
    const nameInput = page.locator('input[placeholder="产品正式名称"]').first()
    await nameInput.fill(`E2E产品_${Date.now()}`)
    await page.locator('button[type="submit"]').click()

    await expect(page).toHaveURL(/\/admin\/products\/\d+/, { timeout: 15_000 })
  })

  test('不填产品名直接提交 — 表单报错', async ({ page }) => {
    await page.goto('/admin/products/new')
    await page.waitForLoadState('domcontentloaded')

    await page.locator('button[type="submit"]').click()
    await expect(page).toHaveURL(/\/admin\/products\/new/)
  })

})

// ── 套件 2b：新建产品（operator 无权限）──────────────────────────────────────

test.describe('M2 — 新建产品（operator 权限）', () => {

  test.use({ storageState: OPERATOR_STATE })

  test('运营无法访问 /admin/products/new', async ({ page }) => {
    await page.goto('/admin/products/new')
    const url = page.url()
    const blocked = !url.includes('/admin')
    const bodyText = await page.evaluate(() => document.body?.textContent ?? '')
    const hasForbidden = bodyText.includes('Forbidden') || bodyText.includes('权限') || bodyText.includes('403')
    expect(blocked || hasForbidden).toBeTruthy()
  })

})

// ── 套件 3：产品详情 — 编辑基础信息 ───────────────────────────────────────────

test.describe('M2 — 产品详情 · 编辑', () => {

  let productId: string

  test.beforeEach(async ({ page }) => {
    const res = await page.request.post('/api/products', {
      data: { name: `E2E编辑产品_${Date.now()}` },
    })
    expect(res.status()).toBe(201)
    const body = await res.json()
    productId = body.data?.id ?? body.id
    expect(productId).toBeTruthy()
  })

  test('「编辑」按钮可打开弹窗并保存', async ({ page }) => {
    await page.goto(`/admin/products/${productId}`)
    await page.waitForLoadState('networkidle')

    const editBtn = page.getByRole('button', { name: '编辑' }).first()
    await expect(editBtn).toBeVisible()
    await editBtn.click()

    // 编辑弹窗：自定义 fixed div（非 role="dialog"），标题"编辑产品信息"
    await expect(page.getByText('编辑产品信息')).toBeVisible({ timeout: 5_000 })
    const dialogDiv = page.locator('.fixed.inset-0').filter({ hasText: '编辑产品信息' })

    // 产品名输入框：无 name/id/placeholder，是 pre-filled 的第一个 input
    const nameInput = dialogDiv.locator('input').first()
    const newName = `E2E编辑后_${Date.now()}`
    await nameInput.clear()
    await nameInput.fill(newName)

    await dialogDiv.getByRole('button', { name: '保存' }).click()

    // 弹窗关闭
    await expect(page.getByText('编辑产品信息')).not.toBeVisible({ timeout: 10_000 })
    // 页面显示新名字
    await expect(page.getByText(newName).first()).toBeVisible({ timeout: 10_000 })
  })

})

// ── 套件 4：产品详情 — 卖点上传 ───────────────────────────────────────────────

test.describe('M2 — 产品详情 · 卖点', () => {

  let productId: string

  test.beforeEach(async ({ page }) => {
    const res = await page.request.post('/api/products', {
      data: { name: `E2E卖点测试_${Date.now()}` },
    })
    expect(res.status()).toBe(201)
    const body = await res.json()
    productId = body.data?.id ?? body.id
  })

  test('产品详情页展示三个卖点区块', async ({ page }) => {
    await page.goto(`/admin/products/${productId}`)
    await page.waitForLoadState('networkidle')

    // 产品详情页固定展示的三个 section 标题
    await expect(page.getByText('机制卖点').first()).toBeVisible()
    await expect(page.getByText('爆款文案').first()).toBeVisible()
    await expect(page.getByText('对标文案库').first()).toBeVisible()
  })

  test('上传 .md 卖点文档 — 解析成功并提示', async ({ page }) => {
    await page.goto(`/admin/products/${productId}`)
    await page.waitForLoadState('networkidle')

    const mdFile = createSellingPointsMd()
    const fileInput = page.locator('input[type="file"]').first()
    await fileInput.setInputFiles(mdFile)

    // toast: "卖点文档已更新"
    await expect(page.getByText('卖点文档已更新')).toBeVisible({ timeout: 15_000 })

    fs.unlinkSync(mdFile)
  })

  test('上传非法格式（.txt）— 显示错误提示', async ({ page }) => {
    await page.goto(`/admin/products/${productId}`)
    await page.waitForLoadState('networkidle')

    const txtFile = createTxtFile()
    const fileInput = page.locator('input[type="file"]').first()
    await fileInput.setInputFiles(txtFile)

    // toast: "仅支持 .md / .docx 格式"
    await expect(page.getByText('仅支持 .md / .docx 格式')).toBeVisible({ timeout: 10_000 })

    fs.unlinkSync(txtFile)
  })

})

// ── 套件 5：删除产品 ──────────────────────────────────────────────────────────

test.describe('M2 — 删除产品', () => {

  let productId: string

  test.beforeEach(async ({ page }) => {
    const res = await page.request.post('/api/products', {
      data: { name: `E2E删除产品_${Date.now()}` },
    })
    expect(res.status()).toBe(201)
    const body = await res.json()
    productId = body.data?.id ?? body.id
  })

  test('点击「删除」确认后跳转到产品列表', async ({ page }) => {
    await page.goto(`/admin/products/${productId}`)
    await page.waitForLoadState('networkidle')

    const deleteBtn = page.getByRole('button', { name: '删除' }).first()
    await expect(deleteBtn).toBeVisible()
    await deleteBtn.click()

    // 确认弹窗：自定义 fixed div，确认按钮文字"确认删除"
    const confirmBtn = page.getByRole('button', { name: '确认删除' })
    await expect(confirmBtn).toBeVisible({ timeout: 3_000 })
    await confirmBtn.click()

    await expect(page).toHaveURL(/\/admin\/products$/, { timeout: 10_000 })
  })

})

// ── 套件 6：运营端权限验证 ─────────────────────────────────────────────────────

test.describe('M2 — 运营端产品只读', () => {

  test.use({ storageState: OPERATOR_STATE })

  test('运营调用 PATCH /api/products/[id] — 返回 403', async ({ page }) => {
    const res = await page.request.patch('/api/products/1', {
      data: { name: 'hacked' },
    })
    expect(res.status()).toBe(403)
  })

})
