import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, err, requireAuth, requireAdmin } from '@/lib/api-helpers'
import { ViralScriptType } from '@prisma/client'

type Params = { params: { id: string } }

const VALID_TYPES = Object.values(ViralScriptType)

const SELECT_DETAIL = {
  id: true,
  type: true,
  title: true,
  sourceUrl: true,
  platform: true,
  diggCount: true,
  publishAt: true,
  transcript: true,
  structureMd: true,
  kolId: true,
  productId: true,
  createdAt: true,
  kol: { select: { id: true, name: true } },
  product: { select: { id: true, name: true } },
  uploadedBy: { select: { id: true, displayName: true } },
} as const

function serialize(s: {
  id: bigint
  type: ViralScriptType
  title: string | null
  sourceUrl: string | null
  platform: string | null
  diggCount: bigint | null
  publishAt: Date | null
  transcript: string | null
  structureMd: string | null
  kolId: bigint | null
  productId: bigint | null
  createdAt: Date
  kol: { id: bigint; name: string } | null
  product: { id: bigint; name: string } | null
  uploadedBy: { id: bigint; displayName: string } | null
}) {
  return {
    ...s,
    id: s.id.toString(),
    kolId: s.kolId?.toString() ?? null,
    productId: s.productId?.toString() ?? null,
    diggCount: s.diggCount?.toString() ?? null,
    kol: s.kol ? { ...s.kol, id: s.kol.id.toString() } : null,
    product: s.product ? { ...s.product, id: s.product.id.toString() } : null,
    uploadedBy: s.uploadedBy ? { ...s.uploadedBy, id: s.uploadedBy.id.toString() } : null,
  }
}

// GET /api/viral-scripts/[id] — 单条爆款详情
export async function GET(_req: NextRequest, { params }: Params) {
  const { res } = await requireAuth()
  if (res) return res

  const id = BigInt(params.id)
  const script = await prisma.viralScript.findUnique({
    where: { id },
    select: SELECT_DETAIL,
  })

  if (!script) return err('爆款不存在', 404)
  return ok(serialize(script))
}

// PATCH /api/viral-scripts/[id] — 编辑爆款
export async function PATCH(req: NextRequest, { params }: Params) {
  const { res } = await requireAdmin()
  if (res) return res

  const id = BigInt(params.id)
  const existing = await prisma.viralScript.findUnique({ where: { id } })
  if (!existing) return err('爆款不存在', 404)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return err('Invalid JSON', 400)
  }

  const {
    type, title, sourceUrl, platform, diggCount,
    publishAt, transcript, structureMd, kolId, productId,
  } = body as Record<string, unknown>

  const updateData: Record<string, unknown> = {}

  if (type !== undefined) {
    if (!VALID_TYPES.includes(type as ViralScriptType)) {
      return err(`type 无效，支持: ${VALID_TYPES.join(', ')}`, 400)
    }
    updateData.type = type as ViralScriptType
  }
  if (title !== undefined) updateData.title = title
  if (sourceUrl !== undefined) updateData.sourceUrl = sourceUrl
  if (platform !== undefined) updateData.platform = platform
  if (diggCount !== undefined) {
    updateData.diggCount = diggCount != null ? BigInt(diggCount as number) : null
  }
  if (publishAt !== undefined) {
    updateData.publishAt = publishAt != null ? new Date(publishAt as string) : null
  }
  if (transcript !== undefined) updateData.transcript = transcript
  if (structureMd !== undefined) updateData.structureMd = structureMd
  if (kolId !== undefined) {
    updateData.kolId = kolId != null ? BigInt(kolId as string) : null
  }
  if (productId !== undefined) {
    updateData.productId = productId != null ? BigInt(productId as string) : null
  }

  if (Object.keys(updateData).length === 0) {
    return err('没有可更新的字段', 400)
  }

  const updated = await prisma.viralScript.update({
    where: { id },
    data: updateData,
    select: SELECT_DETAIL,
  })

  return ok(serialize(updated))
}

// DELETE /api/viral-scripts/[id] — 硬删除爆款
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { res } = await requireAdmin()
  if (res) return res

  const id = BigInt(params.id)
  const existing = await prisma.viralScript.findUnique({ where: { id } })
  if (!existing) return err('爆款不存在', 404)

  await prisma.viralScript.delete({ where: { id } })
  return ok({ message: '已删除' })
}
