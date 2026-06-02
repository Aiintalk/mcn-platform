import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, err, requireAuth, requireAdmin } from '@/lib/api-helpers'

type Params = { params: { id: string } }

// GET /api/kols/[id]/materials — 获取该红人所有素材
export async function GET(req: NextRequest, { params }: Params) {
  const { res } = await requireAuth()
  if (res) return res

  const kolId = BigInt(params.id)
  const kol = await prisma.kol.findUnique({ where: { id: kolId } })
  if (!kol) return err('红人不存在', 404)

  const type = req.nextUrl.searchParams.get('type')

  const materials = await prisma.material.findMany({
    where: {
      kolId,
      ...(type ? { type } : {}),
    },
    select: {
      id: true,
      type: true,
      title: true,
      source: true,
      diggCount: true,
      content: true,
      createdAt: true,
      uploadedBy: { select: { id: true, displayName: true } },
    },
    orderBy: { createdAt: 'desc' },
  })

  return ok(
    materials.map((m) => ({
      ...m,
      id: m.id.toString(),
      diggCount: m.diggCount?.toString() ?? null,
      uploadedBy: m.uploadedBy ? { ...m.uploadedBy, id: m.uploadedBy.id.toString() } : null,
    })),
  )
}

// POST /api/kols/[id]/materials — 新增素材
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

  const { type, title, source, diggCount, content } = body as Record<string, unknown>

  const material = await prisma.material.create({
    data: {
      kolId,
      type: type as string | undefined,
      title: title as string | undefined,
      source: source as string | undefined,
      diggCount: diggCount != null ? BigInt(diggCount as number) : undefined,
      content: content as string | undefined,
      uploadedById: BigInt(session!.user.id),
    },
    select: {
      id: true,
      type: true,
      title: true,
      source: true,
      diggCount: true,
      content: true,
      createdAt: true,
      uploadedBy: { select: { id: true, displayName: true } },
    },
  })

  return ok(
    {
      ...material,
      id: material.id.toString(),
      diggCount: material.diggCount?.toString() ?? null,
      uploadedBy: material.uploadedBy
        ? { ...material.uploadedBy, id: material.uploadedBy.id.toString() }
        : null,
    },
    201,
  )
}
