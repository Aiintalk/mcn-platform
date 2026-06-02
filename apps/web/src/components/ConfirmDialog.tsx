'use client'

import { useState, useCallback, ReactNode } from 'react'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  variant?: 'default' | 'destructive'
  onConfirm: () => void | Promise<void>
}

export default function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = '确认',
  cancelLabel = '取消',
  variant = 'default',
  onConfirm,
}: ConfirmDialogProps) {
  const [loading, setLoading] = useState(false)

  const handleConfirm = useCallback(async () => {
    setLoading(true)
    try {
      await onConfirm()
    } finally {
      setLoading(false)
      onOpenChange(false)
    }
  }, [onConfirm, onOpenChange])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 bg-black/40 flex items-center justify-center z-50"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-[420px] p-7"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-base font-bold text-gray-900 mb-2">{title}</h2>
        <div className="text-sm text-gray-500 mb-6">{description}</div>
        <div className="flex gap-3">
          <button
            onClick={() => onOpenChange(false)}
            disabled={loading}
            className="flex-1 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-700 hover:bg-gray-50 transition"
          >
            {cancelLabel}
          </button>
          <button
            onClick={handleConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-lg text-white text-sm font-medium transition disabled:opacity-60 ${
              variant === 'destructive'
                ? 'bg-red-500 hover:bg-red-600'
                : 'hover:opacity-90'
            }`}
            style={variant !== 'destructive' ? { background: '#f59a23' } : undefined}
          >
            {loading ? '处理中…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
