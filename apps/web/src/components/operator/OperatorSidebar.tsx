'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'

const toolGroups = [
  {
    label: '✍️ 人设内容规划',
    tools: [
      { href: '/tools/kol-intake', label: '红人信息采集助手' },
      { href: '/tools/benchmark-analyzer', label: '对标分析助手' },
      { href: '/tools/persona-positioning', label: '人设定位助手' },
    ],
  },
  {
    label: '💰 千川',
    tools: [
      { href: '/tools/selling-point-extractor', label: '产品卖点提取器' },
      { href: '/tools/qianchuan-collection', label: '千川爆文合集' },
      { href: '/tools/qianchuan-writer', label: '千川脚本仿写助手' },
      { href: '/tools/qianchuan-review', label: '千川脚本复盘助手' },
    ],
  },
  {
    label: '✏️ 内容仿写',
    tools: [
      { href: '/tools/persona-writer', label: '人设脚本仿写助手' },
      { href: '/tools/livestream-writer', label: '直播间脚本仿写助手' },
      { href: '/tools/tiktok-writer', label: 'TikTok 脚本仿写助手' },
    ],
  },
  {
    label: '📋 复盘工具',
    tools: [
      { href: '/tools/persona-review', label: '人设脚本复盘助手' },
      { href: '/tools/livestream-review', label: '直播间脚本复盘助手' },
      { href: '/tools/tiktok-review', label: 'TikTok 脚本复盘助手' },
    ],
  },
  {
    label: '🔍 内容提取',
    tools: [
      { href: '/tools/subtitle-extractor', label: '短视频字幕提取' },
    ],
  },
  {
    label: '🗂 素材管理',
    tools: [
      { href: '/tools/material-library', label: '素材库' },
    ],
  },
]

export default function OperatorSidebar({ displayName }: { displayName: string }) {
  const pathname = usePathname()

  return (
    <aside className="w-52 flex-shrink-0 border-r border-gray-200 bg-white flex flex-col text-sm overflow-y-auto">
      {/* Logo */}
      <div className="px-5 py-4 border-b border-gray-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ background: '#f59a23' }}>达</div>
          <span className="font-semibold text-gray-800 text-sm">达人说 AI 工具箱</span>
        </div>
      </div>

      {/* Home */}
      <nav className="px-3 pt-3 flex-shrink-0">
        <Link
          href="/"
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg transition-colors',
            pathname === '/'
              ? 'bg-orange-50 text-orange-600 border-l-2 border-orange-400'
              : 'text-gray-700 hover:bg-gray-100'
          )}
        >
          🏠 工作台首页
        </Link>
      </nav>

      {/* Tool groups */}
      <nav className="flex-1 px-3 py-2 space-y-0.5">
        {toolGroups.map((group) => (
          <div key={group.label}>
            <div className="px-3 pt-3 pb-1 text-xs text-gray-400 font-medium">{group.label}</div>
            {group.tools.map((tool) => {
              const active = pathname.startsWith(tool.href)
              return (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className={cn(
                    'flex items-center px-3 py-1.5 rounded-lg transition-colors text-xs',
                    active
                      ? 'bg-orange-50 text-orange-600 border-l-2 border-orange-400 font-medium'
                      : 'text-gray-600 hover:bg-gray-100'
                  )}
                >
                  {tool.label}
                </Link>
              )
            })}
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between flex-shrink-0">
        <span className="text-xs text-gray-500">{displayName}</span>
        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="text-xs text-gray-400 hover:text-gray-700 transition-colors"
        >
          退出
        </button>
      </div>
    </aside>
  )
}
