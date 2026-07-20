'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { adminSessionToken } from '@/lib/admin-session'
import { createAdminClient } from '@/lib/supabase-admin'

async function requireAdmin() {
  const store = await cookies()
  const session = store.get('admin_session')?.value
  if (!process.env.ADMIN_PASSWORD || session !== adminSessionToken()) {
    throw new Error('관리자 인증이 필요합니다.')
  }
}

const BUCKET = 'candidate-photos'

async function ensureBucket(supabase: ReturnType<typeof createAdminClient>) {
  const { data: buckets } = await supabase.storage.listBuckets()
  if (!buckets?.some(b => b.id === BUCKET)) {
    await supabase.storage.createBucket(BUCKET, { public: true })
  }
}

export async function addCandidate(formData: FormData) {
  await requireAdmin()
  const supabase = createAdminClient()

  const name = String(formData.get('name') || '').trim()
  const title = String(formData.get('title') || '').trim()
  const company = String(formData.get('company') || '').trim()
  const file = formData.get('photo') as File | null

  if (!name) throw new Error('이름을 입력해주세요.')

  let photoUrl: string | null = null
  if (file && file.size > 0) {
    await ensureBucket(supabase)
    const path = `candidates/${Date.now()}-${file.name}`
    const bytes = await file.arrayBuffer()
    const { data, error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
      contentType: file.type || 'image/jpeg',
      upsert: true,
    })
    if (error) throw new Error(`사진 업로드 실패: ${error.message}`)
    photoUrl = supabase.storage.from(BUCKET).getPublicUrl(data.path).data.publicUrl
  }

  const { count } = await supabase.from('candidates').select('*', { count: 'exact', head: true })

  const { error: insertError } = await supabase.from('candidates').insert({
    name,
    title: title || null,
    company: company || null,
    photo_url: photoUrl,
    display_order: count ?? 0,
    is_active: true,
  })
  if (insertError) throw new Error(insertError.message)

  revalidatePath('/admin')
}

export async function updateCandidate(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get('id') || '')
  const name = String(formData.get('name') || '').trim()
  const title = String(formData.get('title') || '').trim()
  const company = String(formData.get('company') || '').trim()
  if (!id || !name) return

  const supabase = createAdminClient()
  await supabase.from('candidates').update({ name, title: title || null, company: company || null }).eq('id', id)
  revalidatePath('/admin')
}

export async function updateCandidatePhoto(formData: FormData) {
  await requireAdmin()
  const id = String(formData.get('id') || '')
  const file = formData.get('photo') as File | null
  if (!id || !file || file.size === 0) return

  const supabase = createAdminClient()
  await ensureBucket(supabase)
  const path = `candidates/${Date.now()}-${file.name}`
  const bytes = await file.arrayBuffer()
  const { data, error } = await supabase.storage.from(BUCKET).upload(path, bytes, {
    contentType: file.type || 'image/jpeg',
    upsert: true,
  })
  if (error) throw new Error(`사진 업로드 실패: ${error.message}`)
  const photoUrl = supabase.storage.from(BUCKET).getPublicUrl(data.path).data.publicUrl

  await supabase.from('candidates').update({ photo_url: photoUrl }).eq('id', id)
  revalidatePath('/admin')
}

export async function toggleActive(id: string, next: boolean) {
  await requireAdmin()
  const supabase = createAdminClient()
  await supabase.from('candidates').update({ is_active: next }).eq('id', id)
  revalidatePath('/admin')
}

export async function deleteCandidate(id: string) {
  await requireAdmin()
  const supabase = createAdminClient()
  await supabase.from('candidates').delete().eq('id', id)
  revalidatePath('/admin')
}

export async function moveOrder(id: string, direction: 1 | -1) {
  await requireAdmin()
  const supabase = createAdminClient()
  const { data: list } = await supabase.from('candidates').select('id, display_order').order('display_order')
  if (!list) return

  const index = list.findIndex(c => c.id === id)
  const target = index + direction
  if (index === -1 || target < 0 || target >= list.length) return

  const a = list[index]
  const b = list[target]
  await Promise.all([
    supabase.from('candidates').update({ display_order: b.display_order }).eq('id', a.id),
    supabase.from('candidates').update({ display_order: a.display_order }).eq('id', b.id),
  ])
  revalidatePath('/admin')
}
