import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  const { voterId } = await req.json()
  if (!voterId) {
    return NextResponse.json({ error: 'voterId가 필요합니다.' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const { data } = await supabase
    .from('votes')
    .select('candidate_id')
    .eq('voter_id', voterId)
    .maybeSingle()

  return NextResponse.json({ candidateId: data?.candidate_id ?? null })
}
