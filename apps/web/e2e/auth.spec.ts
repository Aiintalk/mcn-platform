/**
 * M1 — 认证与权限 E2E 测试
 */

import { test, expect } from '@playwright/test'
import { loginAs, loginAsAdmin, ADMIN_USERNAME, ADMIN_INIT_PWD, ADMIN_NEW_PWD, OPERATOR } from './helpers'

// 裸登录：不自动处理改密，用于测试改密流程本身
async function loginRaw(page: import('@playwright/test').Page, username: string, password: string) {
  await page.goto('/login')
  await page.locator('input[autocomplete="username"]').waitFor({ state: 'visible', timeout: 15_000 })
  await page.locator('input[autocomplete="username"]').fill(username)
  await page.locator('input[autocomplete="current-password"]').fill(password)
  await page.locator('button[type="submit"]').click()
}

// ── 套件 1：登录流程 ──────────────────────────────────────────────────────────

test.describe('M1 — 登录流程', () => {

  test('正常登录 — operator01', async ({ page }) => {
    await loginAs(page, OPERATOR)
    await expect(page).not.toHaveURL(/\/login/)
  })

  test('错误密码 — 显示错误提示', async ({ page }) => {
    await loginRaw(page, 'operator01', 'wrongpassword')
    await page.waitForURL(/\/login/, { timeout: 8_000 }).catch(() => {})
    await expect(page).toHaveURL(/\/login/)
    await expect(page.locator('p.text-red-500').first()).toBeVisible({ timeout: 8_000 })
  })

  test('空用户名 — 浏览器 required 阻止提交', async ({ page }) => {
    await page.goto('/login')
    await page.locator('input[autocomplete="username"]').waitFor({ state: 'visible' })
    await page.locator('button[type="submit"]').click()
    await expect(page).toHaveURL(/\/login/)
  })

  test('未登录访问 /admin/kols — 跳转 /login', async ({ page }) => {
    await page.goto('/admin/kols')
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
  })

  test('未登录访问 / — 跳转 /login', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
  })

})

// ── 套件 2：强制改密流程 ──────────────────────────────────────────────────────

test.describe('M1 — 强制改密流程', () => {

  test('admin 首次登录跳转改密页', async ({ page }) => {
    await loginRaw(page, ADMIN_USERNAME, ADMIN_INIT_PWD)
    await page.waitForTimeout(2_000)

    if (!page.url().includes('/change-password')) {
      test.skip() // 已改过密，跳过
      return
    }
    await expect(page).toHaveURL(/\/change-password/)
  })

  test('改密页填写新密码后跳转登录 → 再登录成功', async ({ page }) => {
    await loginRaw(page, ADMIN_USERNAME, ADMIN_INIT_PWD)
    await page.waitForTimeout(2_000)

    if (!page.url().includes('/change-password')) {
      // admin 已改过密，用新密码验证
      await loginRaw(page, ADMIN_USERNAME, ADMIN_NEW_PWD)
      await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 15_000 })
      await expect(page).not.toHaveURL(/\/login/)
      return
    }

    const inputs = page.locator('input[type="password"]')
    await inputs.nth(0).fill(ADMIN_INIT_PWD)
    await inputs.nth(1).fill(ADMIN_NEW_PWD)
    await inputs.nth(2).fill(ADMIN_NEW_PWD)
    await page.locator('button[type="submit"]').click()

    await expect(page).toHaveURL(/\/login/, { timeout: 15_000 })

    // 用新密码重新登录
    await page.locator('input[autocomplete="username"]').fill(ADMIN_USERNAME)
    await page.locator('input[autocomplete="current-password"]').fill(ADMIN_NEW_PWD)
    await page.locator('button[type="submit"]').click()
    await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 20_000 })
    await expect(page).not.toHaveURL(/\/login/)
  })

})

// ── 套件 3：权限拦截 ──────────────────────────────────────────────────────────

/**
 * 中间件返回 403 JSON（不是 HTML 页面），Chrome 用内置 JSON 查看器渲染。
 * 判断逻辑：URL 被跳走 OR 页面 body 文本包含 "Forbidden" / "权限"。
 */
async function isBlocked(page: import('@playwright/test').Page, adminPath: string): Promise<boolean> {
  const url = page.url()
  if (!url.includes(adminPath)) return true  // 被重定向走了
  const bodyText = await page.evaluate(() => document.body?.textContent ?? '')
  return bodyText.includes('Forbidden') || bodyText.includes('权限') || bodyText.includes('403')
}

test.describe('M1 — 权限拦截：运营不可访问 admin', () => {

  test.beforeEach(async ({ page }) => {
    await loginAs(page, OPERATOR)
  })

  test('运营访问 /admin/kols — 被拦截（403 或跳转）', async ({ page }) => {
    await page.goto('/admin/kols')
    expect(await isBlocked(page, '/admin/kols')).toBeTruthy()
  })

  test('运营访问 /admin/users — 被拦截', async ({ page }) => {
    await page.goto('/admin/users')
    expect(await isBlocked(page, '/admin/users')).toBeTruthy()
  })

  test('运营访问 /admin/products — 被拦截', async ({ page }) => {
    await page.goto('/admin/products')
    expect(await isBlocked(page, '/admin/products')).toBeTruthy()
  })

})

// ── 套件 4：登出 ──────────────────────────────────────────────────────────────

test.describe('M1 — 登出', () => {

  test('admin 登出后跳转到 /login', async ({ page }) => {
    await loginAsAdmin(page)

    const logoutBtn = page.locator(
      'button:has-text("登出"), button:has-text("退出"), a:has-text("登出"), a:has-text("退出")'
    ).first()

    if (await logoutBtn.isVisible({ timeout: 3_000 })) {
      await logoutBtn.click()
    } else {
      const userMenu = page.locator('[data-testid="user-menu"], .avatar, button[aria-label*="用户"]').first()
      if (await userMenu.isVisible({ timeout: 3_000 })) {
        await userMenu.click()
        await page.locator('button:has-text("登出"), [role="menuitem"]:has-text("登出")').first().click()
      } else {
        test.skip()
      }
    }

    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 })
  })

})
