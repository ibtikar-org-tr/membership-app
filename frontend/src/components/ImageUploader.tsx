import { useCallback, useState } from 'react'
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
  const [selectedFiles, setSelectedFiles] = useState<ImageFile[]>([])
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

      setSelectedFiles((prev) => [...prev, ...validFiles])

      // Reset input
      event.target.value = ''
    },
    [selectedFiles.length, maxFiles, maxFileSize, acceptedTypes, onError]
  )

  const handleRemoveFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }, [])

  const handleNameChange = useCallback((index: number, newName: string) => {
    setSelectedFiles((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, name: newName, isBanner: newName === 'banner' } : item
      )
    )
  }, [])

  const handleUpload = useCallback(async () => {
    if (selectedFiles.length === 0) {
      onError('No files selected')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const data = await uploadImages(selectedFiles.map(f => f.file))

      // Process uploaded images - data.images is the key
      if (data.images && Array.isArray(data.images)) {
        const uploadedImages: UploadedImage[] = selectedFiles.map((fileItem, index) => ({
          name: fileItem.name,
          url: data.images[index],
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
          <h4 className="text-sm font-medium text-gray-700">Selected Images:</h4>
          <div className="space-y-2">
            {selectedFiles.map((fileItem, index) => (
              <div
                key={`${fileItem.file.name}-${index}`}
                className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg"
              >
                <div className="w-12 h-12 bg-gray-200 rounded overflow-hidden flex-shrink-0">
                  <img
                    src={URL.createObjectURL(fileItem.file)}
                    alt={fileItem.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <input
                      type="text"
                      value={fileItem.name}
                      onChange={(e) => handleNameChange(index, e.target.value)}
                      disabled={isUploading}
                      className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:border-blue-500 disabled:bg-gray-100"
                      placeholder="Image name"
                    />
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
                <button
                  type="button"
                  onClick={() => handleRemoveFile(index)}
                  disabled={isUploading}
                  className="p-1 text-gray-500 hover:text-red-500 disabled:opacity-50 flex-shrink-0"
                  aria-label="Remove image"
                >
                  <XIcon size={16} />
                </button>
              </div>
            ))}
          </div>
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
