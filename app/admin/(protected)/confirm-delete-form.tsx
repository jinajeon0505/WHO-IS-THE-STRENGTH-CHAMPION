'use client'

export function ConfirmDeleteForm({ id, action, children }: {
  id: string
  action: (id: string) => Promise<void>
  children: React.ReactNode
}) {
  return (
    <form
      action={async () => {
        if (confirm('후보를 삭제하시겠습니까? 투표 기록도 함께 삭제됩니다.')) {
          await action(id)
        }
      }}
    >
      {children}
    </form>
  )
}
