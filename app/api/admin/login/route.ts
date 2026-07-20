import { NextRequest, NextResponse } from 'next/server'
import { adminSessionToken } from '@/lib/admin-session'

export async function POST(req: NextRequest) {
  if (!process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: '서버에 ADMIN_PASSWORD가 설정되지 않았습니다.' }, { status: 500 })
  }

  const { password } = await req.json()
  if (password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: '비밀번호가 올바르지 않습니다.' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set('admin_session', adminSessionToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  })
  return res
}
