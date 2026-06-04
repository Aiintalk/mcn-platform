import { defineConfig, devices } from '@playwright/test'
import path from 'path'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

const AUTH_DIR      = path.join(__dirname, 'e2e/.auth')
const ADMIN_STATE   = path.join(AUTH_DIR, 'admin.json')
const OPERATOR_STATE = path.join(AUTH_DIR, 'operator.json')

// 报告输出到 docs/测试/
const REPORT_DIR = '../../docs/测试/playwright-report'
const JSON_REPORT = '../../docs/测试/playwright-results.json'

export default defineConfig({
  globalSetup: './e2e/global-setup.ts',

  testDir: './e2e',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: 1,

  reporter: [
    ['html', { outputFolder: REPORT_DIR, open: 'never' }],
    ['json', { outputFile: JSON_REPORT }],
    ['list'],
  ],

  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    actionTimeout: 10_000,
    navigationTimeout: 30_000,
  },

  projects: [
    // auth.spec.ts — 专门测试登录流程本身，不预加载 session
    {
      name: 'auth',
      testMatch: '**/auth.spec.ts',
      retries: 2,
      use: { ...devices['Desktop Chrome'] },
    },

    // 管理员视角测试（kols / products / viral-scripts / security 中的 admin 套件）
    {
      name: 'admin',
      testMatch: ['**/kols.spec.ts', '**/products.spec.ts', '**/viral-scripts.spec.ts'],
      use: {
        ...devices['Desktop Chrome'],
        storageState: ADMIN_STATE,
      },
    },

    // 安全校验（混合使用 admin + operator session，通过 page.request 手动携带）
    {
      name: 'security',
      testMatch: '**/security.spec.ts',
      use: {
        ...devices['Desktop Chrome'],
        storageState: ADMIN_STATE, // 默认 admin；operator 套件在 beforeEach 自行切换
      },
    },
  ],
})
