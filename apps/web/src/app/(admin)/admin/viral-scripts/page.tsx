'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  fetchViralScripts,
  createViralScript,
  updateViralScript,
  deleteViralScript,
  ApiViralScript,
  ApiViralScriptType,
} from '@/lib/api/viral-scripts'
import { fetchKols, ApiKolListItem } from '@/lib/api/kols'
import { fetchProducts, ApiProductListItem } from '@/lib/api/products'
import ConfirmDialog from '@/components/ConfirmDialog'

// UI uses 'live' as the tab key; API uses 'livestream'
type UiScriptType = 'persona' | 'qianchuan' | 'live' | 'tiktok'

const UI_TO_API: Record<UiScriptType, ApiViralScriptType> = {
  persona: 'persona',
  qianchuan: 'qianchuan',
  live: 'livestream',
  tiktok: 'tiktok',
}

const TAB_LABELS: Record<UiScriptType, string> = {
  persona: '人设爆款',
  qianchuan: '千川爆款',
  live: '直播间爆款',
  tiktok: 'TikTok爆款',
}

const TAB_ORDER: UiScriptType[] = ['persona', 'qianchuan', 'live', 'tiktok']

type FormData = {
  title: string
  sourceUrl: string
  diggCount: string
  publishAt: string
  transcript: string
  kolId: string
  productId: string
}

const EMPTY_FORM: FormData = {
  title: '', sourceUrl: '', diggCount: '', publishAt: '',
  transcript: '', kolId: '', productId: '',
}

export default function ViralScriptsPage() {
  const [activeType, setActiveType] = useState<UiScriptType>('persona')
  const [scripts, setScripts] = useState<ApiViralScript[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [kolFilter, setKolFilter] = useState('')
  const [productFilter, setProductFilter] = useState('')
  const [kols, setKols] = useState<ApiKolListItem[]>([])
  const [products, setProducts] = useState<ApiProductListItem[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editTarget, setEditTarget] = useState<ApiViralScript | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<ApiViralScript | null>(null)
  const [viewScript, setViewScript] = useState<ApiViralScript | null>(null)
  const [form, setForm] = useState<FormData>(EMPTY_FORM)
  const [formLoading, setFormLoading] = useState(false)
  const [formError, setFormError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchViralScripts({
        type: UI_TO_API[activeType],
        kolId: kolFilter || undefined,
        productId: productFilter || undefined,
        pageSize: 50,
      })
      setScripts(res.items)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }, [activeType, kolFilter, productFilter])

  useEffect(() => { load() }, [load])

  // Load filter options once
  useEffect(() => {
    fetchKols({ status: 'active', pageSize: 100 }).then((r) => setKols(r.items)).catch(() => {})
    fetchProducts({ status: 'active', pageSize: 100 }).then((r) => setProducts(r.items)).catch(() => {})
  }, [])

  function openCreate() {
    setEditTarget(null)
    setForm(EMPTY_FORM)
    setFormError('')
    setShowForm(true)
  }

  function openEdit(script: ApiViralScript) {
    setEditTarget(script)
    setForm({
      title: script.title ?? '',
      sourceUrl: script.sourceUrl ?? '',
      diggCount: script.diggCount ?? '',
      publishAt: script.publishAt ? script.publishAt.slice(0, 10) : '',
      transcript: script.transcript ?? '',
      kolId: script.kolId ?? '',
      productId: script.productId ?? '',
    })
    setFormError('')
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.title.trim()) { setFormError('标题为必填项'); return }
    setFormLoading(true)
    setFormError('')
    try {
      const body = {
        type: UI_TO_API[activeType],
        title: form.title.trim(),
        sourceUrl: form.sourceUrl.trim() || undefined,
        diggCount: form.diggCount ? Number(form.diggCount) : undefined,
        publishAt: form.publishAt ? new Date(form.publishAt).toISOString() : undefined,
        transcript: form.transcript.trim() || undefined,
        kolId: form.kolId || null,
        productId: form.productId || null,
      }
      if (editTarget) {
        const updated = await updateViralScript(editTarget.id, body)
        setScripts((prev) => prev.map((s) => s.id === updated.id ? updated : s))
      } else {
        const created = await createViralScript(body)
        setScripts((prev) => [created, ...prev])
        setTotal((t) => t + 1)
      }
      setShowForm(false)
    } catch (e) {
      setFormError(e instanceof Error ? e.message : '保存失败')
    } finally {
      setFormLoading(false)
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return
    await deleteViralScript(deleteTarget.id)
    setScripts((prev) => prev.filter((s) => s.id !== deleteTarget.id))
    setTotal((t) => t - 1)
  }

  function updateForm<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">爆款库</h1>
          <p className="text-sm text-gray-500 mt-1">共 {total} 条素材</p>
        </div>
        <button onClick={openCreate} className="px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 transition" style={{ background: '#f59a23' }}>
          + 新建
        </button>
      </div>

      {/* Top 4 tabs */}
      <div className="border-b border-gray-200 mb-5">
        <div className="flex gap-1">
          {TAB_ORDER.map((type) => (
            <button
              key={type}
              onClick={() => { setActiveType(type); setKolFilter(''); setProductFilter('') }}
              className={`px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${activeType === type ? 'border-orange-400 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >{TAB_LABELS[type]}</button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-5">
        <select value={kolFilter} onChange={(e) => setKolFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400">
          <option value="">全部红人</option>
          {kols.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
        </select>
        <select value={productFilter} onChange={(e) => setProductFilter(e.target.value)} className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400">
          <option value="">全部产品</option>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </div>

      {/* List */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">标题</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">关联红人</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">关联产品</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">点赞数</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">发布时间</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="text-center py-12 text-gray-400">加载中…</td></tr>}
            {!loading && scripts.length === 0 && <tr><td colSpan={6} className="text-center py-12 text-gray-400">暂无数据</td></tr>}
            {!loading && scripts.map((script) => (
              <tr key={script.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 max-w-[240px]">
                  <p className="font-medium text-gray-900 truncate">{script.title ?? '—'}</p>
                  {script.sourceUrl && <p className="text-xs text-gray-400 truncate mt-0.5">{script.sourceUrl}</p>}
                </td>
                <td className="px-4 py-3 text-gray-600 text-xs">{script.kol?.name ?? '—'}</td>
                <td className="px-4 py-3 text-gray-600 text-xs">{script.product?.name ?? '—'}</td>
                <td className="px-4 py-3 text-xs">❤ {Number(script.diggCount ?? 0).toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-400 text-xs">
                  {script.publishAt ? new Date(script.publishAt).toLocaleDateString('zh-CN') : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <button onClick={() => setViewScript(script)} className="text-xs text-blue-600 hover:underline">查看</button>
                    <button onClick={() => openEdit(script)} className="text-xs text-gray-500 hover:underline">编辑</button>
                    <button onClick={() => setDeleteTarget(script)} className="text-xs text-red-500 hover:underline">删除</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create/Edit form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[540px] max-h-[90vh] overflow-y-auto p-7" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base font-bold text-gray-900 mb-5">
              {editTarget ? '编辑爆款' : `新建${TAB_LABELS[activeType]}`}
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <Field label="标题" required>
                <input value={form.title} onChange={(e) => updateForm('title', e.target.value)} required className="input-base" placeholder="爆款标题" />
              </Field>
              <Field label="来源链接">
                <input value={form.sourceUrl} onChange={(e) => updateForm('sourceUrl', e.target.value)} className="input-base" placeholder="https://..." />
              </Field>
              <div className="flex gap-3">
                <div className="flex-1">
                  <Field label="点赞数">
                    <input type="number" value={form.diggCount} onChange={(e) => updateForm('diggCount', e.target.value)} className="input-base" placeholder="0" min="0" />
                  </Field>
                </div>
                <div className="flex-1">
                  <Field label="发布时间">
                    <input type="date" value={form.publishAt} onChange={(e) => updateForm('publishAt', e.target.value)} className="input-base" />
                  </Field>
                </div>
              </div>
              <Field label="关联红人">
                <select value={form.kolId} onChange={(e) => updateForm('kolId', e.target.value)} className="input-base">
                  <option value="">不关联</option>
                  {kols.map((k) => <option key={k.id} value={k.id}>{k.name}</option>)}
                </select>
              </Field>
              <Field label="关联产品">
                <select value={form.productId} onChange={(e) => updateForm('productId', e.target.value)} className="input-base">
                  <option value="">不关联</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </Field>
              <Field label="逐字稿">
                <textarea value={form.transcript} onChange={(e) => updateForm('transcript', e.target.value)} rows={6} className="input-base resize-y" placeholder="粘贴逐字稿内容…" />
              </Field>
              {formError && <p className="text-sm text-red-500">{formError}</p>}
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition">取消</button>
                <button type="submit" disabled={formLoading} className="flex-1 py-2.5 rounded-lg text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-60" style={{ background: '#f59a23' }}>
                  {formLoading ? '保存中…' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View modal */}
      {viewScript && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setViewScript(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[540px] max-h-[90vh] overflow-y-auto p-7" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-base font-bold text-gray-900 mb-1">{viewScript.title ?? '（无标题）'}</h2>
            <p className="text-xs text-gray-400 mb-4">
              {viewScript.kol?.name ?? '—'} · {viewScript.product?.name ?? '—'} · ❤ {Number(viewScript.diggCount ?? 0).toLocaleString()}
            </p>
            <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {viewScript.transcript ?? '（暂无逐字稿）'}
            </div>
            <button onClick={() => setViewScript(null)} className="w-full mt-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition">关闭</button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => { if (!open) setDeleteTarget(null) }}
        title="确认删除"
        description={`删除后「${deleteTarget?.title ?? '此爆款'}」将永久移除，无法恢复。`}
        confirmLabel="确认删除"
        variant="destructive"
        onConfirm={handleDelete}
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
