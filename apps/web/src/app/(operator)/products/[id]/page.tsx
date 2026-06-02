'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { fetchProduct, ApiProductDetail } from '@/lib/api/products'
import { fetchViralScripts, ApiViralScript } from '@/lib/api/viral-scripts'
import StatusBadge from '@/components/StatusBadge'

type SpTab = 'endorsement' | 'mechanism' | 'seeding'

const SP_TAB_LABELS: Record<SpTab, string> = {
  endorsement: '背书',
  mechanism: '机制',
  seeding: '种草',
}

export default function OperatorProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [product, setProduct] = useState<ApiProductDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [spTab, setSpTab] = useState<SpTab>('endorsement')
  const [viralScripts, setViralScripts] = useState<ApiViralScript[]>([])
  const [benchmarkScripts, setBenchmarkScripts] = useState<ApiViralScript[]>([])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchProduct(id)
      setProduct(data)

      const vs = await fetchViralScripts({ productId: id, pageSize: 50 })
      setViralScripts(vs.items)
      setBenchmarkScripts(vs.items.slice(0, 3))
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  if (loading) return <div className="p-8 text-gray-400 text-sm">加载中…</div>
  if (error || !product) {
    return (
      <div className="p-8">
        <p className="text-red-500 text-sm">{error || '产品不存在'}</p>
        <Link href="/" className="text-sm text-orange-500 hover:underline mt-2 inline-block">← 返回工作台</Link>
      </div>
    )
  }

  const currentSp = product.sellingPoints.find((sp) => sp.isCurrent) ?? product.sellingPoints[0]
  const spContent = currentSp?.[spTab] ?? null

  return (
    <div className="p-8 max-w-3xl">
      <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition mb-4 inline-block">
        ← 工作台
      </Link>

      {/* 基础信息卡（只读，无编辑按钮） */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
        <div className="flex items-center gap-3 flex-wrap mb-2">
          <h1 className="text-xl font-bold text-gray-900">{product.name}</h1>
          {product.category && (
            <span className="inline-block px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-600 border border-blue-100">{product.category}</span>
          )}
          <StatusBadge status={product.status} />
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span className="font-semibold text-lg text-gray-900">¥{product.price}</span>
          {product.targetAudience && <span className="text-gray-400">目标：{product.targetAudience}</span>}
          {product.scenario && <span className="text-gray-400">场景：{product.scenario}</span>}
        </div>
      </div>

      {/* 机制卖点卡（只读） */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">机制卖点</h2>
        {product.sellingPoints.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">暂无卖点内容</p>
        ) : (
          <>
            <div className="flex gap-1 border-b border-gray-200 mb-4">
              {(Object.keys(SP_TAB_LABELS) as SpTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setSpTab(tab)}
                  className={`px-4 py-2 text-sm font-medium transition border-b-2 -mb-px ${spTab === tab ? 'border-orange-400 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >{SP_TAB_LABELS[tab]}</button>
              ))}
            </div>
            {spContent ? (
              <p className="text-sm text-gray-600 leading-relaxed">{spContent}</p>
            ) : (
              <p className="text-sm text-gray-400 py-4 text-center">该维度暂无内容</p>
            )}
          </>
        )}
      </div>

      {/* 爆款文案 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">爆款文案</h2>
        {viralScripts.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">暂无爆款文案</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {viralScripts.map((script) => (
              <div key={script.id} className="py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-gray-900">{script.title ?? '（无标题）'}</p>
                  <span className="text-xs text-gray-400 flex-shrink-0">❤ {Number(script.diggCount ?? 0).toLocaleString()}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {script.kol?.name ?? '—'} · {script.publishAt ? new Date(script.publishAt).toLocaleDateString('zh-CN') : '—'}
                </p>
                {script.transcript && <p className="text-xs text-gray-500 mt-2 line-clamp-3">{script.transcript}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 对标文案库 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">对标文案库</h2>
        {benchmarkScripts.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">暂无对标文案</p>
        ) : (
          <div className="divide-y divide-gray-100">
            {benchmarkScripts.map((script) => (
              <div key={script.id} className="py-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium text-gray-900">{script.title ?? '（无标题）'}</p>
                  <span className="text-xs text-gray-400 flex-shrink-0">❤ {Number(script.diggCount ?? 0).toLocaleString()}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {script.publishAt ? new Date(script.publishAt).toLocaleDateString('zh-CN') : '—'}
                </p>
                {script.transcript && <p className="text-xs text-gray-500 mt-2 line-clamp-3">{script.transcript}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
