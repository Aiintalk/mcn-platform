import { prisma } from '@/lib/prisma'
import { ok, err, requireAuth } from '@/lib/api-helpers'
import { KolStatus, ProductStatus } from '@prisma/client'

// GET /api/stats/summary — 看板统计汇总
export async function GET() {
  const { res } = await requireAuth()
  if (res) return res

  const [
    totalKols,
    activeKols,
    totalProducts,
    activeProducts,
    totalViralScripts,
    totalOutputs,
  ] = await Promise.all([
    prisma.kol.count(),
    prisma.kol.count({ where: { status: KolStatus.active } }),
    prisma.product.count(),
    prisma.product.count({ where: { status: ProductStatus.active } }),
    prisma.viralScript.count(),
    prisma.output.count(),
  ])

  return ok({
    kols: { total: totalKols, active: activeKols },
    products: { total: totalProducts, active: activeProducts },
    viralScripts: { total: totalViralScripts },
    outputs: { total: totalOutputs },
  })
}
