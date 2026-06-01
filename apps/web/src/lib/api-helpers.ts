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
