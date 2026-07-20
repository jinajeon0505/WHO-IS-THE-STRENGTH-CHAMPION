'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth'
import { supabase, Candidate } from '@/lib/supabase'

export default function VotePage() {
  const { voter, loading: authLoading, logout } = useAuth()
  const router = useRouter()

  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [myVoteCandidateId, setMyVoteCandidateId] = useState<string | null>(null)
  const [selected, setSelected] = useState<string | null>(null)
  const [participantCount, setParticipantCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  const fetchAll = async (voterId: string) => {
    const [candidatesRes, myVoteRes, countRes] = await Promise.all([
      supabase.from('candidates').select('*').eq('is_active', true).order('display_order'),
      supabase.from('votes').select('candidate_id').eq('voter_id', voterId).maybeSingle(),
      supabase.from('votes').select('*', { count: 'exact', head: true }),
    ])
    setCandidates(candidatesRes.data || [])
    setMyVoteCandidateId(myVoteRes.data?.candidate_id ?? null)
    setSelected(myVoteRes.data?.candidate_id ?? null)
    setParticipantCount(countRes.count ?? 0)
    setLoading(false)
  }

  useEffect(() => {
    if (authLoading) return
    if (!voter) { router.replace('/'); return }
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data load, no external subscription to move this into
    fetchAll(voter.id)

    const channel = supabase
      .channel('votes_count')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'votes' }, () => {
        setParticipantCount(c => c + 1)
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [voter, authLoading, router])

  const submitVote = async () => {
    if (!selected || !voter) return
    setSaving(true)
    setMessage('')
    const { error } = await supabase
      .from('votes')
      .upsert(
        { voter_id: voter.id, candidate_id: selected, updated_at: new Date().toISOString() },
        { onConflict: 'voter_id' }
      )
    setSaving(false)
    if (error) {
      setMessage('투표 처리에 실패했습니다. 다시 시도해주세요.')
      return
    }
    setMyVoteCandidateId(selected)
    const name = candidates.find(c => c.id === selected)?.name
    setMessage(`${name}님에게 투표했습니다! 투표는 언제든 변경할 수 있어요.`)
  }

  if (authLoading || loading || !voter) return (
    <div className="min-h-dvh flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500" />
    </div>
  )

  const hasChanges = selected !== myVoteCandidateId

  return (
    <div className="min-h-dvh bg-gray-50">
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">🏆</span>
          <span className="font-bold text-gray-900">임원 근력왕을 찾아라</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-600">{voter.name}님</span>
          <button
            onClick={() => { logout(); router.replace('/') }}
            className="text-sm text-gray-400 hover:text-gray-600"
          >
            로그아웃
          </button>
        </div>
      </header>

      <main className="max-w-lg mx-auto w-full px-4 py-6 space-y-4 pb-28">
        <div className="-mx-4 -mt-6 bg-gradient-to-br from-amber-400 to-orange-500 px-5 pt-6 pb-5">
          <p className="text-xs text-white/80 mb-1 font-medium">7월 특별 이벤트</p>
          <h1 className="text-2xl font-bold text-white mb-2">🏆 임원 근력왕을 찾아라</h1>
          <p className="text-sm text-white/90 leading-relaxed">
            우리 회사 임원들의 아웃바디 근력검사 결과, 실제 나이 대비<br />
            근력나이가 가장 어리게 나올 것 같은 분에게 투표해주세요!
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 shadow-sm flex items-center justify-between">
          <span className="text-sm font-semibold text-gray-900">👥 현재 참여 인원</span>
          <span className="text-lg font-bold text-orange-500">{participantCount}명</span>
        </div>

        {candidates.length === 0 ? (
          <div className="bg-white rounded-2xl p-6 shadow-sm text-center text-sm text-gray-400">
            아직 등록된 후보가 없습니다. 곧 공개될 예정이에요!
          </div>
        ) : (
          <div className="grid grid-cols-5 gap-1.5">
            {candidates.map(c => {
              const isSelected = selected === c.id
              const isMyVote = myVoteCandidateId === c.id
              return (
                <button
                  key={c.id}
                  onClick={() => setSelected(c.id)}
                  className={`relative bg-white rounded-lg p-1 shadow-sm text-left transition-all border-2 ${
                    isSelected ? 'border-orange-500' : 'border-transparent'
                  }`}
                >
                  {isMyVote && (
                    <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 flex items-center justify-center text-[8px] font-bold bg-orange-500 text-white rounded-full leading-none">
                      ✓
                    </span>
                  )}
                  <div className="w-full aspect-square rounded-md bg-gray-100 overflow-hidden mb-1 flex items-center justify-center">
                    {c.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.photo_url} alt={c.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-lg">💪</span>
                    )}
                  </div>
                  <p className="text-xs font-bold text-gray-900 truncate text-center">{c.name}</p>
                  {c.title && <p className="text-[10px] text-gray-500 truncate text-center">{c.title}</p>}
                  {c.company && <p className="text-[10px] text-gray-400 truncate text-center">{c.company}</p>}
                </button>
              )
            })}
          </div>
        )}

        {message && (
          <p className="text-sm text-green-600 bg-green-50 rounded-lg px-3 py-2">{message}</p>
        )}
      </main>

      {candidates.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 px-4 pb-4 pt-2 bg-gradient-to-t from-gray-50 via-gray-50">
          <div className="max-w-lg mx-auto">
            <button
              onClick={submitVote}
              disabled={!selected || !hasChanges || saving}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white font-semibold py-3.5 rounded-2xl shadow-lg transition-colors"
            >
              {saving ? '처리 중...' : myVoteCandidateId ? (hasChanges ? '투표 변경하기' : '투표 완료') : '투표하기'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
