import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { ok, err, requireAuth } from '@/lib/api-helpers'

// POST /api/users/me/change-password
export async function POST(req: NextRequest) {
  const { session, res } = await requireAuth()
  if (res) return res

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return err('Invalid JSON', 400)
  }

  const { currentPassword, newPassword } = body as Record<string, string>

  if (!currentPassword || !newPassword) {
    return err('currentPassword 和 newPassword 均为必填', 400)
  }
  if (newPassword.length < 8) {
    return err('新密码至少 8 位', 400)
  }
  if (currentPassword === newPassword) {
    return err('新密码不能与当前密码相同', 400)
  }

  const user = await prisma.user.findUnique({
    where: { id: BigInt(session!.user.id) },
  })
  if (!user) return err('用户不存在', 404)

  const valid = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!valid) return err('当前密码错误', 400)

  const newHash = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash: newHash,
      passwordChangedAt: new Date(),
    },
  })

  return ok({ message: '密码修改成功' })
}
