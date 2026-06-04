/**
 * e2e/helpers.ts — 共用登录工具
 *
 * 登录页 DOM 结构（无 name/id，靠 autocomplete 定位）：
 *   input[autocomplete="username"]          → 账号
 *   input[autocomplete="current-password"]  → 密码
 *   button[type="submit"]                   → 登录
 *   p.text-red-500                          → 错误提示
 *
 * 改密页三个 input[type="password"] 顺序：当前密码 / 新密码 / 确认
 */

import { type Page } from '@playwright/test'

// ── 账号常量 ──────────────────────────────────────────────────────────────────

export const ADMIN_USERNAME = 'admin'
export const ADMIN_INIT_PWD = 'admin123'     // 数据库初始密码
export const ADMIN_NEW_PWD  = 'Admin@2026'   // 改密后沿用的密码

export const OPERATOR = { username: 'operator01', password: 'Operator@123' }

// ── 低级工具：单次登录尝试 ─────────────────────────────────────────────────────

/**
 * 填写表单并点提交。
 * 不等待结果，由调用方决定后续行为。
 */
async function submitLogin(page: Page, username: string, password: string) {
  await page.goto('/login')
  await page.locator('input[autocomplete="username"]').waitFor({ state: 'visible', timeout: 15_000 })
  await page.locator('input[autocomplete="username"]').fill(username)
  await page.locator('input[autocomplete="current-password"]').fill(password)
  await page.locator('button[type="submit"]').click()
}

/**
 * 等待页面离开 /login，返回是否成功（false = 超时/还在 /login）。
 */
async function waitForLoginRedirect(page: Page, ms = 5_000): Promise<boolean> {
  try {
    await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: ms })
    return true
  } catch {
    return false
  }
}

/**
 * 处理改密页：填写 current/new/confirm，提交后等待跳回 /login。
 */
async function handleChangePasswordPage(page: Page, currentPwd: string, newPwd: string) {
  const inputs = page.locator('input[type="password"]')
  await inputs.nth(0).fill(currentPwd)
  await inputs.nth(1).fill(newPwd)
  await inputs.nth(2).fill(newPwd)
  await page.locator('button[type="submit"]').click()
  // 改密成功 → signOut → /login
  await page.waitForURL(/\/login/, { timeout: 15_000 })
}

// ── 高级工具：loginAsAdmin ─────────────────────────────────────────────────────

/**
 * 以 admin 身份登录，自动处理两种密码状态：
 *   1. 已改密（Admin@2026）→ 直接登录
 *   2. 未改密（admin123）  → 处理改密后再登录
 */
export async function loginAsAdmin(page: Page) {
  // 先试新密码（本地已改过密的情况）
  await submitLogin(page, ADMIN_USERNAME, ADMIN_NEW_PWD)
  const redirected = await waitForLoginRedirect(page, 6_000)

  if (redirected && !page.url().includes('/change-password')) {
    return // 直接登录成功
  }

  if (redirected && page.url().includes('/change-password')) {
    // 用新密码登录但还是跳到改密页（不应发生，容错处理）
    await handleChangePasswordPage(page, ADMIN_NEW_PWD, ADMIN_NEW_PWD)
    await submitLogin(page, ADMIN_USERNAME, ADMIN_NEW_PWD)
    await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 20_000 })
    return
  }

  // 新密码失败 → 尝试初始密码（数据库刚重置的情况）
  await submitLogin(page, ADMIN_USERNAME, ADMIN_INIT_PWD)
  const redirected2 = await waitForLoginRedirect(page, 8_000)

  if (!redirected2) {
    throw new Error(`loginAsAdmin 失败：admin123 和 ${ADMIN_NEW_PWD} 均无法登录`)
  }

  if (page.url().includes('/change-password')) {
    // 首次登录，需要改密
    await handleChangePasswordPage(page, ADMIN_INIT_PWD, ADMIN_NEW_PWD)
    // 改密后用新密码重新登录
    await submitLogin(page, ADMIN_USERNAME, ADMIN_NEW_PWD)
    await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 20_000 })
  }
  // 否则直接进入（极端情况：初始密码可以直接登录，不触发改密）
}

// ── 高级工具：loginAs（用于 operator） ────────────────────────────────────────

/**
 * 以指定账号登录。
 * operator 账号首次登录也需要改密；改密后密码保持不变（复杂度满足要求）。
 */
export async function loginAs(
  page: Page,
  creds: { username: string; password: string },
) {
  await submitLogin(page, creds.username, creds.password)
  const redirected = await waitForLoginRedirect(page, 12_000)

  if (!redirected) {
    throw new Error(`loginAs 失败：账号 ${creds.username} 密码 ${creds.password} 无法登录`)
  }

  if (page.url().includes('/change-password')) {
    // 改密（改为同一密码，满足复杂度即可）
    await handleChangePasswordPage(page, creds.password, creds.password)
    // 改密后重新登录
    await submitLogin(page, creds.username, creds.password)
    await page.waitForURL(url => !url.pathname.includes('/login'), { timeout: 20_000 })
  }
}
