import { useCallback, useEffect, useId, useState } from 'react'
import { XIcon } from 'lucide-react'

interface ImageUploaderProps {
  onSelect: (file: File | null) => void
  onError: (error: string) => void
  maxFileSize?: number // in bytes
  acceptedTypes?: string[]
}

export function ImageUploader({
  onSelect,
  onError,
  maxFileSize = 5 * 1024 * 1024, // 5MB default
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
}: ImageUploaderProps) {
  const inputId = useId()
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    if (!acceptedTypes.includes(file.type)) {
      onError(`Invalid file type: ${file.name}. Accepted types: ${acceptedTypes.join(', ')}`)
      event.target.value = ''
      return
    }

    if (file.size > maxFileSize) {
      onError(
        `File too large: ${file.name}. Maximum size: ${(maxFileSize / 1024 / 1024).toFixed(1)}MB`
      )
      event.target.value = ''
      return
    }

    const objectUrl = URL.createObjectURL(file)
    setPreviewUrl(objectUrl)
    setFileName(file.name)
    onSelect(file)
    event.target.value = ''
  }, [acceptedTypes, maxFileSize, onError, onSelect])

  const clearSelection = useCallback(() => {
    setPreviewUrl(null)
    setFileName(null)
    onSelect(null)
  }, [onSelect])

  useEffect(() => {
    return () => {
      if (previewUrl?.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl)
      }
    }
  }, [previewUrl])

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer">
        <input
          type="file"
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
          id={inputId}
        />
        <label htmlFor={inputId} className="cursor-pointer block">
          <div className="text-sm text-gray-600">
            <p className="font-medium">اختر صورة البانر (لن تُرفع إلا عند الحفظ)</p>
            <p className="text-xs mt-1">حد أقصى {(maxFileSize / 1024 / 1024).toFixed(1)}MB</p>
          </div>
        </label>
      </div>

      {previewUrl ? (
        <div className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
          <div className="w-12 h-12 bg-gray-200 rounded overflow-hidden shrink-0">
            <img src={previewUrl} alt={fileName ?? 'selected-image'} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm text-gray-700">{fileName ?? 'banner-image'}</p>
            <p className="text-xs text-gray-500">سيتم رفعها عند الضغط على حفظ</p>
          </div>
          <button
            type="button"
            onClick={clearSelection}
            className="p-1 text-gray-500 hover:text-red-500 shrink-0"
            aria-label="Remove selected image"
          >
            <XIcon size={16} />
          </button>
        </div>
      ) : null}
    </div>
  )
}
