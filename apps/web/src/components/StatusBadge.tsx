import { cn } from '@/lib/utils'

type Status = 'active' | 'archived' | 'disabled'

const STATUS_CONFIG: Record<Status, { label: string; className: string }> = {
  active: { label: '在售', className: 'bg-green-100 text-green-700 border-green-200' },
  archived: { label: '已归档', className: 'bg-gray-100 text-gray-500 border-gray-200' },
  disabled: { label: '已禁用', className: 'bg-red-100 text-red-600 border-red-200' },
}

interface StatusBadgeProps {
  status: Status
  className?: string
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG.archived
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium',
        config.className,
        className
      )}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {config.label}
    </span>
  )
}
