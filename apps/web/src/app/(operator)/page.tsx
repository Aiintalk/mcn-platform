import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import OperatorHomePage from './_components/OperatorHomePage'

export default async function OperatorPage() {
  const session = await getServerSession(authOptions)
  if (session?.user.role === 'admin') redirect('/admin')

  return <OperatorHomePage />
}
