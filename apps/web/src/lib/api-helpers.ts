import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// BigInt 不能直接 JSON.stringify，用 replacer 统一转 string
function bigintReplacer(_key: string, value: unknown) {
  return typeof value === 'bigint' ? value.toString() : value
}

export function ok(data: unknown, status = 200) {
  return new NextResponse(JSON.stringify({ data }, bigintReplacer), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export function err(message: string, status: number) {
  return NextResponse.json({ error: message }, { status })
}

/** URL 字段安全校验 — 用 new URL() 解析，只允许 http: 或 https: 协议 */
export function isValidHttpUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:'
  } catch {
    return false
  }
}

/** URL 路径参数安全解析 — 非纯数字、零值、超过 PG bigint 上界均返回 null */
const MAX_PG_BIGINT = BigInt('9223372036854775807')

export function parseBigIntId(raw: string): bigint | null {
  if (!/^\d+$/.test(raw)) return null
  const val = BigInt(raw)
  if (val === 0n || val > MAX_PG_BIGINT) return null
  return val
}

/** 日期字段安全解析 — 无效日期字符串返回 null */
export function parseSafeDate(value: unknown): Date | null {
  if (value == null) return null
  if (typeof value !== 'string') return null
  const d = new Date(value)
  return isNaN(d.getTime()) ? null : d
}

export async function requireAdmin() {
  const session = await getServerSession(authOptions)
  if (!session) return { session: null, res: err('Unauthorized', 401) }
  if (session.user.role !== 'admin') return { session: null, res: err('Forbidden', 403) }
  return { session, res: null }
}

export async function requireAuth() {
  const session = await getServerSession(authOptions)
  if (!session) return { session: null, res: err('Unauthorized', 401) }
  return { session, res: null }
}
