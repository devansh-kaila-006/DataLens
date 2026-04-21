/**
 * v2 File Upload Component - Light theme, clean design
 * Professional drag-and-drop with flat colors
 */

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import Button from '../ui/Button'

interface FileUploadProps {
  onUpload: (file: File) => Promise<void>
  maxSize?: number
  disabled?: boolean
}

export default function FileUpload({
  onUpload,
  maxSize = 10 * 1024 * 1024,
  disabled = false
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [progress, setProgress] = useState(0)

  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
    setError('')

    if (rejectedFiles.length > 0) {
      const rejection = rejectedFiles[0]
      if (rejection.errors[0]?.code === 'file-too-large') {
        setError(`File is too large. Maximum size is ${maxSize / (1024 * 1024)}MB`)
      } else if (rejection.errors[0]?.code === 'file-invalid-type') {
        setError('Invalid file type. Please upload CSV or Excel files.')
      } else {
        setError('File upload failed. Please try again.')
      }
      return
    }

    const file = acceptedFiles[0]
    if (!file) return

    setUploadedFile(file)
    setUploading(true)

    // Simulate progress
    let progressValue = 0
    const progressInterval = setInterval(() => {
      progressValue += 10
      setProgress(progressValue)
      if (progressValue >= 90) {
        clearInterval(progressInterval)
      }
    }, 200)

    try {
      await onUpload(file)
      setProgress(100)
      clearInterval(progressInterval)
    } catch (err: any) {
      setError(err.message || 'Upload failed. Please try again.')
      setUploadedFile(null)
      clearInterval(progressInterval)
    } finally {
      setUploading(false)
    }
  }, [onUpload, maxSize])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
    },
    maxSize,
    multiple: false,
    disabled: disabled || uploading
  })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const resetUpload = () => {
    setUploadedFile(null)
    setError('')
    setProgress(0)
  }

  return (
    <div className="w-full space-y-6">
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-md p-12 text-center cursor-pointer
          transition-colors duration-150
          ${isDragActive
            ? 'border-indigo-600 bg-indigo-50'
            : 'border-gray-DARK_400 hover:border-indigo-600 hover:bg-gray-DARK_300'
          }
          ${(disabled || uploading) ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />

        <div className="space-y-6">
          <div className="flex justify-center">
            {uploading ? (
              <div className="relative">
                <div className="w-20 h-20 border-4 border-gray-DARK_400 rounded-full"></div>
                <div className="absolute top-0 left-0 w-20 h-20 border-4 border-indigo-500 rounded-full border-t-transparent animate-spin"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-indigo-400">{progress}%</span>
                </div>
              </div>
            ) : (
              <div className="w-20 h-20 rounded-md bg-indigo-600/20 flex items-center justify-center">
                <svg
                  className="w-10 h-10 text-indigo-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                  />
                </svg>
              </div>
            )}
          </div>

          <div>
            {uploading ? (
              <div>
                <p className="text-xl font-semibold text-gray-200 mb-2">Uploading your dataset...</p>
                <p className="text-gray-400">This may take a moment depending on file size</p>
                <div className="mt-4 w-full bg-gray-DARK_400 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ) : (
              <>
                <p className="text-xl font-semibold text-gray-200 mb-2">
                  {isDragActive ? 'Drop your file here' : 'Upload your dataset'}
                </p>
                <p className="text-gray-300 mb-4">
                  Drag and drop your CSV or Excel file, or click to browse
                </p>
                <div className="flex items-center justify-center gap-4 text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span>CSV, XLS, XLSX</span>
                  </div>
                  <div className="w-px h-4 bg-gray-300"></div>
                  <div className="flex items-center gap-2">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
                    </svg>
                    <span>Max {maxSize / (1024 * 1024)}MB</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-600/10 border border-red-500/30 rounded-md animate-slide-up">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-red-400">{error}</p>
            </div>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-300">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {uploadedFile && !error && !uploading && (
        <div className="p-4 bg-emerald-600/10 border border-emerald-500/30 rounded-md animate-slide-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-md bg-emerald-600/20 flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-emerald-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-100 truncate">{uploadedFile.name}</p>
                <p className="text-xs text-gray-400">{formatFileSize(uploadedFile.size)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="badge badge-success">Ready to analyze</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetUpload}
                className="text-gray-400 hover:text-gray-100"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Guidelines */}
      <div className="p-4 bg-gray-DARK_200 rounded-md border border-gray-DARK_300">
        <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
          <svg className="w-4 h-4 text-indigo-400" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Upload Guidelines
        </h4>
        <ul className="text-xs text-gray-300 space-y-2">
          <li className="flex items-start gap-2">
            <svg className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Use CSV files for best compatibility with our analysis engine</span>
          </li>
          <li className="flex items-start gap-2">
            <svg className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>First row should contain column headers for proper analysis</span>
          </li>
          <li className="flex items-start gap-2">
            <svg className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>Ensure consistent data types in each column for accurate insights</span>
          </li>
        </ul>
      </div>
    </div>
  )
}
