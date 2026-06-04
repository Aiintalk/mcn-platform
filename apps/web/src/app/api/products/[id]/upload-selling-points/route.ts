import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, err, requireAdmin, parseBigIntId, isValidHttpUrl } from '@/lib/api-helpers'

type Params = { params: { id: string } }

// POST /api/products/[id]/upload-selling-points — 新建卖点版本（带版本管理）
export async function POST(req: NextRequest, { params }: Params) {
  const { session, res } = await requireAdmin()
  if (res) return res

  const productId = parseBigIntId(params.id)
  if (productId === null) return err('无效 ID', 400)

  const product = await prisma.product.findUnique({ where: { id: productId } })
  if (!product) return err('产品不存在', 404)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return err('Invalid JSON', 400)
  }

  const { endorsement, mechanism, seeding, rawDocUrl } = body as Record<string, unknown>

  if (rawDocUrl != null && !isValidHttpUrl(rawDocUrl)) {
    return err('rawDocUrl 必须为 http/https URL', 400)
  }

  const sellingPoint = await prisma.$transaction(async (tx) => {
    const latest = await tx.productSellingPoint.findFirst({
      where: { productId },
      orderBy: { version: 'desc' },
      select: { version: true },
    })
    const nextVersion = (latest?.version ?? 0) + 1

    await tx.productSellingPoint.updateMany({
      where: { productId, isCurrent: true },
      data: { isCurrent: false },
    })

    return tx.productSellingPoint.create({
      data: {
        productId,
        endorsement: endorsement as string | undefined,
        mechanism: mechanism as string | undefined,
        seeding: seeding as string | undefined,
        rawDocUrl: rawDocUrl as string | undefined,
        version: nextVersion,
        isCurrent: true,
        createdById: BigInt(session!.user.id),
      },
      select: {
        id: true,
        productId: true,
        endorsement: true,
        mechanism: true,
        seeding: true,
        rawDocUrl: true,
        version: true,
        isCurrent: true,
        createdAt: true,
        createdBy: { select: { id: true, displayName: true } },
      },
    })
  })

  return ok(
    {
      ...sellingPoint,
      id: sellingPoint.id.toString(),
      productId: sellingPoint.productId.toString(),
      createdBy: sellingPoint.createdBy
        ? { ...sellingPoint.createdBy, id: sellingPoint.createdBy.id.toString() }
        : null,
    },
    201,
  )
}
