'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'

function LoginForm() {
  const [company, setCompany] = useState('')
  const [department, setDepartment] = useState('')
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await login({ company, department, name })
    setLoading(false)
    if (result.error) { setError(result.error); return }
    router.replace('/vote')
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-6 w-full space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">회사</label>
        <input
          value={company}
          onChange={e => setCompany(e.target.value)}
          placeholder="예: 헥토"
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">부서</label>
        <input
          value={department}
          onChange={e => setDepartment(e.target.value)}
          placeholder="00팀 또는 00실"
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">이름</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="이름을 입력하세요"
          className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-orange-300 text-white font-semibold py-2.5 rounded-lg transition-colors"
      >
        {loading ? '확인 중...' : '투표하러 가기'}
      </button>
    </form>
  )
}

export default function HomePage() {
  const { voter, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && voter) router.replace('/vote')
  }, [voter, loading, router])

  return (
    <div className="min-h-dvh w-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center text-white">
          <p className="text-xs font-semibold tracking-wide mb-2">7월 특별 이벤트 · 신체나이 한 살 빼기 챌린지</p>
          <div className="text-5xl mb-3">🏆</div>
          <h1 className="text-2xl font-bold">임원 근력왕을 찾아라!</h1>
          <div className="text-sm text-white/90 mt-3 leading-relaxed space-y-1">
            <p>누가 헥토 최고의 임원 근력왕일까요?</p>
            <p>실제 나이보다 근력나이가 가장 젊을 것 같은 임원 1명에게 투표해주세요!</p>
            <p className="text-white/80 text-xs pt-1">근력왕을 맞추신 분들 중 추첨을 통해 20분께 소정의 상품을 드립니다~!</p>
          </div>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
