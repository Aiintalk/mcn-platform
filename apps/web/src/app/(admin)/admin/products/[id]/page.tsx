'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import mammoth from 'mammoth'
import { fetchProduct, updateProduct, ApiProductDetail, ApiSellingPoint } from '@/lib/api/products'
import { fetchViralScripts, ApiViralScript } from '@/lib/api/viral-scripts'
import StatusBadge from '@/components/StatusBadge'
import FileUploadButton from '@/components/FileUploadButton'
import ConfirmDialog from '@/components/ConfirmDialog'

type SpTab = 'endorsement' | 'mechanism' | 'seeding'

const SP_TAB_LABELS: Record<SpTab, string> = {
  endorsement: '背书',
  mechanism: '机制',
  seeding: '种草',
}

const CATEGORIES = ['护肤', '保健', '彩妆', '食品', '其他']

export default function ProductDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const [product, setProduct] = useState<ApiProductDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [spTab, setSpTab] = useState<SpTab>('endorsement')
  const [viralScripts, setViralScripts] = useState<ApiViralScript[]>([])
  const [benchmarkScripts, setBenchmarkScripts] = useState<ApiViralScript[]>([])

  // Edit dialog state
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editName, setEditName] = useState('')
  const [editCategory, setEditCategory] = useState('')
  const [editPrice, setEditPrice] = useState('')
  const [editTargetAudience, setEditTargetAudience] = useState('')
  const [editScenario, setEditScenario] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState('')

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)

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

  // ── Edit ──────────────────────────────────────────────────────────────────

  function openEditDialog() {
    if (!product) return
    setEditName(product.name)
    setEditCategory(product.category ?? '')
    setEditPrice(product.price != null ? String(product.price) : '')
    setEditTargetAudience(product.targetAudience ?? '')
    setEditScenario(product.scenario ?? '')
    setEditError('')
    setShowEditDialog(true)
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editName.trim()) { setEditError('产品名不能为空'); return }
    const priceNum = Number(editPrice)
    if (editPrice && (isNaN(priceNum) || priceNum < 0)) { setEditError('请输入有效价格'); return }
    setEditLoading(true)
    setEditError('')
    try {
      await updateProduct(id, {
        name: editName.trim(),
        category: editCategory || undefined,
        price: editPrice ? priceNum : undefined,
        targetAudience: editTargetAudience.trim() || undefined,
        scenario: editScenario.trim() || undefined,
      })
      setShowEditDialog(false)
      load()
    } catch (e) {
      setEditError(e instanceof Error ? e.message : '保存失败')
    } finally {
      setEditLoading(false)
    }
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async function handleDeleteProduct() {
    setDeleteLoading(true)
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json()
        toast.error(body.error ?? '删除失败')
        return
      }
      toast.success('产品已删除')
      router.push('/admin/products')
    } finally {
      setDeleteLoading(false)
    }
  }

  // ── Selling point upload ──────────────────────────────────────────────────

  function extractSection(md: string, idx: number): string {
    const matches = [...md.matchAll(/^##\s+[^\n]*/gm)]
    if (matches.length === 0) {
      const parts = md.split(/^---$/m).map((s) => s.trim()).filter(Boolean)
      return parts[idx] ?? (idx === 0 ? md.trim() : '')
    }
    if (idx >= matches.length) return ''
    const start = (matches[idx].index ?? 0) + matches[idx][0].length
    const end = matches[idx + 1]?.index ?? md.length
    return md.slice(start, end).trim()
  }

  async function handleSellingPointUpload(file: File) {
    const toastId = toast.loading('解析中…')
    try {
      const name = file.name.toLowerCase()
      let md = ''
      if (name.endsWith('.md')) {
        md = await file.text()
      } else if (name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer()
        const result = await mammoth.convertToMarkdown({ arrayBuffer })
        md = result.value
      } else {
        toast.error('仅支持 .md / .docx 格式', { id: toastId })
        return
      }

      const body = {
        endorsement: extractSection(md, 0),
        mechanism: extractSection(md, 1),
        seeding: extractSection(md, 2),
      }

      const res = await fetch(`/api/products/${id}/upload-selling-points`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json()
        toast.error(err.error ?? '上传失败', { id: toastId })
        return
      }
      const { data: newSp }: { data: ApiSellingPoint } = await res.json()

      setProduct((prev) => {
        if (!prev) return prev
        const updated = prev.sellingPoints.map((sp) => ({ ...sp, isCurrent: false }))
        return { ...prev, sellingPoints: [...updated, { ...newSp }] }
      })
      toast.success('卖点文档已更新', { id: toastId })
    } catch {
      toast.error('上传失败，请重试', { id: toastId })
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────

  if (loading) return <div className="p-8 text-gray-400 text-sm">加载中…</div>
  if (error || !product) {
    return (
      <div className="p-8">
        <p className="text-red-500 text-sm">{error || '产品不存在'}</p>
        <Link href="/admin/products" className="text-sm text-orange-500 hover:underline mt-2 inline-block">← 返回列表</Link>
      </div>
    )
  }

  const currentSp = product.sellingPoints.find((sp) => sp.isCurrent) ?? product.sellingPoints[0]
  const spContent = currentSp?.[spTab] ?? null

  return (
    <div className="p-8 max-w-3xl">
      <Link href="/admin/products" className="text-sm text-gray-400 hover:text-gray-600 transition mb-4 inline-block">
        ← 产品管理
      </Link>

      {/* 基础信息卡 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <h1 className="text-xl font-bold text-gray-900">{product.name}</h1>
              {product.category && <span className="inline-block px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-600 border border-blue-100">{product.category}</span>}
              <StatusBadge status={product.status} />
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="font-semibold text-lg text-gray-900">¥{product.price}</span>
              {product.targetAudience && <span className="text-gray-400">目标：{product.targetAudience}</span>}
              {product.scenario && <span className="text-gray-400">场景：{product.scenario}</span>}
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button onClick={openEditDialog} className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-600 hover:bg-gray-50 transition">
              编辑
            </button>
            <button onClick={() => setShowDeleteConfirm(true)} className="px-3 py-1.5 rounded-lg border border-red-200 text-xs text-red-500 hover:bg-red-50 transition">
              删除
            </button>
          </div>
        </div>
      </div>

      {/* 机制卖点卡 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-5">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-700">机制卖点</h2>
          <FileUploadButton
            accept=".md,.docx"
            label="上传卖点文档"
            onUpload={handleSellingPointUpload}
          />
        </div>
        {product.sellingPoints.length === 0 ? (
          <p className="text-sm text-gray-400 py-4 text-center">暂无卖点内容，点击右上角上传</p>
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
                {script.transcript && <p className="text-xs text-gray-500 mt-2 line-clamp-2">{script.transcript}</p>}
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
                {script.transcript && <p className="text-xs text-gray-500 mt-2 line-clamp-2">{script.transcript}</p>}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit dialog */}
      {showEditDialog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowEditDialog(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[480px] p-8" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-6">编辑产品信息</h2>
            <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
              <Field label="产品名" required>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} required className="input-base" />
              </Field>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Field label="品类">
                    <select value={editCategory} onChange={(e) => setEditCategory(e.target.value)} className="input-base">
                      <option value="">请选择</option>
                      {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>
                </div>
                <div className="flex-1">
                  <Field label="价格（元）">
                    <input type="number" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} min="0" step="0.01" className="input-base" />
                  </Field>
                </div>
              </div>
              <Field label="目标受众">
                <input value={editTargetAudience} onChange={(e) => setEditTargetAudience(e.target.value)} placeholder="如：25-35 岁女性" className="input-base" />
              </Field>
              <Field label="使用场景">
                <input value={editScenario} onChange={(e) => setEditScenario(e.target.value)} placeholder="如：日常护肤" className="input-base" />
              </Field>
              {editError && <p className="text-sm text-red-500">{editError}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowEditDialog(false)} className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition">取消</button>
                <button type="submit" disabled={editLoading} className="flex-1 py-2.5 rounded-lg text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-60" style={{ background: '#f59a23' }}>
                  {editLoading ? '保存中…' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={(open) => { if (!open) setShowDeleteConfirm(false) }}
        title="确认删除产品"
        description={`「${product.name}」将被永久删除，无法恢复。`}
        confirmLabel={deleteLoading ? '删除中…' : '确认删除'}
        variant="destructive"
        onConfirm={handleDeleteProduct}
      />

      <style jsx>{`
        .input-base { width:100%; border:1px solid #d1d5db; border-radius:8px; padding:8px 12px; font-size:13px; outline:none; transition:border-color 0.15s; }
        .input-base:focus { border-color:#f59a23; box-shadow:0 0 0 2px rgba(245,154,35,0.15); }
      `}</style>
    </div>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs text-gray-500 mb-1.5">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
      {children}
    </div>
  )
}
