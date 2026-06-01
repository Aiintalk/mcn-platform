import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'admin') redirect('/login')

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar displayName={session.user.displayName} />
      <main className="flex-1 overflow-auto bg-gray-50 text-gray-900">
        {children}
      </main>
    </div>
  )
}
