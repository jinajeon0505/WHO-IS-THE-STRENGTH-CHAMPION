'use client'

import { useRouter } from 'next/navigation'

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.replace('/admin/login')
    router.refresh()
  }

  return (
    <div className="min-h-dvh w-full bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏆</span>
          <span className="font-bold text-gray-900">임원 근력왕을 찾아라 · 관리자</span>
        </div>
        <button onClick={handleLogout} className="text-sm text-gray-400 hover:text-gray-600">
          로그아웃
        </button>
      </header>
      <main className="max-w-3xl mx-auto p-4 md:p-6">{children}</main>
    </div>
  )
}
