import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, err, requireAuth } from '@/lib/api-helpers'

type Params = { params: { id: string } }

// POST /api/kols/[id]/upload-profile — 上传覆盖人格档案（带版本管理）
export async function POST(req: NextRequest, { params }: Params) {
  const { session, res } = await requireAuth()
  if (res) return res

  const kolId = BigInt(params.id)
  const kol = await prisma.kol.findUnique({ where: { id: kolId } })
  if (!kol) return err('红人不存在', 404)

  const isAdmin = session!.user.role === 'admin'
  if (!isAdmin && kol.ownerId?.toString() !== session!.user.id) {
    return err('无权操作该红人', 403)
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return err('Invalid JSON', 400)
  }

  const { soulMd, contentPlanMd, sourceFileUrl } = body as Record<string, unknown>

  if (!soulMd && !contentPlanMd) {
    return err('soulMd 或 contentPlanMd 至少传一个', 400)
  }

  // 获取当前最新版本号
  const latestProfile = await prisma.kolProfile.findFirst({
    where: { kolId },
    orderBy: { version: 'desc' },
    select: { version: true },
  })
  const nextVersion = (latestProfile?.version ?? 0) + 1

  // 在事务中：将旧 current 标记为非当前，然后创建新版本
  const newProfile = await prisma.$transaction(async (tx) => {
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
        version: true,
        isCurrent: true,
        soulMd: true,
        contentPlanMd: true,
        sourceFileUrl: true,
        createdAt: true,
        createdBy: { select: { id: true, displayName: true } },
      },
    })
  })

  return ok(
    {
      ...newProfile,
      id: newProfile.id.toString(),
      kolId: newProfile.kolId.toString(),
      createdBy: newProfile.createdBy
        ? { ...newProfile.createdBy, id: newProfile.createdBy.id.toString() }
        : null,
    },
    201,
  )
}
