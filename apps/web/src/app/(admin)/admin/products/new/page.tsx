'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createProduct } from '@/lib/api/products'

const CATEGORIES = ['护肤', '保健', '彩妆', '食品', '其他']

export default function NewProductPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [price, setPrice] = useState('')
  const [targetAudience, setTargetAudience] = useState('')
  const [scenario, setScenario] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('产品名为必填项'); return }
    const priceNum = Number(price)
    if (price && (isNaN(priceNum) || priceNum < 0)) { setError('请输入有效价格'); return }
    setLoading(true)
    setError('')
    try {
      const product = await createProduct({
        name: name.trim(),
        category: category || undefined,
        price: price ? priceNum : undefined,
        targetAudience: targetAudience.trim() || undefined,
        scenario: scenario.trim() || undefined,
      })
      router.push(`/admin/products/${product.id}`)
    } catch (e) {
      setError(e instanceof Error ? e.message : '创建失败')
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-2 mb-6">
        <Link href="/admin/products" className="text-sm text-gray-400 hover:text-gray-600 transition">← 产品管理</Link>
        <span className="text-gray-300">/</span>
        <span className="text-sm text-gray-700">新建产品</span>
      </div>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">新建产品</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 flex flex-col gap-5">
        <Field label="产品名" required>
          <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="产品正式名称" className="input-base" />
        </Field>
        <Field label="品类">
          <select value={category} onChange={(e) => setCategory(e.target.value)} className="input-base">
            {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>
        <Field label="价格（元）">
          <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} min="0" step="0.01" placeholder="0.00" className="input-base" />
        </Field>
        <Field label="目标受众">
          <input value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)} placeholder="如：25-35 岁女性护肤爱好者" className="input-base" />
        </Field>
        <Field label="使用场景">
          <input value={scenario} onChange={(e) => setScenario(e.target.value)} placeholder="如：日常护肤、户外运动" className="input-base" />
        </Field>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <div className="flex gap-3 pt-2">
          <Link href="/admin/products" className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition text-center">取消</Link>
          <button type="submit" disabled={loading} className="flex-1 py-2.5 rounded-lg text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-60" style={{ background: '#f59a23' }}>
            {loading ? '创建中…' : '创建产品'}
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
      <label className="block text-xs text-gray-500 mb-1.5">{label}{required && <span className="text-red-400 ml-0.5">*</span>}</label>
      {children}
    </div>
  )
}
