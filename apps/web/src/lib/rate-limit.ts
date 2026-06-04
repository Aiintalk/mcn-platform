type Entry = { count: number; resetAt: number }

const store = new Map<string, Entry>()
const WINDOW_MS = 60_000 // 1 分钟
const MAX_REQUESTS = 10   // 同一 bucket 每分钟最多 10 次

/**
 * 返回 true 表示放行，false 表示触发限流。
 * key 建议带接口前缀（如 `auth:1.2.3.4`），避免不同接口共用计数。
 */
export function checkRateLimit(key: string): boolean {
  const now = Date.now()
  const entry = store.get(key)

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + WINDOW_MS })
    return true
  }

  if (entry.count >= MAX_REQUESTS) return false

  entry.count++
  return true
}

/** 从请求头提取客户端真实 IP。
 *  优先 x-real-ip（由 Nginx proxy_set_header X-Real-IP $remote_addr 写入，不可伪造），
 *  回退 x-forwarded-for 首段（仅在无 Nginx 直连场景使用）。
 */
export function getClientIp(req: { headers: { get(key: string): string | null } }): string {
  return (
    req.headers.get('x-real-ip') ??
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
    '127.0.0.1'
  )
}

// 每 5 分钟清理已过期的窗口条目，防止 Map 无限增长
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) store.delete(key)
  }
}, 5 * 60_000).unref()
