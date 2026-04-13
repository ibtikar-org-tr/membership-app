import { useCallback, useId, useState } from 'react'
import { XIcon } from 'lucide-react'
import { uploadImages } from '../api/vms'

export interface UploadedImage {
  name: string
  url: string
}

interface ImageFile {
  file: File
  name: string
  isBanner: boolean
}

interface ImageUploaderProps {
  onUpload: (images: UploadedImage[]) => void
  onError: (error: string) => void
  maxFiles?: number
  maxFileSize?: number // in bytes
  acceptedTypes?: string[]
}

export function ImageUploader({
  onUpload,
  onError,
  maxFiles = 5,
  maxFileSize = 5 * 1024 * 1024, // 5MB default
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
}: ImageUploaderProps) {
  const inputId = useId()
  const [selectedFiles, setSelectedFiles] = useState<ImageFile[]>([])
  const [isUploading, setIsUploading] = useState(false)

  const handleFileSelect = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || [])

      // Validate file count
      if (files.length + selectedFiles.length > maxFiles) {
        onError(`Maximum ${maxFiles} files allowed`)
        event.target.value = ''
        return
      }

      // Validate each file
      const validFiles: ImageFile[] = []
      for (const file of files) {
        if (!acceptedTypes.includes(file.type)) {
          onError(
            `Invalid file type: ${file.name}. Accepted types: ${acceptedTypes.join(', ')}`
          )
          continue
        }

        if (file.size > maxFileSize) {
          onError(
            `File too large: ${file.name}. Maximum size: ${(maxFileSize / 1024 / 1024).toFixed(1)}MB`
          )
          continue
        }

        // Check if we already have a banner
        const hasBanner = selectedFiles.some(f => f.isBanner)
        const isBanner = !hasBanner && validFiles.length === 0 // First valid file becomes banner by default

        validFiles.push({
          file,
          name: isBanner ? 'banner' : file.name,
          isBanner
        })
      }

      if (validFiles.length === 0) {
        event.target.value = ''
        return
      }

      setSelectedFiles((prev) => [...prev, ...validFiles])
      event.target.value = ''

      setIsUploading(true)

      try {
        const data = await uploadImages(validFiles.map((f) => f.file))

        if (!data.images || !Array.isArray(data.images)) {
          throw new Error('Invalid response format from server')
        }

        const uploadedImages: UploadedImage[] = validFiles.map((fileItem, index) => ({
          name: fileItem.name,
          url: data.images[index],
        }))

        onUpload(uploadedImages)
        setSelectedFiles([])
      } catch (error) {
        onError(error instanceof Error ? error.message : 'Upload failed')
      } finally {
        setIsUploading(false)
      }
    },
    [acceptedTypes, maxFileSize, maxFiles, onError, onUpload, selectedFiles]
  )

  return (
    <div className="space-y-4">
      {/* File Input */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors cursor-pointer">
        <input
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          disabled={isUploading}
          className="hidden"
          id={inputId}
        />
        <label htmlFor={inputId} className="cursor-pointer block">
          <div className="text-sm text-gray-600">
            <p className="font-medium">Click to select image and upload automatically</p>
            <p className="text-xs mt-1">
              Max {maxFiles} files, {(maxFileSize / 1024 / 1024).toFixed(1)}MB each
            </p>
          </div>
        </label>
      </div>

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">{isUploading ? 'Uploading...' : 'Selected Images:'}</h4>
          <div className="space-y-2">
            {selectedFiles.map((fileItem, index) => (
              <div
                key={`${fileItem.file.name}-${index}`}
                className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg"
              >
                <div className="w-12 h-12 bg-gray-200 rounded overflow-hidden shrink-0">
                  <img
                    src={URL.createObjectURL(fileItem.file)}
                    alt={fileItem.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="flex-1 truncate text-sm text-gray-700">{fileItem.name}</p>
                    {fileItem.isBanner && (
                      <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                        Banner
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">
                    {(fileItem.file.size / 1024 / 1024).toFixed(2)}MB • {fileItem.file.type}
                  </p>
                </div>
                {!isUploading ? <XIcon size={16} className="text-gray-400 shrink-0" /> : null}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
