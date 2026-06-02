'use client'

import { useRef, useState } from 'react'
import { Upload } from 'lucide-react'
import { toast } from 'sonner'

interface FileUploadButtonProps {
  accept?: string
  label?: string
  onUpload: (file: File) => Promise<void>
}

export default function FileUploadButton({
  accept = '.md,.docx,.txt',
  label = '上传新版本',
  onUpload,
}: FileUploadButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploading, setUploading] = useState(false)

  async function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    const toastId = toast.loading(`正在上传 ${file.name}…`)
    try {
      await onUpload(file)
      toast.success('上传成功', { id: toastId })
    } catch {
      toast.error('上传失败，请重试', { id: toastId })
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={handleChange}
        className="hidden"
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={uploading}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-gray-300 text-xs text-gray-600 hover:bg-gray-50 transition disabled:opacity-50"
      >
        <Upload className="h-3.5 w-3.5" />
        {uploading ? '上传中…' : label}
      </button>
    </>
  )
}
