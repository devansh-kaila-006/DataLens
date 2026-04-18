/**
 * Upload Page for DataLens
 * Main file upload interface with dataset management
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import FileUpload from '../components/upload/FileUpload'
import { supabase } from '../lib/supabase'

interface Dataset {
  id: string
  name: string
  file_size: number
  uploaded_at: string
  status: 'processing' | 'analyzing' | 'completed' | 'failed'
}

export default function UploadPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [datasets, setDatasets] = useState<Dataset[]>([])

  const handleFileUpload = async (file: File) => {
    if (!user) {
      throw new Error('You must be logged in to upload files')
    }

    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${user.id}/${Date.now()}.${fileExt}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('datasets')
        .upload(fileName, file)

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      // Create dataset record in database
      const { data: datasetData, error: dbError } = await supabase
        .from('datasets')
        .insert({
          user_id: user.id,
          name: file.name,
          file_size: file.size,
          storage_path: fileName,
          status: 'processing'
        })
        .select()
        .single()

      if (dbError) {
        throw new Error(`Database error: ${dbError.message}`)
      }

      // Trigger data processing worker
      await triggerDataProcessing(datasetData.id)

      // Add to local state
      setDatasets([{
        id: datasetData.id,
        name: datasetData.name,
        file_size: datasetData.file_size,
        uploaded_at: datasetData.created_at,
        status: datasetData.status
      }, ...datasets])

      // Navigate to analysis page
      navigate(`/analysis/${datasetData.id}`)

    } catch (error: any) {
      console.error('Upload error:', error)
      throw error
    }
  }

  const triggerDataProcessing = async (datasetId: string) => {
    try {
      // Call the Railway data processor worker
      const response = await fetch(`${import.meta.env.VITE_RAILWAY_DATA_PROCESSOR_URL}/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dataset_id: datasetId,
          storage_path: `datasets/${datasetId}`
        })
      })

      if (!response.ok) {
        throw new Error('Failed to trigger data processing')
      }

      return await response.json()
    } catch (error) {
      console.error('Processing trigger error:', error)
      // Don't throw here - the file is uploaded, we can retry processing later
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const getStatusColor = (status: Dataset['status']) => {
    switch (status) {
      case 'processing':
        return 'bg-blue-100 text-blue-800'
      case 'analyzing':
        return 'bg-purple-100 text-purple-800'
      case 'completed':
        return 'bg-green-100 text-green-800'
      case 'failed':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Upload Dataset</h1>
          <p className="mt-2 text-gray-600">
            Upload your CSV or Excel file to generate comprehensive EDA reports
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Upload New File
              </h2>
              <FileUpload onUpload={handleFileUpload} />

              {/* Upload Guidelines */}
              <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="text-sm font-medium text-blue-900 mb-2">
                  Upload Guidelines
                </h3>
                <ul className="text-xs text-blue-800 space-y-1">
                  <li>• Use CSV files for best compatibility</li>
                  <li>• First row should contain column headers</li>
                  <li>• Maximum file size: 10MB</li>
                  <li>• Avoid special characters in column names</li>
                  <li>• Ensure consistent data types in each column</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Recent Uploads Section */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Recent Uploads
              </h2>

              {datasets.length === 0 ? (
                <div className="text-center py-8">
                  <svg
                    className="mx-auto h-12 w-12 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                  <p className="mt-2 text-sm text-gray-500">
                    No datasets uploaded yet
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {datasets.map((dataset) => (
                    <div
                      key={dataset.id}
                      className="p-3 border border-gray-200 rounded-lg hover:border-purple-300 transition-colors cursor-pointer"
                      onClick={() => navigate(`/analysis/${dataset.id}`)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {dataset.name}
                          </p>
                          <p className="text-xs text-gray-500">
                            {formatFileSize(dataset.file_size)}
                          </p>
                        </div>
                        <span className={`ml-2 px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(dataset.status)}`}>
                          {dataset.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
