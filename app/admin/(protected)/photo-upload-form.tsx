'use client'

import { useTransition } from 'react'
import { compressImage } from '@/lib/compress-image'
import { updateCandidatePhoto } from './actions'

export function PhotoUploadForm({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const file = formData.get('photo') as File | null
    if (!file || file.size === 0) return

    formData.set('photo', await compressImage(file))

    startTransition(async () => {
      await updateCandidatePhoto(formData)
      form.reset()
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-1.5 flex-shrink-0">
      <input type="hidden" name="id" value={id} />
      <input
        type="file"
        name="photo"
        accept="image/*"
        className="text-xs text-gray-500 w-24 file:mr-1 file:text-xs"
      />
      <button type="submit" disabled={isPending} className="text-xs text-blue-600 font-medium whitespace-nowrap">
        {isPending ? '업로드 중...' : '사진 변경'}
      </button>
    </form>
  )
}
