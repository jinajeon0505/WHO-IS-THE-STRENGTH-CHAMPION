'use client'

import { useState, useTransition } from 'react'
import { compressImage, MAX_UPLOAD_BYTES } from '@/lib/compress-image'
import { addCandidate } from './actions'

export function AddCandidateForm() {
  const [isPending, startTransition] = useTransition()
  const [compressing, setCompressing] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setError('')
    const form = e.currentTarget
    const formData = new FormData(form)
    const file = formData.get('photo') as File | null

    if (file && file.size > 0) {
      setCompressing(true)
      const compressed = await compressImage(file)
      setCompressing(false)
      if (compressed.size > MAX_UPLOAD_BYTES) {
        setError('사진 파일이 너무 큽니다. 더 작은 사진으로 다시 시도해주세요.')
        return
      }
      formData.set('photo', compressed)
    }

    startTransition(async () => {
      try {
        const result = await addCandidate(formData)
        if (result.error) { setError(result.error); return }
        form.reset()
      } catch {
        setError('업로드 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex gap-2">
        <input
          name="name"
          placeholder="이름"
          required
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          name="title"
          placeholder="직책 (선택)"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          name="company"
          placeholder="소속 회사 (선택)"
          className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <input type="file" name="photo" accept="image/*" className="text-sm text-gray-600" />
      {error && <p className="text-sm text-red-500 bg-red-50 rounded-lg px-3 py-2">{error}</p>}
      <button
        type="submit"
        disabled={isPending || compressing}
        className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
      >
        {compressing ? '사진 압축 중...' : isPending ? '등록 중...' : '후보 추가'}
      </button>
    </form>
  )
}
