import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, err, requireAuth, requireAdmin } from '@/lib/api-helpers'
import { ProductStatus, Prisma } from '@prisma/client'

// GET /api/products — 产品列表
export async function GET(req: NextRequest) {
  const { res } = await requireAuth()
  if (res) return res

  const { searchParams } = req.nextUrl
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? '20')))
  const status = searchParams.get('status') as ProductStatus | null
  const category = searchParams.get('category')
  const q = searchParams.get('q')

  const where: Prisma.ProductWhereInput = {
    ...(status ? { status } : { status: ProductStatus.active }),
    ...(category ? { category } : {}),
    ...(q ? { name: { contains: q, mode: 'insensitive' as Prisma.QueryMode } } : {}),
  }

  const [total, products] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
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
          where: { isCurrent: true },
          select: { id: true, version: true },
          take: 1,
        },
      },
      orderBy: { updatedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ])

  return ok({
    items: products.map((p) => ({
      ...p,
      id: p.id.toString(),
      price: p.price ? Number(p.price) : null,
      sellingPoints: p.sellingPoints.map((sp) => ({ ...sp, id: sp.id.toString() })),
    })),
    total,
    page,
    pageSize,
  })
}

// POST /api/products — 创建产品（仅 admin）
export async function POST(req: NextRequest) {
  const { res } = await requireAdmin()
  if (res) return res

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return err('Invalid JSON', 400)
  }

  const { name, category, price, targetAudience, scenario } = body as Record<string, unknown>

  if (!name || typeof name !== 'string' || !name.trim()) {
    return err('name 为必填', 400)
  }
  if (price !== undefined && price !== null) {
    const priceNum = Number(price)
    if (isNaN(priceNum) || priceNum < 0) return err('price 必须为非负数', 400)
  }

  const product = await prisma.product.create({
    data: {
      name: (name as string).trim(),
      category: category as string | undefined,
      price: price != null ? new Prisma.Decimal(price as number) : undefined,
      targetAudience: targetAudience as string | undefined,
      scenario: scenario as string | undefined,
      status: ProductStatus.active,
    },
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

  return ok(
    {
      ...product,
      id: product.id.toString(),
      price: product.price ? Number(product.price) : null,
    },
    201,
  )
}
