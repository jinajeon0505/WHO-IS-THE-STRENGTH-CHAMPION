'use client'

import { useState, useTransition } from 'react'
import { compressImage } from '@/lib/compress-image'
import { addCandidate } from './actions'

export function AddCandidateForm() {
  const [isPending, startTransition] = useTransition()
  const [compressing, setCompressing] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)
    const file = formData.get('photo') as File | null

    if (file && file.size > 0) {
      setCompressing(true)
      formData.set('photo', await compressImage(file))
      setCompressing(false)
    }

    startTransition(async () => {
      await addCandidate(formData)
      form.reset()
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
