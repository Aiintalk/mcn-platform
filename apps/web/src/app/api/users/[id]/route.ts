import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { ok, err, requireAdmin } from '@/lib/api-helpers'
import { Role, UserStatus } from '@prisma/client'

type Params = { params: { id: string } }

// GET /api/users/[id]
export async function GET(_req: NextRequest, { params }: Params) {
  const { res } = await requireAdmin()
  if (res) return res

  const id = BigInt(params.id)
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      username: true,
      displayName: true,
      role: true,
      status: true,
      passwordChangedAt: true,
      lastLoginAt: true,
      createdAt: true,
      createdBy: { select: { id: true, displayName: true } },
    },
  })

  if (!user) return err('用户不存在', 404)
  return ok({ ...user, id: user.id.toString() })
}

// PATCH /api/users/[id]
// 支持字段：displayName, role, status, password（重置密码）
export async function PATCH(req: NextRequest, { params }: Params) {
  const { res } = await requireAdmin()
  if (res) return res

  const id = BigInt(params.id)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return err('Invalid JSON', 400)
  }

  const { displayName, role, status, password } = body as Record<string, string>

  const updateData: Record<string, unknown> = {}

  if (displayName !== undefined) {
    if (!displayName.trim()) return err('displayName 不能为空', 400)
    updateData.displayName = displayName.trim()
  }

  if (role !== undefined) {
    if (!['admin', 'operator'].includes(role)) return err('role 无效', 400)
    updateData.role = role as Role
  }

  if (status !== undefined) {
    if (!['active', 'disabled'].includes(status)) return err('status 无效', 400)
    updateData.status = status as UserStatus
  }

  if (password !== undefined) {
    if (password.length < 8) return err('密码至少 8 位', 400)
    updateData.passwordHash = await bcrypt.hash(password, 12)
    // 重置密码后清空 passwordChangedAt，下次登录强制改密
    updateData.passwordChangedAt = null
  }

  if (Object.keys(updateData).length === 0) {
    return err('没有可更新的字段', 400)
  }

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) return err('用户不存在', 404)

  const updated = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      username: true,
      displayName: true,
      role: true,
      status: true,
      passwordChangedAt: true,
      lastLoginAt: true,
      createdAt: true,
    },
  })

  return ok({ ...updated, id: updated.id.toString() })
}

// DELETE /api/users/[id] — 软删（status → disabled）
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { res } = await requireAdmin()
  if (res) return res

  const id = BigInt(params.id)
  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) return err('用户不存在', 404)

  await prisma.user.update({
    where: { id },
    data: { status: UserStatus.disabled },
  })

  return ok({ message: '已禁用' })
}
