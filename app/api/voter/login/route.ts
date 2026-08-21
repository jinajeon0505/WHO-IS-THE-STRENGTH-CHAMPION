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

  const { data: existing } = await supabase
    .from('voters')
    .select('*')
    .eq('company', c)
    .eq('department', d)
    .eq('name', n)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ voter: existing })
  }

  const { data: created, error } = await supabase
    .from('voters')
    .insert({ company: c, department: d, name: n })
    .select('*')
    .single()

  if (error || !created) {
    return NextResponse.json({ error: '등록에 실패했습니다. 다시 시도해주세요.' }, { status: 500 })
  }

  return NextResponse.json({ voter: created })
}
