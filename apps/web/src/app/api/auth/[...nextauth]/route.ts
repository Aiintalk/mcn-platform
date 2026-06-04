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
  if (!checkRateLimit(`auth:${ip}`)) {
    return NextResponse.json({ error: '请求过于频繁，请稍后再试' }, { status: 429 })
  }
  return nextAuthHandler(req, ctx)
}
