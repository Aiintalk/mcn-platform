import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export function ok(data: unknown, status = 200) {
  return NextResponse.json({ data }, { status })
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
