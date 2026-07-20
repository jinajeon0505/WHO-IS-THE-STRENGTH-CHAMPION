'use client'

import { useState, useTransition } from 'react'
import { compressImage, MAX_UPLOAD_BYTES } from '@/lib/compress-image'
import { updateCandidatePhoto } from './actions'

export function PhotoUploadForm({ id }: { id: string }) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const form = e.currentTarget
    const formData = new FormData(form)
    const file = formData.get('photo') as File | null
    if (!file || file.size === 0) return

    const compressed = await compressImage(file)
    if (compressed.size > MAX_UPLOAD_BYTES) {
      setError('사진 파일이 너무 큽니다. 더 작은 사진으로 다시 시도해주세요.')
      return
    }
    formData.set('photo', compressed)

    startTransition(async () => {
      try {
        const result = await updateCandidatePhoto(formData)
        if (result.error) { setError(result.error); return }
        form.reset()
      } catch {
        setError('업로드 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
      }
    })
  }

  return (
    <div className="flex flex-col gap-1 flex-shrink-0">
      <form onSubmit={handleSubmit} className="flex items-center gap-1.5">
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
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
