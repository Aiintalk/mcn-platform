import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, err, requireAuth, requireAdmin, parseBigIntId, isValidHttpUrl, parseSafeDate } from '@/lib/api-helpers'
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

  const id = parseBigIntId(params.id)
  if (id === null) return err('无效 ID', 400)

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

  const id = parseBigIntId(params.id)
  if (id === null) return err('无效 ID', 400)

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
  if (title !== undefined) {
    if (title !== null && typeof title !== 'string') return err('title 必须为字符串', 400)
    updateData.title = title as string | null
  }
  if (sourceUrl !== undefined) {
    if (sourceUrl !== null && (typeof sourceUrl !== 'string' || !isValidHttpUrl(sourceUrl))) return err('sourceUrl 必须为 http/https URL', 400)
    updateData.sourceUrl = sourceUrl as string | null
  }
  if (platform !== undefined) {
    if (platform !== null && typeof platform !== 'string') return err('platform 必须为字符串', 400)
    updateData.platform = platform as string | null
  }
  if (diggCount !== undefined) {
    if (diggCount !== null) {
      const raw = String(diggCount)
      if (!/^\d+$/.test(raw)) return err('diggCount 必须为非负整数', 400)
      updateData.diggCount = BigInt(raw)
    } else {
      updateData.diggCount = null
    }
  }
  if (publishAt !== undefined) {
    if (publishAt === null) {
      updateData.publishAt = null
    } else {
      const parsed = parseSafeDate(publishAt)
      if (parsed === null) return err('publishAt 日期格式无效', 400)
      updateData.publishAt = parsed
    }
  }
  if (transcript !== undefined) {
    if (transcript !== null && typeof transcript !== 'string') return err('transcript 必须为字符串', 400)
    updateData.transcript = transcript as string | null
  }
  if (structureMd !== undefined) {
    if (structureMd !== null && typeof structureMd !== 'string') return err('structureMd 必须为字符串', 400)
    updateData.structureMd = structureMd as string | null
  }
  if (kolId !== undefined) {
    if (kolId !== null) {
      const parsed = parseBigIntId(String(kolId))
      if (parsed === null) return err('kolId 无效', 400)
      updateData.kolId = parsed
    } else {
      updateData.kolId = null
    }
  }
  if (productId !== undefined) {
    if (productId !== null) {
      const parsed = parseBigIntId(String(productId))
      if (parsed === null) return err('productId 无效', 400)
      updateData.productId = parsed
    } else {
      updateData.productId = null
    }
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

  const id = parseBigIntId(params.id)
  if (id === null) return err('无效 ID', 400)

  const existing = await prisma.viralScript.findUnique({ where: { id } })
  if (!existing) return err('爆款不存在', 404)

  await prisma.viralScript.delete({ where: { id } })
  return ok({ message: '已删除' })
}
