import type { ReactNode } from 'react'

export interface FilterPillProps {
  active: boolean
  label: string
  onClick: () => void
  icon?: ReactNode
}

export function FilterPill({ active, label, onClick, icon }: FilterPillProps): ReactNode {
  const baseClass =
    'btn inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-full px-4 text-sm transition-colors'
  const activeClass = active ? ' btn-primary' : ''

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`${baseClass}${activeClass}`}
    >
      {icon !== undefined ? <span aria-hidden="true">{icon}</span> : null}
      <span>{label}</span>
    </button>
  )
}
