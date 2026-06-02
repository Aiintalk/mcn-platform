import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, err, requireAuth } from '@/lib/api-helpers'
import { KolStatus } from '@prisma/client'

// GET /api/kols — 红人列表
export async function GET(req: NextRequest) {
  const { res } = await requireAuth()
  if (res) return res

  const { searchParams } = req.nextUrl
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? '20')))
  const status = searchParams.get('status') as KolStatus | null
  const ownerId = searchParams.get('ownerId')
  const tag = searchParams.get('tag')

  const where = {
    ...(status ? { status } : { status: KolStatus.active }),
    ...(ownerId ? { ownerId: BigInt(ownerId) } : {}),
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
  const { session, res } = await requireAuth()
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
  if (tags !== undefined && !Array.isArray(tags)) {
    return err('tags 必须为数组', 400)
  }

  if (douyinId) {
    const existing = await prisma.kol.findUnique({ where: { douyinId: douyinId as string } })
    if (existing) return err('抖音号已存在', 409)
  }

  const resolvedOwnerId = ownerId
    ? BigInt(ownerId as string)
    : BigInt(session!.user.id)

  const kol = await prisma.kol.create({
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

  return ok(
    {
      ...kol,
      id: kol.id.toString(),
      owner: kol.owner ? { ...kol.owner, id: kol.owner.id.toString() } : null,
    },
    201,
  )
}
