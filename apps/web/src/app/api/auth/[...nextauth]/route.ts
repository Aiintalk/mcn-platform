import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

const nextAuthHandler = NextAuth(authOptions)

export async function GET(req: NextRequest, ctx: { params: { nextauth: string[] } }) {
  return nextAuthHandler(req, ctx)
}

export async function POST(req: NextRequest, ctx: { params: { nextauth: string[] } }) {
  const ip = getClientIp(req)
  // 登录端点：每 IP 每分钟最多 10 次（E2E 测试环境通过 E2E_RATE_LIMIT_MAX 放开）
  if (!checkRateLimit(`auth:${ip}`)) {
    return NextResponse.json({ error: '请求过于频繁，请稍后再试' }, { status: 429 })
  }
  return nextAuthHandler(req, ctx)
}
