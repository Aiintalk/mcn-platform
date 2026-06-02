'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { fetchKol, ApiKolDetail, ApiKolProfile } from '@/lib/api/kols'
import MarkdownViewer from '@/components/MarkdownViewer'

const TABS = ['人格档案', '内容规划'] as const
type Tab = typeof TABS[number]

export default function OperatorKolDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [kol, setKol] = useState<ApiKolDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTab, setActiveTab] = useState<Tab>('人格档案')

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setKol(await fetchKol(id))
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { load() }, [load])

  if (loading) return <div className="p-8 text-gray-400 text-sm">加载中…</div>
  if (error || !kol) {
    return (
      <div className="p-8">
        <p className="text-red-500 text-sm">{error || '红人不存在'}</p>
        <Link href="/" className="text-sm text-orange-500 hover:underline mt-2 inline-block">← 返回工作台</Link>
      </div>
    )
  }

  const currentProfile: ApiKolProfile | undefined = kol.profiles.find((p) => p.isCurrent)

  return (
    <div className="p-8">
      <Link href="/" className="text-sm text-gray-400 hover:text-gray-600 transition mb-4 inline-block">
        ← 工作台
      </Link>

      {/* 基础信息卡（只读，无编辑按钮） */}
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
      </div>

      {/* Only 2 tabs for operator */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex gap-1">
          {TABS.map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium transition border-b-2 -mb-px ${activeTab === tab ? 'border-orange-400 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
            >{tab}</button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 p-6">
        {activeTab === '人格档案' && (
          currentProfile?.soulMd
            ? <MarkdownViewer content={currentProfile.soulMd} />
            : <p className="text-sm text-gray-400 py-8 text-center">暂无人格档案</p>
        )}
        {activeTab === '内容规划' && (
          currentProfile?.contentPlanMd
            ? <MarkdownViewer content={currentProfile.contentPlanMd} />
            : <p className="text-sm text-gray-400 py-8 text-center">暂无内容规划</p>
        )}
      </div>
    </div>
  )
}
