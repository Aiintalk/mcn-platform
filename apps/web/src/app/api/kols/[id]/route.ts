import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, err, requireAuth, requireAdmin } from '@/lib/api-helpers'
import { KolStatus } from '@prisma/client'

type Params = { params: { id: string } }

// GET /api/kols/[id] — 红人详情
export async function GET(_req: NextRequest, { params }: Params) {
  const { res } = await requireAuth()
  if (res) return res

  const id = BigInt(params.id)
  const kol = await prisma.kol.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      douyinId: true,
      douyinUrl: true,
      secUserId: true,
      avatarUrl: true,
      tags: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      owner: { select: { id: true, displayName: true } },
      profiles: {
        select: { id: true, version: true, isCurrent: true, soulMd: true, contentPlanMd: true, sourceFileUrl: true, createdAt: true },
        orderBy: { version: 'desc' },
        take: 5,
      },
    },
  })

  if (!kol) return err('红人不存在', 404)

  return ok({
    ...kol,
    id: kol.id.toString(),
    owner: kol.owner ? { ...kol.owner, id: kol.owner.id.toString() } : null,
    profiles: kol.profiles.map((p) => ({ ...p, id: p.id.toString() })),
  })
}

// PATCH /api/kols/[id] — 编辑红人
export async function PATCH(req: NextRequest, { params }: Params) {
  const { session, res } = await requireAuth()
  if (res) return res

  const id = BigInt(params.id)
  const kol = await prisma.kol.findUnique({ where: { id } })
  if (!kol) return err('红人不存在', 404)

  // 运营只能编辑自己负责的红人；管理员不限制
  const isAdmin = session!.user.role === 'admin'
  if (!isAdmin && kol.ownerId?.toString() !== session!.user.id) {
    return err('无权编辑该红人', 403)
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return err('Invalid JSON', 400)
  }

  const { name, douyinId, douyinUrl, secUserId, avatarUrl, tags, ownerId, status } = body as Record<string, unknown>

  const updateData: Record<string, unknown> = {}

  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) return err('name 不能为空', 400)
    updateData.name = name.trim()
  }
  if (douyinId !== undefined) updateData.douyinId = douyinId
  if (douyinUrl !== undefined) updateData.douyinUrl = douyinUrl
  if (secUserId !== undefined) updateData.secUserId = secUserId
  if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl
  if (tags !== undefined) {
    if (!Array.isArray(tags)) return err('tags 必须为数组', 400)
    updateData.tags = tags
  }
  if (ownerId !== undefined) {
    if (!isAdmin) return err('只有管理员才能转移红人归属', 403)
    updateData.ownerId = BigInt(ownerId as string)
  }
  if (status !== undefined) {
    if (!Object.values(KolStatus).includes(status as KolStatus)) return err('status 无效', 400)
    updateData.status = status as KolStatus
  }

  if (Object.keys(updateData).length === 0) {
    return err('没有可更新的字段', 400)
  }

  const updated = await prisma.kol.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      name: true,
      douyinId: true,
      douyinUrl: true,
      secUserId: true,
      avatarUrl: true,
      tags: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      owner: { select: { id: true, displayName: true } },
    },
  })

  return ok({
    ...updated,
    id: updated.id.toString(),
    owner: updated.owner ? { ...updated.owner, id: updated.owner.id.toString() } : null,
  })
}

// DELETE /api/kols/[id] — 软删（status → archived）
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { res } = await requireAdmin()
  if (res) return res

  const id = BigInt(params.id)
  const kol = await prisma.kol.findUnique({ where: { id } })
  if (!kol) return err('红人不存在', 404)

  await prisma.kol.update({
    where: { id },
    data: { status: KolStatus.archived },
  })

  return ok({ message: '已归档' })
}
