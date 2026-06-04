import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, err, requireAuth, requireAdmin, parseBigIntId, isValidHttpUrl } from '@/lib/api-helpers'
import { KolStatus } from '@prisma/client'

type Params = { params: { id: string } }

// GET /api/kols/[id] — 红人详情
export async function GET(_req: NextRequest, { params }: Params) {
  const { res } = await requireAuth()
  if (res) return res

  const id = parseBigIntId(params.id)
  if (id === null) return err('无效 ID', 400)

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

// PATCH /api/kols/[id] — 编辑红人（仅管理员）
export async function PATCH(req: NextRequest, { params }: Params) {
  const { session, res } = await requireAdmin()
  if (res) return res

  const id = parseBigIntId(params.id)
  if (id === null) return err('无效 ID', 400)

  const kol = await prisma.kol.findUnique({ where: { id } })
  if (!kol) return err('红人不存在', 404)

  const isAdmin = session!.user.role === 'admin'

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
  if (douyinId !== undefined) {
    if (douyinId !== null && typeof douyinId !== 'string') return err('douyinId 必须为字符串', 400)
    updateData.douyinId = douyinId as string | null
  }
  if (douyinUrl !== undefined) {
    if (douyinUrl !== null && (typeof douyinUrl !== 'string' || !isValidHttpUrl(douyinUrl))) return err('douyinUrl 必须为 http/https URL', 400)
    updateData.douyinUrl = douyinUrl as string | null
  }
  if (secUserId !== undefined) {
    if (secUserId !== null && typeof secUserId !== 'string') return err('secUserId 必须为字符串', 400)
    updateData.secUserId = secUserId as string | null
  }
  if (avatarUrl !== undefined) {
    if (avatarUrl !== null && (typeof avatarUrl !== 'string' || !isValidHttpUrl(avatarUrl))) return err('avatarUrl 必须为 http/https URL', 400)
    updateData.avatarUrl = avatarUrl as string | null
  }
  if (tags !== undefined) {
    if (!Array.isArray(tags)) return err('tags 必须为数组', 400)
    if (tags.length > 20) return err('tags 最多 20 个', 400)
    for (const t of tags) {
      if (typeof t !== 'string') return err('tags 每项必须为字符串', 400)
      if (t.length > 50) return err('tags 每项长度不超过 50 个字符', 400)
    }
    updateData.tags = tags
  }
  if (ownerId !== undefined) {
    if (!isAdmin) return err('只有管理员才能转移红人归属', 403)
    const ownerBigInt = parseBigIntId(String(ownerId))
    if (ownerBigInt === null) return err('ownerId 无效', 400)
    updateData.ownerId = ownerBigInt
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

  const id = parseBigIntId(params.id)
  if (id === null) return err('无效 ID', 400)

  const kol = await prisma.kol.findUnique({ where: { id } })
  if (!kol) return err('红人不存在', 404)

  await prisma.kol.update({
    where: { id },
    data: { status: KolStatus.archived },
  })

  return ok({ message: '已归档' })
}
