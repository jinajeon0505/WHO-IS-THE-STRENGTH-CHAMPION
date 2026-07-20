import { createAdminClient } from '@/lib/supabase-admin'
import { Candidate } from '@/lib/supabase'
import { addCandidate, updateCandidate, updateCandidatePhoto, toggleActive, deleteCandidate, moveOrder } from './actions'
import { ConfirmDeleteForm } from './confirm-delete-form'

export default async function AdminExecutiveVotePage() {
  const supabase = createAdminClient()
  const [candidatesRes, votesRes] = await Promise.all([
    supabase.from('candidates').select('*').order('display_order'),
    supabase.from('votes').select('candidate_id'),
  ])

  const candidates = (candidatesRes.data || []) as Candidate[]
  const voteCounts: Record<string, number> = {}
  for (const v of votesRes.data || []) {
    voteCounts[v.candidate_id] = (voteCounts[v.candidate_id] || 0) + 1
  }
  const totalVotes = (votesRes.data || []).length
  const ranked = [...candidates].sort((a, b) => (voteCounts[b.id] || 0) - (voteCounts[a.id] || 0))
  const topCount = ranked.length > 0 ? (voteCounts[ranked[0].id] || 0) : 0

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-gray-900">🏆 임원 근력왕을 찾아라</h1>

      {/* 투표 현황 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">투표 현황</h2>
          <span className="text-sm text-gray-500">총 <span className="font-bold text-gray-900">{totalVotes}</span>표</span>
        </div>
        {ranked.length === 0 && <p className="text-sm text-gray-400">등록된 후보가 없습니다.</p>}
        <ul className="space-y-3">
          {ranked.map(c => {
            const count = voteCounts[c.id] || 0
            const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
            const isLeader = topCount > 0 && count === topCount
            return (
              <li key={c.id}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="font-medium text-gray-800">
                    {isLeader ? '👑 ' : ''}{c.name}{' '}
                    {(c.title || c.company) && (
                      <span className="text-gray-400 font-normal">
                        ({[c.title, c.company].filter(Boolean).join(' · ')})
                      </span>
                    )}
                  </span>
                  <span className="text-gray-500">{count}표 ({pct}%)</span>
                </div>
                <div className="bg-gray-100 rounded-full h-2">
                  <div className={`rounded-full h-2 transition-all ${isLeader ? 'bg-amber-400' : 'bg-blue-400'}`} style={{ width: `${pct}%` }} />
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      {/* 후보 등록 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-gray-800">후보 등록</h2>
        <form action={addCandidate} className="space-y-3">
          <div className="flex gap-2">
            <input
              name="name"
              placeholder="이름"
              required
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              name="title"
              placeholder="직책 (선택)"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              name="company"
              placeholder="소속 회사 (선택)"
              className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <input type="file" name="photo" accept="image/*" className="text-sm text-gray-600" />
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
          >
            후보 추가
          </button>
        </form>
      </div>

      {/* 후보 목록 */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <h2 className="font-semibold text-gray-800">후보 목록</h2>
        <p className="text-xs text-gray-400">비활성 후보는 직원 투표 화면에 노출되지 않습니다.</p>
        <ul className="divide-y divide-gray-100">
          {candidates.length === 0 && <li className="text-sm text-gray-400 py-2">등록된 후보가 없습니다.</li>}
          {candidates.map((c, i) => (
            <li key={c.id} className="py-3 space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                  {c.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.photo_url} alt={c.name} className="w-full h-full object-cover" />
                  ) : <span>💪</span>}
                </div>

                <form action={updateCandidate} className="flex-1 flex flex-wrap items-center gap-2">
                  <input type="hidden" name="id" value={c.id} />
                  <input
                    name="name"
                    defaultValue={c.name}
                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm flex-1 min-w-[100px]"
                  />
                  <input
                    name="title"
                    defaultValue={c.title || ''}
                    placeholder="직책"
                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm flex-1 min-w-[100px]"
                  />
                  <input
                    name="company"
                    defaultValue={c.company || ''}
                    placeholder="소속 회사"
                    className="border border-gray-300 rounded-lg px-2 py-1.5 text-sm flex-1 min-w-[100px]"
                  />
                  <button type="submit" className="text-xs text-blue-600 font-medium">저장</button>
                </form>

                <form action={updateCandidatePhoto} className="flex items-center gap-1.5 flex-shrink-0">
                  <input type="hidden" name="id" value={c.id} />
                  <input
                    type="file"
                    name="photo"
                    accept="image/*"
                    className="text-xs text-gray-500 w-24 file:mr-1 file:text-xs"
                  />
                  <button type="submit" className="text-xs text-blue-600 font-medium whitespace-nowrap">사진 변경</button>
                </form>

                <div className="flex items-center gap-2 flex-shrink-0">
                  <form action={moveOrder.bind(null, c.id, -1)}>
                    <button disabled={i === 0} className="text-gray-300 hover:text-gray-600 disabled:opacity-30 text-xs">▲</button>
                  </form>
                  <form action={moveOrder.bind(null, c.id, 1)}>
                    <button disabled={i === candidates.length - 1} className="text-gray-300 hover:text-gray-600 disabled:opacity-30 text-xs">▼</button>
                  </form>
                  <form action={toggleActive.bind(null, c.id, !c.is_active)}>
                    <button className="text-xs text-gray-400 hover:text-gray-600">{c.is_active ? '숨기기' : '노출'}</button>
                  </form>
                  <ConfirmDeleteForm id={c.id} action={deleteCandidate}>
                    <button className="text-xs text-red-400 hover:text-red-600">삭제</button>
                  </ConfirmDeleteForm>
                </div>
              </div>
              {!c.is_active && (
                <span className="inline-block text-[10px] bg-gray-100 text-gray-400 px-1.5 py-0.5 rounded-full">비활성</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
