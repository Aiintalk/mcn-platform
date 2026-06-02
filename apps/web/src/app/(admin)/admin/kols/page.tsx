'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { fetchKols, archiveKol, ApiKolListItem } from '@/lib/api/kols'
import { formatDate } from '@/lib/utils'
import StatusBadge from '@/components/StatusBadge'
import ConfirmDialog from '@/components/ConfirmDialog'

type Owner = { id: string; displayName: string }

export default function AdminKolsPage() {
  const router = useRouter()
  const [kols, setKols] = useState<ApiKolListItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [ownerFilter, setOwnerFilter] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const pageSize = 20
  const [archiveTarget, setArchiveTarget] = useState<ApiKolListItem | null>(null)

  const owners = useMemo<Owner[]>(() => {
    const seen = new Map<string, string>()
    for (const k of kols) seen.set(k.owner.id, k.owner.displayName)
    return [...seen.entries()].map(([id, displayName]) => ({ id, displayName }))
  }, [kols])

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetchKols({
        page,
        pageSize,
        status: statusFilter || undefined,
        ownerId: ownerFilter || undefined,
      })
      setKols(res.items)
      setTotal(res.total)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [page, pageSize, statusFilter, ownerFilter])

  useEffect(() => { load() }, [load])

  // Client-side name search (API supports tag filter but not name search directly)
  const filtered = useMemo(() =>
    search
      ? kols.filter((k) => k.name.includes(search) || k.douyinId?.includes(search))
      : kols
  , [kols, search])

  const totalPages = Math.max(1, Math.ceil(total / pageSize))

  async function handleArchive() {
    if (!archiveTarget) return
    await archiveKol(archiveTarget.id)
    load()
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">红人管理</h1>
          <p className="text-sm text-gray-500 mt-1">共 {total} 位红人</p>
        </div>
        <Link
          href="/admin/kols/new"
          className="px-4 py-2 rounded-lg text-white text-sm font-medium hover:opacity-90 transition"
          style={{ background: '#f59a23' }}
        >
          + 新建红人
        </Link>
      </div>

      <div className="flex gap-3 mb-5">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400"
        >
          <option value="">全部状态</option>
          <option value="active">在售</option>
          <option value="archived">已归档</option>
        </select>
        <select
          value={ownerFilter}
          onChange={(e) => { setOwnerFilter(e.target.value); setPage(1) }}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400"
        >
          <option value="">全部负责人</option>
          {owners.map((o) => <option key={o.id} value={o.id}>{o.displayName}</option>)}
        </select>
        <input
          type="text"
          placeholder="搜索姓名 / 抖音ID"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-orange-400 w-52"
        />
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">头像</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">姓名</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">抖音ID</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">标签</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">负责人</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">状态</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">更新时间</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500">操作</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={8} className="text-center py-12 text-gray-400">加载中…</td></tr>
            )}
            {!loading && error && (
              <tr><td colSpan={8} className="text-center py-12 text-red-400 text-sm">{error}</td></tr>
            )}
            {!loading && !error && filtered.length === 0 && (
              <tr><td colSpan={8} className="text-center py-12 text-gray-400">暂无数据</td></tr>
            )}
            {!loading && filtered.map((kol) => (
              <tr
                key={kol.id}
                className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                onClick={() => router.push(`/admin/kols/${kol.id}`)}
              >
                <td className="px-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-200 to-orange-400 flex items-center justify-center text-white font-bold text-xs">
                    {kol.name[0]}
                  </div>
                </td>
                <td className="px-4 py-3 font-medium text-gray-900">{kol.name}</td>
                <td className="px-4 py-3 text-gray-500 font-mono text-xs">
                  {kol.douyinId ? `@${kol.douyinId}` : '—'}
                </td>
                <td className="px-4 py-3"><TagList tags={kol.tags} /></td>
                <td className="px-4 py-3 text-gray-600">{kol.owner.displayName}</td>
                <td className="px-4 py-3"><StatusBadge status={kol.status} /></td>
                <td className="px-4 py-3 text-gray-400 text-xs">{formatDate(kol.updatedAt)}</td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center gap-2">
                    <Link href={`/admin/kols/${kol.id}`} className="text-xs text-blue-600 hover:underline">编辑</Link>
                    {kol.status === 'active' && (
                      <button onClick={() => setArchiveTarget(kol)} className="text-xs text-gray-500 hover:underline">归档</button>
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
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
          >&lt;</button>
          {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
            const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i
            return (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`px-2.5 py-1 rounded border text-xs ${p === page ? 'border-orange-400 text-orange-600 font-medium' : 'border-gray-200 hover:bg-gray-50'}`}
              >{p}</button>
            )
          })}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-2 py-1 rounded border border-gray-200 hover:bg-gray-50 disabled:opacity-40"
          >&gt;</button>
        </div>
      </div>

      <ConfirmDialog
        open={!!archiveTarget}
        onOpenChange={(open) => { if (!open) setArchiveTarget(null) }}
        title="确认归档"
        description={`归档后「${archiveTarget?.name}」将不再出现在默认列表中，可通过状态筛选找回。`}
        confirmLabel="确认归档"
        variant="destructive"
        onConfirm={handleArchive}
      />
    </div>
  )
}

function TagList({ tags }: { tags: string[] }) {
  const MAX = 3
  const visible = tags.slice(0, MAX)
  const rest = tags.length - MAX
  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((tag) => (
        <span key={tag} className="inline-block px-1.5 py-0.5 rounded text-xs bg-orange-50 text-orange-600 border border-orange-100">{tag}</span>
      ))}
      {rest > 0 && (
        <span className="inline-block px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-500">+{rest}</span>
      )}
    </div>
  )
}
