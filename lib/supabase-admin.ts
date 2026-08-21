import 'server-only'
import { createClient } from '@supabase/supabase-js'

export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY가 설정되지 않았습니다.')
  }
  return createClient(url, key, { auth: { persistSession: false } })
}

// 서버리스 콜드 스타트 직후 Supabase로의 첫 네트워크 요청이 간헐적으로
// "fetch failed"로 실패하는 경우가 있어, 실패 시 한 번 더 재시도한다.
export async function queryWithRetry<T>(
  fn: () => PromiseLike<{ data: T; error: { message: string } | null }>,
  attempts = 2,
  delayMs = 300
): Promise<{ data: T; error: { message: string } | null }> {
  let result = await fn()
  for (let i = 1; i < attempts && result.error; i++) {
    await new Promise(resolve => setTimeout(resolve, delayMs))
    result = await fn()
  }
  return result
}
