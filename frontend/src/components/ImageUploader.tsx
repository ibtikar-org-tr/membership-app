import { useCallback, useState } from 'react'
import { XIcon } from 'lucide-react'
import { uploadImages } from '../api/vms'

export interface UploadedImage {
  name: string
  url: string
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
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<number>(0)

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(event.target.files || [])

      // Validate file count
      if (files.length + selectedFiles.length > maxFiles) {
        onError(`Maximum ${maxFiles} files allowed`)
        return
      }

      // Validate each file
      const validFiles: File[] = []
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

        validFiles.push(file)
      }

      setSelectedFiles((prev) => [...prev, ...validFiles])

      // Reset input
      event.target.value = ''
    },
    [selectedFiles.length, maxFiles, maxFileSize, acceptedTypes, onError]
  )

  const handleRemoveFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleUpload = useCallback(async () => {
    if (selectedFiles.length === 0) {
      onError('No files selected')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const data = await uploadImages(selectedFiles)

      // Process uploaded images - data.images is the key
      if (data.images && Array.isArray(data.images)) {
        const uploadedImages: UploadedImage[] = data.images.map((url: string) => ({
          name: url.split('/').pop() || 'image',
          url,
        }))

        onUpload(uploadedImages)
        setSelectedFiles([])
        setUploadProgress(0)
      } else {
        throw new Error('Invalid response format from server')
      }
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Upload failed')
      setUploadProgress(0)
    } finally {
      setIsUploading(false)
    }
  }, [selectedFiles, onUpload, onError])

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
          id="image-input"
        />
        <label htmlFor="image-input" className="cursor-pointer block">
          <div className="text-sm text-gray-600">
            <p className="font-medium">Click to select images or drag and drop</p>
            <p className="text-xs mt-1">
              Max {maxFiles} files, {(maxFileSize / 1024 / 1024).toFixed(1)}MB each
            </p>
          </div>
        </label>
      </div>

      {/* Selected Files List */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">Selected Files:</h4>
          <ul className="space-y-1">
            {selectedFiles.map((file, index) => (
              <li
                key={`${file.name}-${index}`}
                className="flex items-center justify-between bg-gray-50 p-2 rounded"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-700 truncate">{file.name}</p>
                  <p className="text-xs text-gray-500">
                    {(file.size / 1024 / 1024).toFixed(2)}MB
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveFile(index)}
                  disabled={isUploading}
                  className="ml-2 p-1 text-gray-500 hover:text-red-500 disabled:opacity-50"
                  aria-label="Remove file"
                >
                  <XIcon size={16} />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && uploadProgress > 0 && (
        <div className="space-y-1">
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">Uploading...</span>
            <span className="text-gray-600">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Upload Button */}
      {selectedFiles.length > 0 && (
        <button
          type="button"
          onClick={handleUpload}
          disabled={isUploading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
        >
          {isUploading ? `Uploading ${selectedFiles.length} file(s)...` : `Upload ${selectedFiles.length} File(s)`}
        </button>
      )}
    </div>
  )
}
