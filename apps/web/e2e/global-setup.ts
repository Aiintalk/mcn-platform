/**
 * global-setup.ts
 * 在所有测试前运行一次：
 *  1. 以 admin / operator 登录（处理首次改密）
 *  2. 将 Cookie/localStorage 保存到 e2e/.auth/，供各测试文件复用
 *
 * 好处：整个 suite 只触发 2 次登录，不触发限流（H-01: 60s/10次）
 */

import { chromium, type FullConfig } from '@playwright/test'
import * as fs from 'fs'
import * as path from 'path'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const AUTH_DIR = path.join(__dirname, '.auth')

export const ADMIN_STATE    = path.join(AUTH_DIR, 'admin.json')
export const OPERATOR_STATE = path.join(AUTH_DIR, 'operator.json')

// 确保目录存在
fs.mkdirSync(AUTH_DIR, { recursive: true })

// ── 工具 ──────────────────────────────────────────────────────────────────────

async function submitLogin(page: import('@playwright/test').Page, username: string, password: string) {
  await page.goto(`${BASE_URL}/login`)
  await page.locator('input[autocomplete="username"]').waitFor({ state: 'visible', timeout: 15_000 })
  await page.locator('input[autocomplete="username"]').fill(username)
  await page.locator('input[autocomplete="current-password"]').fill(password)
  await page.locator('button[type="submit"]').click()
}

async function waitForRedirect(page: import('@playwright/test').Page, ms = 8_000): Promise<boolean> {
  try {
    await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: ms })
    return true
  } catch {
    return false
  }
}

async function handleChangePassword(
  page: import('@playwright/test').Page,
  currentPwd: string,
  newPwd: string,
  reloginUser: string,
) {
  if (!page.url().includes('/change-password')) return

  const inputs = page.locator('input[type="password"]')
  await inputs.nth(0).fill(currentPwd)
  await inputs.nth(1).fill(newPwd)
  await inputs.nth(2).fill(newPwd)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL(/\/login/, { timeout: 15_000 })

  // 改密后用新密码重新登录
  await page.locator('input[autocomplete="username"]').fill(reloginUser)
  await page.locator('input[autocomplete="current-password"]').fill(newPwd)
  await page.locator('button[type="submit"]').click()
  await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 20_000 })
}

// ── 主函数 ────────────────────────────────────────────────────────────────────

export default async function globalSetup(_config: FullConfig) {
  const browser = await chromium.launch()

  // ── 1. Admin 登录 ─────────────────────────────────────────────────────────
  {
    const context = await browser.newContext()
    const page = await context.newPage()

    // 先试新密码
    await submitLogin(page, 'admin', 'Admin@2026')
    let ok = await waitForRedirect(page, 6_000)

    if (!ok) {
      // 新密码失败，试初始密码
      await submitLogin(page, 'admin', 'admin123')
      ok = await waitForRedirect(page, 8_000)
      if (!ok) throw new Error('[global-setup] admin 登录失败（admin123 和 Admin@2026 均无效）')
      await handleChangePassword(page, 'admin123', 'Admin@2026', 'admin')
    } else if (page.url().includes('/change-password')) {
      await handleChangePassword(page, 'Admin@2026', 'Admin@2026', 'admin')
    }

    await context.storageState({ path: ADMIN_STATE })
    await context.close()
    console.log('[global-setup] ✅ admin 认证状态已保存')
  }

  // ── 2. Operator 登录 ──────────────────────────────────────────────────────
  {
    const context = await browser.newContext()
    const page = await context.newPage()

    await submitLogin(page, 'operator01', 'Operator@123')
    const ok = await waitForRedirect(page, 8_000)
    if (!ok) throw new Error('[global-setup] operator01 登录失败（Operator@123 无效）')

    if (page.url().includes('/change-password')) {
      // 改密为同一密码（满足复杂度，设置 passwordChangedAt）
      await handleChangePassword(page, 'Operator@123', 'Operator@123', 'operator01')
    }

    await context.storageState({ path: OPERATOR_STATE })
    await context.close()
    console.log('[global-setup] ✅ operator01 认证状态已保存')
  }

  await browser.close()
}
