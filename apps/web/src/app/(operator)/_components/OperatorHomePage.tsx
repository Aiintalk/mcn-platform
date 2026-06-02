'use client'

import { useState, useMemo, useEffect } from 'react'
import Link from 'next/link'
import { fetchKols, ApiKolListItem } from '@/lib/api/kols'
import { fetchProducts, ApiProductListItem } from '@/lib/api/products'

export default function OperatorHomePage() {
  const [search, setSearch] = useState('')
  const [showDropdown, setShowDropdown] = useState(false)
  const [kols, setKols] = useState<ApiKolListItem[]>([])
  const [products, setProducts] = useState<ApiProductListItem[]>([])

  useEffect(() => {
    fetchKols({ status: 'active', pageSize: 100 }).then((r) => setKols(r.items)).catch(() => {})
    fetchProducts({ status: 'active', pageSize: 100 }).then((r) => setProducts(r.items)).catch(() => {})
  }, [])

  const searchResults = useMemo(() => {
    if (!search.trim()) return null
    const q = search.trim()
    const kolResults = kols
      .filter((k) => k.name.includes(q) || k.douyinId?.includes(q))
      .map((k) => ({ type: 'kol' as const, id: k.id, label: k.name, sub: k.douyinId ? `@${k.douyinId}` : '' }))
    const productResults = products
      .filter((p) => p.name.includes(q))
      .map((p) => ({ type: 'product' as const, id: p.id, label: p.name, sub: `${p.category ?? ''} · ¥${p.price}` }))
    return [...kolResults, ...productResults]
  }, [search, kols, products])

  return (
    <div className="p-8">
      {/* Header + Search */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">工作台</h1>
        <p className="text-sm text-gray-500 mb-5">查看红人档案与产品信息</p>
        <div className="relative max-w-md">
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setShowDropdown(true) }}
            onFocus={() => setShowDropdown(true)}
            onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
            placeholder="搜索红人姓名 / 抖音ID / 产品名…"
            className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-orange-400 focus:shadow-sm transition pr-10"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">🔍</span>

          {showDropdown && searchResults && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg z-10 overflow-hidden">
              {searchResults.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-400">无匹配结果</div>
              ) : (
                searchResults.map((item) => (
                  <Link
                    key={`${item.type}-${item.id}`}
                    href={`/${item.type === 'kol' ? 'kols' : 'products'}/${item.id}`}
                    target="_blank"
                    className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 transition border-b border-gray-100 last:border-b-0"
                    onClick={() => setShowDropdown(false)}
                  >
                    <span className="text-base">{item.type === 'kol' ? '🌟' : '📦'}</span>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{item.label}</p>
                      <p className="text-xs text-gray-400">{item.sub}</p>
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* KOL cards */}
      <section className="mb-8">
        <h2 className="text-base font-semibold text-gray-800 mb-4">红人档案</h2>
        {kols.length === 0 ? (
          <p className="text-sm text-gray-400">加载中…</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {kols.map((kol) => (
              <Link
                key={kol.id}
                href={`/kols/${kol.id}`}
                target="_blank"
                className="bg-white rounded-xl border border-gray-200 p-4 hover:border-orange-300 hover:shadow-sm transition group text-center"
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-200 to-orange-400 flex items-center justify-center text-white font-bold text-xl mx-auto mb-3 group-hover:scale-105 transition-transform">
                  {kol.name[0]}
                </div>
                <p className="font-semibold text-gray-900 text-sm">{kol.name}</p>
                {kol.douyinId && <p className="text-xs text-gray-400 mt-0.5">@{kol.douyinId}</p>}
                <div className="flex flex-wrap justify-center gap-1 mt-2">
                  {kol.tags.slice(0, 2).map((tag) => (
                    <span key={tag} className="inline-block px-1.5 py-0.5 rounded text-xs bg-orange-50 text-orange-500">{tag}</span>
                  ))}
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Product cards */}
      <section>
        <h2 className="text-base font-semibold text-gray-800 mb-4">产品列表</h2>
        {products.length === 0 ? (
          <p className="text-sm text-gray-400">加载中…</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/products/${product.id}`}
                target="_blank"
                className="bg-white rounded-xl border border-gray-200 p-4 hover:border-orange-300 hover:shadow-sm transition group"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center text-blue-400 text-xl mb-3">📦</div>
                <p className="font-semibold text-gray-900 text-sm">{product.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{product.category ?? ''} · ¥{product.price}</p>
                <div className="mt-2 flex items-center gap-1">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 inline-block" />
                  <span className="text-xs text-green-600">在售</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
