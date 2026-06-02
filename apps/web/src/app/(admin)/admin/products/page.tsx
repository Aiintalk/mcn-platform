'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { fetchProducts, updateProduct, ApiProductListItem } from '@/lib/api/products'
import { formatDate } from '@/lib/utils'
import StatusBadge from '@/components/StatusBadge'
import ConfirmDialog from '@/components/ConfirmDialog'

const CATEGORY_OPTIONS = ['护肤', '保健', '彩妆', '食品']

export default function AdminProductsPage() {
  const router = useRouter()
  const [products, setProducts] = useState<ApiProductListItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 20
  const [archiveTarget, setArchiveTarget] = useState<ApiProductListItem | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetchProducts({
        page,
        pageSize,
        status: statusFilter || undefined,
        category: categoryFilter || undefined,
        q: search.trim() || undefined,
      })
      setProducts(res.items)
      setTotal(res.total)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, statusFilter, categoryFilter, search])

  useEffect(() => { load() }, [load])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  async function handleArchive() {
    if (!archiveTarget) return
    await updateProduct(archiveTarget.id, { status: 'archived' })
    load()
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">产品管理</h1>
          <p className="text-sm text-gray-500 mt-1">共 {total} 件产品</p>
        </div>
        <Link href="/admin/products/new" className="px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 transition" style={{ background: '#f59a23' }}>
          + 新建产品
        </Link>
      </div>

      <div className="flex gap-3 mb-5">
        <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }} className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400">
          <option value="">全部状态</option>
          <option value="active">在售</option>
          <option value="archived">已归档</option>
        </select>
        <select value={categoryFilter} onChange={(e) => { setCategoryFilter(e.target.value); setPage(1) }} className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400">
          <option value="">全部品类</option>
          {CATEGORY_OPTIONS.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        <input
          type="text"
          placeholder="搜索产品名"
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400 w-52"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">产品名</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">品类</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">价格</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">目标受众</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">状态</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">更新时间</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={7} className="text-center py-12 text-gray-400">加载中…</td></tr>}
            {!loading && error && <tr><td colSpan={7} className="text-center py-12 text-red-400 text-sm">{error}</td></tr>}
            {!loading && !error && products.length === 0 && <tr><td colSpan={7} className="text-center py-12 text-gray-400">暂无数据</td></tr>}
            {!loading && products.map((product) => (
              <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer" onClick={() => router.push(`/admin/products/${product.id}`)}>
                <td className="px-4 py-3 font-medium text-gray-900">{product.name}</td>
                <td className="px-4 py-3">
                  {product.category && <span className="inline-block px-2 py-0.5 rounded text-xs bg-blue-50 text-blue-600 border border-blue-100">{product.category}</span>}
                </td>
                <td className="px-4 py-3 text-gray-700 font-medium">¥{product.price}</td>
                <td className="px-4 py-3 text-gray-500 text-xs">{product.targetAudience ?? '—'}</td>
                <td className="px-4 py-3"><StatusBadge status={product.status} /></td>
                <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(product.updatedAt)}</td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/products/${product.id}`} className="text-xs text-blue-600 hover:underline">编辑</Link>
                    {product.status === 'active' && (
                      <button onClick={() => setArchiveTarget(product)} className="text-xs text-gray-500 hover:underline">归档</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between mt-4 text-sm text-gray-500">
        <span>共 {total} 条</span>
        <div className="flex items-center gap-1">
          <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40">&lt;</button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
            return <button key={p} onClick={() => setPage(p)} className={`px-2.5 py-1 rounded border text-xs ${p === page ? 'border-orange-400 text-orange-600 font-medium' : 'border-gray-200 hover:bg-gray-50'}`}>{p}</button>
          })}
          <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40">&gt;</button>
        </div>
      </div>

      <ConfirmDialog
        open={!!archiveTarget}
        onOpenChange={(open) => { if (!open) setArchiveTarget(null) }}
        title="确认归档"
        description={`归档后「${archiveTarget?.name}」将不再出现在默认列表，可通过状态筛选找回。`}
        confirmLabel="确认归档"
        variant="destructive"
        onConfirm={handleArchive}
      />
    </div>
  )
}
