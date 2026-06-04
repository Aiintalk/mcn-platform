import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, err, requireAuth, parseBigIntId, isValidHttpUrl, parseSafeDate } from '@/lib/api-helpers'
import { ViralScriptType } from '@prisma/client'

const VALID_TYPES = Object.values(ViralScriptType)

// GET /api/viral-scripts — 爆款库列表
export async function GET(req: NextRequest) {
  const { res } = await requireAuth()
  if (res) return res

  const { searchParams } = req.nextUrl
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? '20')))
  const type = searchParams.get('type') as ViralScriptType | null
  const kolIdRaw = searchParams.get('kolId')
  const productIdRaw = searchParams.get('productId')

  if (type && !VALID_TYPES.includes(type)) {
    return err(`type 无效，支持: ${VALID_TYPES.join(', ')}`, 400)
  }

  const kolBigInt = kolIdRaw ? parseBigIntId(kolIdRaw) : null
  if (kolIdRaw && kolBigInt === null) return err('kolId 无效', 400)

  const productBigInt = productIdRaw ? parseBigIntId(productIdRaw) : null
  if (productIdRaw && productBigInt === null) return err('productId 无效', 400)

  const where = {
    ...(type ? { type } : {}),
    ...(kolBigInt ? { kolId: kolBigInt } : {}),
    ...(productBigInt ? { productId: productBigInt } : {}),
  }

  const [total, scripts] = await Promise.all([
    prisma.viralScript.count({ where }),
    prisma.viralScript.findMany({
      where,
      select: {
        id: true,
        type: true,
        title: true,
        sourceUrl: true,
        platform: true,
        diggCount: true,
        publishAt: true,
        kolId: true,
        productId: true,
        createdAt: true,
        kol: { select: { id: true, name: true } },
        product: { select: { id: true, name: true } },
        uploadedBy: { select: { id: true, displayName: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])

  return ok({
    items: scripts.map((s) => ({
      ...s,
      id: s.id.toString(),
      kolId: s.kolId?.toString() ?? null,
      productId: s.productId?.toString() ?? null,
      diggCount: s.diggCount?.toString() ?? null,
      kol: s.kol ? { ...s.kol, id: s.kol.id.toString() } : null,
      product: s.product ? { ...s.product, id: s.product.id.toString() } : null,
      uploadedBy: s.uploadedBy ? { ...s.uploadedBy, id: s.uploadedBy.id.toString() } : null,
    })),
    total,
    page,
    pageSize,
  })
}

// POST /api/viral-scripts — 新建爆款
export async function POST(req: NextRequest) {
  const { session, res } = await requireAuth()
  if (res) return res

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return err('Invalid JSON', 400)
  }

  const { type, title, sourceUrl, platform, diggCount, publishAt, transcript, structureMd, kolId, productId } =
    body as Record<string, unknown>

  if (!type || !VALID_TYPES.includes(type as ViralScriptType)) {
    return err(`type 为必填，支持: ${VALID_TYPES.join(', ')}`, 400)
  }
  if (title !== undefined && title !== null && typeof title !== 'string') {
    return err('title 必须为字符串', 400)
  }
  if (platform !== undefined && platform !== null && typeof platform !== 'string') {
    return err('platform 必须为字符串', 400)
  }
  if (transcript !== undefined && transcript !== null && typeof transcript !== 'string') {
    return err('transcript 必须为字符串', 400)
  }
  if (structureMd !== undefined && structureMd !== null && typeof structureMd !== 'string') {
    return err('structureMd 必须为字符串', 400)
  }
  if (sourceUrl != null && !isValidHttpUrl(sourceUrl)) {
    return err('sourceUrl 必须为 http/https URL', 400)
  }

  let publishAtDate: Date | undefined
  if (publishAt != null) {
    const parsed = parseSafeDate(publishAt)
    if (parsed === null) return err('publishAt 日期格式无效', 400)
    publishAtDate = parsed
  }

  const kolBigInt = kolId != null ? parseBigIntId(String(kolId)) : null
  if (kolId != null && kolBigInt === null) return err('kolId 无效', 400)

  const productBigInt = productId != null ? parseBigIntId(String(productId)) : null
  if (productId != null && productBigInt === null) return err('productId 无效', 400)

  let diggCountBigInt: bigint | undefined
  if (diggCount != null) {
    const raw = String(diggCount)
    if (!/^\d+$/.test(raw)) return err('diggCount 必须为非负整数', 400)
    diggCountBigInt = BigInt(raw)
  }

  const script = await prisma.viralScript.create({
    data: {
      type: type as ViralScriptType,
      title: title as string | undefined,
      sourceUrl: sourceUrl as string | undefined,
      platform: platform as string | undefined,
      diggCount: diggCountBigInt,
      publishAt: publishAtDate,
      transcript: transcript as string | undefined,
      structureMd: structureMd as string | undefined,
      kolId: kolBigInt ?? undefined,
      productId: productBigInt ?? undefined,
      uploadedById: BigInt(session!.user.id),
    },
    select: {
      id: true,
      type: true,
      title: true,
      sourceUrl: true,
      platform: true,
      diggCount: true,
      publishAt: true,
      kolId: true,
      productId: true,
      createdAt: true,
      uploadedBy: { select: { id: true, displayName: true } },
    },
  })

  return ok(
    {
      ...script,
      id: script.id.toString(),
      kolId: script.kolId?.toString() ?? null,
      productId: script.productId?.toString() ?? null,
      diggCount: script.diggCount?.toString() ?? null,
      uploadedBy: script.uploadedBy ? { ...script.uploadedBy, id: script.uploadedBy.id.toString() } : null,
    },
    201,
  )
}
