import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { adminSessionToken } from '@/lib/admin-session'
import AdminShell from './admin-shell'

export default async function ProtectedAdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies()
  const session = cookieStore.get('admin_session')?.value

  if (!process.env.ADMIN_PASSWORD || session !== adminSessionToken()) {
    redirect('/admin/login')
  }

  return <AdminShell>{children}</AdminShell>
}
