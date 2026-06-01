import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'MCN 内容运营平台',
  description: 'MCN 内容运营一站式 AI 工作平台',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  )
}
