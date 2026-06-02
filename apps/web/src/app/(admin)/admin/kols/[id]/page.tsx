'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { toast } from 'sonner'
import mammoth from 'mammoth'
import { fetchKol, uploadKolProfile, ApiKolDetail, ApiKolProfile } from '@/lib/api/kols'
import { fetchProducts, ApiProductListItem } from '@/lib/api/products'
import { formatDate } from '@/lib/utils'
import MarkdownViewer from '@/components/MarkdownViewer'
import FileUploadButton from '@/components/FileUploadButton'

const TABS = ['人格档案', '内容规划', '关联产品', '素材库', '历史版本'] as const
type Tab = typeof TABS[number]

export default function KolDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [kol, setKol] = useState<ApiKolDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('人格档案')
  const [allProducts, setAllProducts] = useState<ApiProductListItem[]>([])
  // KOL-product relations: no v2.0 API yet → local state only
  const [relatedProductIds, setRelatedProductIds] = useState<string[]>([])
  const [showProductPicker, setShowProductPicker] = useState(false)
  const [previewVersionId, setPreviewVersionId] = useState<string | null>(null)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editName, setEditName] = useState('')
  const [editDouyinId, setEditDouyinId] = useState('')
  const [editDouyinUrl, setEditDouyinUrl] = useState('')
  const [editTags, setEditTags] = useState('')
  const [editLoading, setEditLoading] = useState(false)
  const [editError, setEditError] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await fetchKol(id)
      setKol(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    fetchProducts({ status: 'active', pageSize: 100 })
      .then((res) => setAllProducts(res.items))
      .catch(() => {/* non-critical */})
  }, [])

  // Derive current profile content from API data
  const currentProfile: ApiKolProfile | undefined = kol?.profiles.find((p) => p.isCurrent)
  const soulMd = currentProfile?.soulMd ?? ''
  const contentPlanMd = currentProfile?.contentPlanMd ?? ''

  async function parseFileToMarkdown(file: File): Promise<string> {
    const name = file.name.toLowerCase()
    if (name.endsWith('.md')) {
      return file.text()
    }
    if (name.endsWith('.docx')) {
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.convertToMarkdown({ arrayBuffer })
      return result.value
    }
    throw new Error('FORMAT_UNSUPPORTED')
  }

  async function handleSoulUpload(file: File) {
    const toastId = toast.loading('解析中…')
    try {
      const md = await parseFileToMarkdown(file)
      const newProfile = await uploadKolProfile(id, { soulMd: md, contentPlanMd: contentPlanMd || undefined })
      setKol((prev) => {
        if (!prev) return prev
        const updated = prev.profiles.map((p) => ({ ...p, isCurrent: false }))
        return { ...prev, profiles: [...updated, { ...newProfile }] }
      })
      toast.success('人格档案已更新', { id: toastId })
    } catch (e) {
      const msg = e instanceof Error && e.message === 'FORMAT_UNSUPPORTED'
        ? '仅支持 .md / .docx 格式'
        : '上传失败，请重试'
      toast.error(msg, { id: toastId })
    }
  }

  async function handleContentPlanUpload(file: File) {
    const toastId = toast.loading('解析中…')
    try {
      const md = await parseFileToMarkdown(file)
      const newProfile = await uploadKolProfile(id, { soulMd: soulMd || undefined, contentPlanMd: md })
      setKol((prev) => {
        if (!prev) return prev
        const updated = prev.profiles.map((p) => ({ ...p, isCurrent: false }))
        return { ...prev, profiles: [...updated, { ...newProfile }] }
      })
      toast.success('内容规划已更新', { id: toastId })
    } catch (e) {
      const msg = e instanceof Error && e.message === 'FORMAT_UNSUPPORTED'
        ? '仅支持 .md / .docx 格式'
        : '上传失败，请重试'
      toast.error(msg, { id: toastId })
    }
  }

  function openEditDialog() {
    if (!kol) return
    setEditName(kol.name)
    setEditDouyinId(kol.douyinId ?? '')
    setEditDouyinUrl(kol.douyinUrl ?? '')
    setEditTags(kol.tags.join(', '))
    setEditError('')
    setShowEditDialog(true)
  }

  async function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editName.trim()) { setEditError('姓名不能为空'); return }
    setEditLoading(true)
    setEditError('')
    try {
      const res = await fetch(`/api/kols/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: editName.trim(),
          douyinId: editDouyinId.trim() || null,
          douyinUrl: editDouyinUrl.trim() || null,
          tags: editTags.split(',').map((t) => t.trim()).filter(Boolean),
        }),
      })
      if (!res.ok) {
        const body = await res.json()
        setEditError(body.error ?? '保存失败')
        return
      }
      setShowEditDialog(false)
      load()
    } finally {
      setEditLoading(false)
    }
  }

  function addProduct(productId: string) {
    setRelatedProductIds((prev) => [...prev, productId])
    toast.success('已关联产品')
    setShowProductPicker(false)
  }

  if (loading) {
    return <div className="p-8 text-gray-400 text-sm">加载中…</div>
  }
  if (error || !kol) {
    return (
      <div className="p-8">
        <p className="text-red-500 text-sm">{error || '红人不存在'}</p>
        <Link href="/admin/kols" className="text-sm text-orange-500 hover:underline mt-2 inline-block">← 返回列表</Link>
      </div>
    )
  }

  const relatedProducts = allProducts.filter((p) => relatedProductIds.includes(p.id))
  const unrelatedProducts = allProducts.filter((p) => !relatedProductIds.includes(p.id))

  return (
    <div className="p-8">
      <Link href="/admin/kols" className="text-sm text-gray-400 hover:text-gray-600 transition mb-4 inline-block">
        ← 红人管理
      </Link>

      {/* 基础信息卡 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 mb-6 flex items-start gap-4">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-200 to-orange-400 flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
          {kol.name[0]}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-xl font-bold text-gray-900">{kol.name}</h1>
            {kol.douyinId && <span className="text-sm text-gray-400 font-mono">@{kol.douyinId}</span>}
          </div>
          <div className="flex flex-wrap gap-1.5 mt-2">
            {kol.tags.map((tag) => (
              <span key={tag} className="inline-block px-2 py-0.5 rounded text-xs bg-orange-50 text-orange-600 border border-orange-100">{tag}</span>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-2">负责人：{kol.owner.displayName}</p>
        </div>
        <button onClick={openEditDialog} className="px-3 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-600 hover:bg-gray-50 transition flex-shrink-0">
          编辑基础信息
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${
                activeTab === tab ? 'border-orange-400 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >{tab}</button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === '人格档案' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">人格档案</h2>
            <FileUploadButton accept=".md,.docx" onUpload={handleSoulUpload} />
          </div>
          {soulMd ? <MarkdownViewer content={soulMd} /> : <p className="text-sm text-gray-400 py-8 text-center">暂无人格档案，点击右上角上传</p>}
        </div>
      )}

      {activeTab === '内容规划' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">内容规划</h2>
            <FileUploadButton accept=".md,.docx" onUpload={handleContentPlanUpload} label="上传新版本" />
          </div>
          {contentPlanMd ? <MarkdownViewer content={contentPlanMd} /> : <p className="text-sm text-gray-400 py-8 text-center">暂无内容规划，点击右上角上传</p>}
        </div>
      )}

      {activeTab === '关联产品' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-700">关联产品</h2>
            <button onClick={() => setShowProductPicker(true)} className="px-3 py-1.5 rounded-lg text-white text-xs font-medium hover:opacity-90 transition" style={{ background: '#f59a23' }}>
              + 关联产品
            </button>
          </div>
          {relatedProducts.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">暂未关联任何产品</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {relatedProducts.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-3">
                  <div>
                    <Link href={`/admin/products/${p.id}`} className="text-sm font-medium text-gray-900 hover:text-orange-500 transition">{p.name}</Link>
                    <p className="text-xs text-gray-400 mt-0.5">{p.category} · ¥{p.price}</p>
                  </div>
                  <button onClick={() => setRelatedProductIds((prev) => prev.filter((pid) => pid !== p.id))} className="text-xs text-red-400 hover:underline">取消关联</button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === '素材库' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">素材库</h2>
          <div className="py-8 text-center text-gray-400 text-sm">
            <p>素材库功能将在 M3 阶段完善</p>
            <p className="text-xs mt-1">当前阶段仅展示入口</p>
          </div>
        </div>
      )}

      {activeTab === '历史版本' && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">历史版本</h2>
          {kol.profiles.length === 0 ? (
            <p className="text-sm text-gray-400 py-8 text-center">暂无版本记录</p>
          ) : (
            <div className="divide-y divide-gray-100">
              {[...kol.profiles].sort((a, b) => b.version - a.version).map((v) => (
                <div key={v.id}>
                  <div className="flex items-center justify-between py-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-medium text-gray-700">v{v.version}.0</span>
                        {v.isCurrent && <span className="text-xs text-orange-500 bg-orange-50 px-1.5 py-0.5 rounded">当前</span>}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatDate(v.createdAt)}{v.createdBy ? ` · ${v.createdBy.displayName}` : ''}
                      </p>
                    </div>
                    <button onClick={() => setPreviewVersionId(previewVersionId === v.id ? null : v.id)} className="text-xs text-blue-600 hover:underline">
                      {previewVersionId === v.id ? '收起' : '预览'}
                    </button>
                  </div>
                  {previewVersionId === v.id && (
                    <div className="bg-gray-50 rounded-lg p-4 mb-3">
                      <p className="text-xs text-gray-400 mb-3">v{v.version}.0 预览（只读）</p>
                      {v.soulMd && <><p className="text-xs font-medium text-gray-600 mb-1">人格档案</p><MarkdownViewer content={v.soulMd} /></>}
                      {v.contentPlanMd && <><p className="text-xs font-medium text-gray-600 mt-3 mb-1">内容规划</p><MarkdownViewer content={v.contentPlanMd} /></>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Edit basic info dialog */}
      {showEditDialog && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowEditDialog(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[440px] p-8" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-gray-900 mb-6">编辑基础信息</h2>
            <form onSubmit={handleEditSubmit} className="flex flex-col gap-4">
              <Field label="姓名" required>
                <input value={editName} onChange={(e) => setEditName(e.target.value)} required className="input-base" />
              </Field>
              <Field label="抖音ID">
                <input value={editDouyinId} onChange={(e) => setEditDouyinId(e.target.value)} placeholder="选填" className="input-base" />
              </Field>
              <Field label="抖音主页链接">
                <input value={editDouyinUrl} onChange={(e) => setEditDouyinUrl(e.target.value)} placeholder="选填" className="input-base" />
              </Field>
              <Field label="标签">
                <input value={editTags} onChange={(e) => setEditTags(e.target.value)} placeholder="多个标签用英文逗号分隔" className="input-base" />
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

      {/* Product picker modal */}
      {showProductPicker && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setShowProductPicker(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-[400px] p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-base font-bold text-gray-900 mb-4">选择要关联的产品</h3>
            {unrelatedProducts.length === 0 ? (
              <p className="text-sm text-gray-400 py-4 text-center">所有产品均已关联</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {unrelatedProducts.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-400">{p.category} · ¥{p.price}</p>
                    </div>
                    <button onClick={() => addProduct(p.id)} className="text-xs text-white px-2.5 py-1 rounded-lg hover:opacity-90 transition" style={{ background: '#f59a23' }}>关联</button>
                  </div>
                ))}
              </div>
            )}
            <button onClick={() => setShowProductPicker(false)} className="w-full mt-4 py-2 rounded-lg border border-gray-300 text-sm text-gray-600 hover:bg-gray-50 transition">关闭</button>
          </div>
        </div>
      )}

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
