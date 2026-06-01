import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'

// 根路由：admin 跳管理后台，operator 由 (operator)/page.tsx 渲染
export default async function RootPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')
  if (session.user.role === 'admin') redirect('/admin')
  // operator 继续渲染，由 (operator)/layout.tsx 包裹
  return null
}
