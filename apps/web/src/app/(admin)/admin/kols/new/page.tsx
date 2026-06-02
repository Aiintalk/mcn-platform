'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createKol } from '@/lib/api/kols'
import TagInput from '@/components/TagInput'

type User = { id: string; displayName: string; role: string; status: string }

export default function NewKolPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [douyinId, setDouyinId] = useState('')
  const [douyinUrl, setDouyinUrl] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [ownerId, setOwnerId] = useState('')
  const [soulMd, setSoulMd] = useState('')
  const [contentPlanMd, setContentPlanMd] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [users, setUsers] = useState<User[]>([])

  // Fetch admin users for owner dropdown
  useEffect(() => {
    fetch('/api/users?role=admin&status=active&pageSize=100')
      .then((r) => r.json())
      .then((body) => setUsers(body.data?.items ?? []))
      .catch(() => {/* non-critical, select stays empty */})
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('姓名为必填项'); return }
    setLoading(true)
    setError('')
    try {
      const kol = await createKol({
        name: name.trim(),
        douyinId: douyinId.trim() || undefined,
        douyinUrl: douyinUrl.trim() || undefined,
        tags,
        ownerId: ownerId || undefined,
      })
      // If initial markdown content is provided, upload profile
      if (soulMd.trim() || contentPlanMd.trim()) {
        await fetch(`/api/kols/${kol.id}/upload-profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            soulMd: soulMd.trim() || undefined,
            contentPlanMd: contentPlanMd.trim() || undefined,
          }),
        })
      }
      router.push(`/admin/kols/${kol.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : '创建失败')
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/admin/kols" className="text-sm text-gray-400 hover:text-gray-600 transition">
          ← 红人管理
        </Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-700">新建红人</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">新建红人</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-5">
        <Field label="姓名" required>
          <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="红人真实姓名或艺名" className="input-base" />
        </Field>

        <Field label="抖音 ID">
          <input value={douyinId} onChange={(e) => setDouyinId(e.target.value)} placeholder="不含 @" className="input-base" />
        </Field>

        <Field label="抖音主页链接">
          <input value={douyinUrl} onChange={(e) => setDouyinUrl(e.target.value)} placeholder="https://www.douyin.com/user/..." className="input-base" />
        </Field>

        <Field label="人设标签">
          <TagInput value={tags} onChange={setTags} placeholder="输入后按 Enter 添加，如：美妆、情感" />
        </Field>

        <Field label="负责人">
          <select value={ownerId} onChange={(e) => setOwnerId(e.target.value)} className="input-base">
            <option value="">请选择（默认为当前登录用户）</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.displayName}</option>
            ))}
          </select>
        </Field>

        <Field label="人格档案（Markdown，可选）">
          <textarea value={soulMd} onChange={(e) => setSoulMd(e.target.value)} placeholder="粘贴或输入人格档案 Markdown 内容…" rows={6} className="input-base resize-y" />
        </Field>

        <Field label="内容规划（Markdown，可选）">
          <textarea value={contentPlanMd} onChange={(e) => setContentPlanMd(e.target.value)} placeholder="粘贴或输入内容规划 Markdown 内容…" rows={6} className="input-base resize-y" />
        </Field>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Link href="/admin/kols" className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition text-center">
            取消
          </Link>
          <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-lg text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-60" style={{ background: '#f59a23' }}>
            {loading ? '创建中…' : '创建红人'}
          </button>
        </div>
      </form>

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
      <label className="block text-xs text-gray-500 mb-1.5">
        {label}{required && <span className="text-red-400 ml-0.5">*</span>}
      </label>
      {children}
    </div>
  )
}
