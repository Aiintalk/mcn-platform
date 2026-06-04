import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, err, requireAuth, requireAdmin, parseBigIntId, isValidHttpUrl } from '@/lib/api-helpers'
import { KolStatus } from '@prisma/client'

const VALID_KOL_STATUSES = Object.values(KolStatus)

// GET /api/kols — 红人列表
export async function GET(req: NextRequest) {
  const { res } = await requireAuth()
  if (res) return res

  const { searchParams } = req.nextUrl
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? '20')))
  const statusRaw = searchParams.get('status')
  // 枚举白名单：值无效时静默忽略（默认 active）
  const status = statusRaw && VALID_KOL_STATUSES.includes(statusRaw as KolStatus) ? (statusRaw as KolStatus) : null
  const ownerIdRaw = searchParams.get('ownerId')
  const tag = searchParams.get('tag')

  const ownerBigInt = ownerIdRaw ? parseBigIntId(ownerIdRaw) : null
  if (ownerIdRaw && ownerBigInt === null) return err('ownerId 无效', 400)

  const where = {
    ...(status ? { status } : { status: KolStatus.active }),
    ...(ownerBigInt ? { ownerId: ownerBigInt } : {}),
    ...(tag ? { tags: { has: tag } } : {}),
  }

  const [total, kols] = await Promise.all([
    prisma.kol.count({ where }),
    prisma.kol.findMany({
      where,
      select: {
        id: true,
        name: true,
        douyinId: true,
        douyinUrl: true,
        avatarUrl: true,
        tags: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        owner: { select: { id: true, displayName: true } },
        profiles: {
          where: { isCurrent: true },
          select: { id: true, version: true, createdAt: true },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])

  return ok({
    items: kols.map((k) => ({
      ...k,
      id: k.id.toString(),
      owner: k.owner ? { ...k.owner, id: k.owner.id.toString() } : null,
      profiles: k.profiles.map((p) => ({ ...p, id: p.id.toString() })),
    })),
    total,
    page,
    pageSize,
  })
}

// POST /api/kols — 创建红人
export async function POST(req: NextRequest) {
  const { session, res } = await requireAdmin()
  if (res) return res

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return err('Invalid JSON', 400)
  }

  const { name, douyinId, douyinUrl, secUserId, avatarUrl, tags, ownerId } = body as Record<string, unknown>

  if (!name || typeof name !== 'string' || !name.trim()) {
    return err('name 为必填', 400)
  }
  if (douyinId !== undefined && douyinId !== null && typeof douyinId !== 'string') {
    return err('douyinId 必须为字符串', 400)
  }
  if (secUserId !== undefined && secUserId !== null && typeof secUserId !== 'string') {
    return err('secUserId 必须为字符串', 400)
  }
  if (douyinUrl != null && !isValidHttpUrl(douyinUrl)) {
    return err('douyinUrl 必须为 http/https URL', 400)
  }
  if (avatarUrl != null && !isValidHttpUrl(avatarUrl)) {
    return err('avatarUrl 必须为 http/https URL', 400)
  }
  if (tags !== undefined) {
    if (!Array.isArray(tags)) return err('tags 必须为数组', 400)
    if (tags.length > 20) return err('tags 最多 20 个', 400)
    for (const t of tags) {
      if (typeof t !== 'string') return err('tags 每项必须为字符串', 400)
      if (t.length > 50) return err('tags 每项长度不超过 50 个字符', 400)
    }
  }

  if (douyinId) {
    const existing = await prisma.kol.findUnique({ where: { douyinId: douyinId as string } })
    if (existing) return err('抖音号已存在', 409)
  }

  const resolvedOwnerId = ownerId
    ? (() => {
        const parsed = parseBigIntId(String(ownerId))
        if (parsed === null) throw new Error('ownerId 无效')
        return parsed
      })()
    : BigInt(session!.user.id)

  let kol
  try {
    kol = await prisma.kol.create({
      data: {
        name: (name as string).trim(),
        douyinId: douyinId as string | undefined,
        douyinUrl: douyinUrl as string | undefined,
        secUserId: secUserId as string | undefined,
        avatarUrl: avatarUrl as string | undefined,
        tags: (tags as string[] | undefined) ?? [],
        ownerId: resolvedOwnerId,
        status: KolStatus.active,
      },
      select: {
        id: true,
        name: true,
        douyinId: true,
        douyinUrl: true,
        avatarUrl: true,
        tags: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        owner: { select: { id: true, displayName: true } },
      },
    })
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'ownerId 无效') return err('ownerId 无效', 400)
    throw e
  }

  return ok(
    {
      ...kol,
      id: kol.id.toString(),
      owner: kol.owner ? { ...kol.owner, id: kol.owner.id.toString() } : null,
    },
    201,
  )
}
