import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, err, requireAuth, requireAdmin, parseBigIntId } from '@/lib/api-helpers'
import { ProductStatus, Prisma } from '@prisma/client'

type Params = { params: { id: string } }

// GET /api/products/[id] — 产品详情
export async function GET(_req: NextRequest, { params }: Params) {
  const { res } = await requireAuth()
  if (res) return res

  const id = parseBigIntId(params.id)
  if (id === null) return err('无效 ID', 400)

  const product = await prisma.product.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      category: true,
      price: true,
      targetAudience: true,
      scenario: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      sellingPoints: {
        select: {
          id: true,
          version: true,
          isCurrent: true,
          endorsement: true,
          mechanism: true,
          seeding: true,
          rawDocUrl: true,
          createdAt: true,
          createdBy: { select: { id: true, displayName: true } },
        },
        orderBy: { version: 'desc' },
        take: 5,
      },
    },
  })

  if (!product) return err('产品不存在', 404)

  return ok({
    ...product,
    id: product.id.toString(),
    price: product.price ? Number(product.price) : null,
    sellingPoints: product.sellingPoints.map((sp) => ({
      ...sp,
      id: sp.id.toString(),
      createdBy: sp.createdBy ? { ...sp.createdBy, id: sp.createdBy.id.toString() } : null,
    })),
  })
}

// PATCH /api/products/[id] — 编辑产品（仅 admin）
export async function PATCH(req: NextRequest, { params }: Params) {
  const { res } = await requireAdmin()
  if (res) return res

  const id = parseBigIntId(params.id)
  if (id === null) return err('无效 ID', 400)

  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) return err('产品不存在', 404)

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return err('Invalid JSON', 400)
  }

  const { name, category, price, targetAudience, scenario, status } = body as Record<string, unknown>

  const updateData: Record<string, unknown> = {}

  if (name !== undefined) {
    if (typeof name !== 'string' || !name.trim()) return err('name 不能为空', 400)
    updateData.name = name.trim()
  }
  if (category !== undefined) updateData.category = category
  if (price !== undefined) {
    if (price === null) {
      updateData.price = null
    } else {
      const priceNum = Number(price)
      if (isNaN(priceNum) || priceNum < 0) return err('price 必须为非负数', 400)
      updateData.price = new Prisma.Decimal(priceNum)
    }
  }
  if (targetAudience !== undefined) updateData.targetAudience = targetAudience
  if (scenario !== undefined) updateData.scenario = scenario
  if (status !== undefined) {
    if (!Object.values(ProductStatus).includes(status as ProductStatus)) return err('status 无效', 400)
    updateData.status = status as ProductStatus
  }

  if (Object.keys(updateData).length === 0) {
    return err('没有可更新的字段', 400)
  }

  const updated = await prisma.product.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      name: true,
      category: true,
      price: true,
      targetAudience: true,
      scenario: true,
      status: true,
      createdAt: true,
      updatedAt: true,
    },
  })

  return ok({
    ...updated,
    id: updated.id.toString(),
    price: updated.price ? Number(updated.price) : null,
  })
}

// DELETE /api/products/[id] — 物理删除（仅 admin）
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { res } = await requireAdmin()
  if (res) return res

  const id = parseBigIntId(params.id)
  if (id === null) return err('无效 ID', 400)

  const product = await prisma.product.findUnique({ where: { id } })
  if (!product) return err('产品不存在', 404)

  await prisma.product.delete({ where: { id } })
  return ok({ message: '已删除' })
}
