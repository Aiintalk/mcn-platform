#!/usr/bin/env node
/**
 * generate-test-report.mjs
 *
 * 读取 Playwright JSON 结果，生成 Markdown 摘要，
 * 按里程碑写入对应的 docs/M1/ 或 docs/M2/ 目录。
 *
 * 用法：
 *   node scripts/generate-test-report.mjs [milestone]
 *   node scripts/generate-test-report.mjs m1   → docs/M1/M1-测试报告.md
 *   node scripts/generate-test-report.mjs m2   → docs/M2/M2-测试报告.md
 *   node scripts/generate-test-report.mjs      → docs/测试/测试报告.md（默认）
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')

// ── 路径配置 ──────────────────────────────────────────────────────────────────

const JSON_RESULT = path.join(ROOT, 'docs/测试/playwright-results.json')
const HTML_REPORT_DIR = 'docs/测试/playwright-report'

const MILESTONE_MAP = {
  m1: { label: 'M1', outDir: path.join(ROOT, 'docs/M1'), filename: 'M1-测试报告.md' },
  m2: { label: 'M2', outDir: path.join(ROOT, 'docs/M2'), filename: 'M2-测试报告.md' },
}

// ── 主逻辑 ─────────────────────────────────────────────────────────────────────

const milestoneArg = (process.argv[2] || '').toLowerCase()
const milestone = MILESTONE_MAP[milestoneArg]
const outDir = milestone?.outDir ?? path.join(ROOT, 'docs/测试')
const outFile = milestone?.filename ?? '测试报告.md'
const outPath = path.join(outDir, outFile)
const label = milestone?.label ?? '全量'

// 读取 JSON 结果
if (!fs.existsSync(JSON_RESULT)) {
  console.error(`❌ 找不到测试结果文件：${JSON_RESULT}`)
  console.error('   请先运行 pnpm e2e 生成测试结果。')
  process.exit(1)
}

const raw = JSON.parse(fs.readFileSync(JSON_RESULT, 'utf-8'))

// ── 统计 ───────────────────────────────────────────────────────────────────────

const stats = { total: 0, passed: 0, failed: 0, skipped: 0, flaky: 0 }
const failedCases = []
const passedCases = []

for (const suite of raw.suites ?? []) {
  collectResults(suite, '')
}

function collectResults(suite, parentTitle) {
  const title = parentTitle ? `${parentTitle} › ${suite.title}` : suite.title

  for (const spec of suite.specs ?? []) {
    for (const test of spec.tests ?? []) {
      stats.total++
      const status = test.status // expected | unexpected | flaky | skipped
      const outcome = test.results?.[0]?.status // passed | failed | timedOut | skipped

      if (status === 'skipped' || outcome === 'skipped') {
        stats.skipped++
      } else if (status === 'flaky') {
        stats.flaky++
        stats.passed++
      } else if (status === 'expected' && outcome === 'passed') {
        stats.passed++
        passedCases.push({ title: spec.title, suite: title })
      } else {
        stats.failed++
        const error = test.results?.[0]?.error?.message ?? ''
        failedCases.push({
          title: spec.title,
          suite: title,
          file: spec.file ?? '',
          line: spec.line ?? 0,
          error: error.slice(0, 300),
        })
      }
    }
  }

  for (const child of suite.suites ?? []) {
    collectResults(child, title)
  }
}

// ── 生成 Markdown ───────────────────────────────────────────────────────────────

const now = new Date()
const dateStr = now.toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
const passRate = stats.total > 0 ? ((stats.passed / stats.total) * 100).toFixed(1) : '0.0'
const overallStatus = stats.failed === 0 ? '✅ PASSING' : '❌ FAILING'

const failedRows = failedCases.map(c =>
  `| ${c.suite} | ${c.title} | \`${c.file}:${c.line}\` | ${c.error.replace(/\n/g, ' ').replace(/\|/g, '\\|')} |`
).join('\n') || '（无）'

const passedRows = passedCases.slice(0, 50).map(c =>
  `| ${c.suite} | ${c.title} |`
).join('\n') || '（无通过用例）'

const skippedNote = stats.skipped > 0
  ? `\n> **跳过说明：** ${stats.skipped} 条用例因测试数据不足或环境条件不满足被跳过，不计入失败。`
  : ''

const md = `# ${label} 自动化测试报告

> **执行时间：** ${dateStr}
> **状态：** ${overallStatus}
> **HTML 报告：** \`${HTML_REPORT_DIR}/index.html\`（运行 \`pnpm e2e:report\` 打开）
${skippedNote}

---

## 汇总

| 指标 | 数值 |
|---|---|
| 总用例数 | ${stats.total} |
| 通过 | ${stats.passed}（${passRate}%） |
| 失败 | ${stats.failed} |
| 跳过 | ${stats.skipped} |
| 不稳定（Flaky） | ${stats.flaky} |

---
${stats.failed > 0 ? `
## 失败用例

| 套件 | 用例 | 位置 | 错误信息 |
|---|---|---|---|
${failedRows}

---
` : ''}
## 通过用例（前 50 条）

| 套件 | 用例 |
|---|---|
${passedRows}

---

## 缺陷报告模板

> 针对以下失败用例，请按格式填写后反馈给 PM：

\`\`\`
【缺陷报告】
- 严重程度：CRITICAL / HIGH / MEDIUM / LOW
- 环境：测试服务器 / 本地
- 账号角色：admin / operator
- 复现步骤：
  1. ...
  2. ...
- 预期结果：...
- 实际结果：...
- 截图/日志：（见 playwright-report/index.html）
\`\`\`
`

// ── 写入文件 ───────────────────────────────────────────────────────────────────

fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(outPath, md, 'utf-8')

console.log(`✅ 测试报告已生成：${outPath}`)
console.log(`   通过 ${stats.passed}/${stats.total}（${passRate}%）  失败 ${stats.failed}  跳过 ${stats.skipped}`)
