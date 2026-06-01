'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/admin', label: '📊 项目看板', exact: true },
  { href: '/admin/users', label: '👥 用户管理' },
  { href: '/admin/kols', label: '🌟 红人管理' },
  { href: '/admin/products', label: '📦 产品管理' },
  { href: '/admin/viral-scripts', label: '🔥 爆款库管理' },
]

export default function AdminSidebar({ displayName }: { displayName: string }) {
  const pathname = usePathname()

  return (
    <aside className="w-52 flex-shrink-0 bg-gray-900 flex flex-col text-sm">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: '#f59a23' }}>达</div>
          <span className="font-semibold text-gray-100 text-sm">达人说 · 管理后台</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href)
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
                active
                  ? 'bg-gray-700 text-white border-l-2 border-orange-400'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              )}
            >
              {item.label}
            </Link>
          )
        })}

        <div className="pt-4 pb-1 px-3 text-xs text-gray-600 uppercase tracking-wide">工具箱</div>
        <Link href="/" className="flex items-center gap-2 px-3 py-2 rounded-lg text-gray-400 hover:bg-gray-800 hover:text-gray-200 transition-colors">
          🛠 切换到运营视角
        </Link>
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-gray-700 flex items-center justify-between">
        <span className="text-xs text-gray-500">{displayName}（管理员）</span>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="text-xs text-gray-600 hover:text-gray-300 transition-colors"
        >
          退出
        </button>
      </div>
    </aside>
  )
}
