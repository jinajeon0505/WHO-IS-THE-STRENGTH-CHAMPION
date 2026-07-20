import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { adminSessionToken } from '@/lib/admin-session'
import { createAdminClient } from '@/lib/supabase-admin'

function csvEscape(value: string): string {
  if (/[",\n]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`
  }
  return value
}

export async function GET() {
  const store = await cookies()
  const session = store.get('admin_session')?.value
  if (!process.env.ADMIN_PASSWORD || session !== adminSessionToken()) {
    return NextResponse.json({ error: '관리자 인증이 필요합니다.' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const [votersRes, votesRes, candidatesRes] = await Promise.all([
    supabase.from('voters').select('*').order('created_at'),
    supabase.from('votes').select('voter_id, candidate_id, updated_at'),
    supabase.from('candidates').select('id, name, title, company').order('display_order'),
  ])

  const voters = votersRes.data || []
  const votes = votesRes.data || []
  const candidates = candidatesRes.data || []

  const candidateById = new Map(candidates.map(c => [c.id, c]))
  const voteByVoterId = new Map(votes.map(v => [v.voter_id, v]))
  const voteCountByCandidateId = new Map<string, number>()
  for (const v of votes) {
    voteCountByCandidateId.set(v.candidate_id, (voteCountByCandidateId.get(v.candidate_id) || 0) + 1)
  }

  const totalVotes = votes.length
  const summaryHeader = ['후보', '직책', '소속 회사', '득표수', '득표율']
  const summaryRows = [...candidates]
    .sort((a, b) => (voteCountByCandidateId.get(b.id) || 0) - (voteCountByCandidateId.get(a.id) || 0))
    .map(c => {
      const count = voteCountByCandidateId.get(c.id) || 0
      const pct = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0
      return [c.name, c.title || '', c.company || '', String(count), `${pct}%`]
    })

  const listHeader = ['회사', '부서', '이름', '투표한 후보', '투표 일시(KST)']
  const listRows = voters.map(voter => {
    const vote = voteByVoterId.get(voter.id)
    const candidateName = vote ? (candidateById.get(vote.candidate_id)?.name || '알 수 없음') : '미투표'
    const votedAt = vote ? new Date(vote.updated_at).toLocaleString('ko-KR', { timeZone: 'Asia/Seoul' }) : ''
    return [voter.company, voter.department, voter.name, candidateName, votedAt]
  })

  const lines: string[][] = [
    ['후보별 득표 현황'],
    summaryHeader,
    ...summaryRows,
    [],
    [`참여자 명단 (총 ${voters.length}명 중 ${totalVotes}명 투표)`],
    listHeader,
    ...listRows,
  ]
  const csv = lines.map(row => row.map(csvEscape).join(',')).join('\r\n')

  const bom = '﻿'

  return new NextResponse(bom + csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="strength-king-voters.csv"',
    },
  })
}
