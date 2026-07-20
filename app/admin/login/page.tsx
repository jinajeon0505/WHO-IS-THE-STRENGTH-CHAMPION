'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginPage() {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const res = await fetch('/api/admin/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    setLoading(false)
    if (!res.ok) {
      const data = await res.json()
      setError(data.error || '로그인에 실패했습니다.')
      return
    }
    router.replace('/admin')
    router.refresh()
  }

  return (
    <div className="min-h-dvh w-full flex items-center justify-center px-4 bg-gray-50">
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm space-y-4">
        <div className="text-center mb-2">
          <div className="text-4xl mb-2">🔒</div>
          <h1 className="text-xl font-bold text-gray-900">관리자 로그인</h1>
          <p className="text-sm text-gray-400 mt-1">임원 근력왕을 찾아라</p>
        </div>
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="관리자 비밀번호"
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          autoFocus
        />
        {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
        <button
          type="submit"
          disabled={loading || !password}
          className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-semibold py-2.5 rounded-lg transition-colors"
        >
          {loading ? '확인 중...' : '로그인'}
        </button>
      </form>
    </div>
  )
}
