import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, queryWithRetry } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  const { voterId, candidateId } = await req.json()
  if (!voterId || !candidateId) {
    return NextResponse.json({ error: '잘못된 요청입니다.' }, { status: 400 })
  }

  const supabase = createAdminClient()

  // voterId가 실제 존재하는 투표자인지 확인 (임의 UUID로 votes 테이블 오염 방지)
  const { data: voter, error: voterError } = await queryWithRetry(() =>
    supabase.from('voters').select('id').eq('id', voterId).maybeSingle()
  )
  if (voterError) {
    return NextResponse.json({ error: `조회 실패: ${voterError.message}` }, { status: 500 })
  }
  if (!voter) {
    return NextResponse.json({ error: '유효하지 않은 사용자입니다. 다시 로그인해주세요.' }, { status: 400 })
  }

  const { error } = await queryWithRetry(() =>
    supabase
      .from('votes')
      .upsert(
        { voter_id: voterId, candidate_id: candidateId, updated_at: new Date().toISOString() },
        { onConflict: 'voter_id' }
      )
  )

  if (error) {
    return NextResponse.json({ error: `투표 처리에 실패했습니다: ${error.message}` }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
