import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, err, requireAuth, requireAdmin } from '@/lib/api-helpers'

type Params = { params: { id: string } }

// GET /api/kols/[id]/profile — 获取当前档案（isCurrent=true）
export async function GET(_req: NextRequest, { params }: Params) {
  const { res } = await requireAuth()
  if (res) return res

  const kolId = BigInt(params.id)
  const kol = await prisma.kol.findUnique({ where: { id: kolId } })
  if (!kol) return err('红人不存在', 404)

  const profile = await prisma.kolProfile.findFirst({
    where: { kolId, isCurrent: true },
    select: {
      id: true,
      kolId: true,
      soulMd: true,
      contentPlanMd: true,
      version: true,
      isCurrent: true,
      sourceFileUrl: true,
      createdAt: true,
    },
  })

  if (!profile) return err('暂无档案', 404)

  return ok({
    ...profile,
    id: profile.id.toString(),
    kolId: profile.kolId.toString(),
  })
}

// POST /api/kols/[id]/profile — 新建档案版本
export async function POST(req: NextRequest, { params }: Params) {
  const { session, res } = await requireAdmin()
  if (res) return res

  const kolId = BigInt(params.id)
  const kol = await prisma.kol.findUnique({ where: { id: kolId } })
  if (!kol) return err('红人不存在', 404)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return err('Invalid JSON', 400)
  }

  const { soulMd, contentPlanMd, sourceFileUrl } = body as Record<string, unknown>

  const latest = await prisma.kolProfile.findFirst({
    where: { kolId },
    orderBy: { version: 'desc' },
    select: { version: true },
  })
  const nextVersion = (latest?.version ?? 0) + 1

  const profile = await prisma.$transaction(async (tx) => {
    await tx.kolProfile.updateMany({
      where: { kolId, isCurrent: true },
      data: { isCurrent: false },
    })

    return tx.kolProfile.create({
      data: {
        kolId,
        soulMd: soulMd as string | undefined,
        contentPlanMd: contentPlanMd as string | undefined,
        sourceFileUrl: sourceFileUrl as string | undefined,
        version: nextVersion,
        isCurrent: true,
        createdById: BigInt(session!.user.id),
      },
      select: {
        id: true,
        kolId: true,
        soulMd: true,
        contentPlanMd: true,
        version: true,
        isCurrent: true,
        sourceFileUrl: true,
        createdAt: true,
      },
    })
  })

  return ok(
    {
      ...profile,
      id: profile.id.toString(),
      kolId: profile.kolId.toString(),
    },
    201,
  )
}
