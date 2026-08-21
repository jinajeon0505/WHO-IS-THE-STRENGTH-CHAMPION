import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase-admin'

export async function POST(req: NextRequest) {
  const { company, department, name } = await req.json()
  const c = String(company || '').trim()
  const d = String(department || '').trim()
  const n = String(name || '').trim()

  if (!c || !d || !n) {
    return NextResponse.json({ error: '회사, 부서, 이름을 모두 입력해주세요.' }, { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: existing, error: selectError } = await supabase
    .from('voters')
    .select('*')
    .eq('company', c)
    .eq('department', d)
    .eq('name', n)
    .maybeSingle()

  if (selectError) {
    return NextResponse.json({ error: `조회 실패: ${selectError.message}` }, { status: 500 })
  }

  if (existing) {
    return NextResponse.json({ voter: existing })
  }

  const { data: created, error } = await supabase
    .from('voters')
    .insert({ company: c, department: d, name: n })
    .select('*')
    .single()

  if (error || !created) {
    return NextResponse.json({ error: `등록 실패: ${error?.message || '알 수 없는 오류'}` }, { status: 500 })
  }

  return NextResponse.json({ voter: created })
}
