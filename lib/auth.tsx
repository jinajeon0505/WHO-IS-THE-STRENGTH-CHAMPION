'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, Voter } from './supabase'

type LoginParams = { company: string; department: string; name: string }

type AuthContextType = {
  voter: Voter | null
  loading: boolean
  login: (params: LoginParams) => Promise<{ error: string | null }>
  logout: () => void
}

const AuthContext = createContext<AuthContextType>({
  voter: null,
  loading: true,
  login: async () => ({ error: null }),
  logout: () => {},
})

const STORAGE_KEY = 'strength_king_voter'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [voter, setVoter] = useState<Voter | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- restoring session from localStorage on mount, no external subscription to move this into
      try { setVoter(JSON.parse(stored)) } catch {}
    }
    setLoading(false)
  }, [])

  const login = async ({ company, department, name }: LoginParams): Promise<{ error: string | null }> => {
    const c = company.trim()
    const d = department.trim()
    const n = name.trim()
    if (!c || !d || !n) return { error: '회사, 부서, 이름을 모두 입력해주세요.' }

    const { data: existing } = await supabase
      .from('voters')
      .select('*')
      .eq('company', c)
      .eq('department', d)
      .eq('name', n)
      .maybeSingle()

    if (existing) {
      setVoter(existing)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(existing))
      return { error: null }
    }

    const { data: created, error } = await supabase
      .from('voters')
      .insert({ company: c, department: d, name: n })
      .select('*')
      .single()

    if (error || !created) return { error: '등록에 실패했습니다. 다시 시도해주세요.' }

    setVoter(created)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(created))
    return { error: null }
  }

  const logout = () => {
    setVoter(null)
    localStorage.removeItem(STORAGE_KEY)
  }

  return (
    <AuthContext.Provider value={{ voter, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
