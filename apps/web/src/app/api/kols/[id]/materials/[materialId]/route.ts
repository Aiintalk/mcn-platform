import { NextRequest } from 'next/server'
import { prisma } from '@/lib/prisma'
import { ok, err, requireAdmin } from '@/lib/api-helpers'

type Params = { params: { id: string; materialId: string } }

// DELETE /api/kols/[id]/materials/[materialId] — 硬删除单条素材
export async function DELETE(_req: NextRequest, { params }: Params) {
  const { res } = await requireAdmin()
  if (res) return res

  const kolId = BigInt(params.id)
  const materialId = BigInt(params.materialId)

  const material = await prisma.material.findUnique({ where: { id: materialId } })
  if (!material) return err('素材不存在', 404)
  if (material.kolId !== kolId) return err('素材不属于该红人', 400)

  await prisma.material.delete({ where: { id: materialId } })

  return ok({ message: '已删除' })
}
