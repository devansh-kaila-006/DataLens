/**
 * Premium Upload Page
 * Enhanced file upload experience with sophisticated design
 * Now works without authentication - demo mode
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import FileUpload from '../components/upload/FileUpload'
import { supabase } from '../lib/supabase'
import Badge from '../components/ui/Badge'

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
    try {
      let datasetId: string

      if (user) {
        // Authenticated user - upload to Supabase
        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
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

        datasetId = datasetData.id

        // Trigger data processing worker
        await triggerDataProcessing(datasetId)

        // Add to local state
        setDatasets([{
          id: datasetData.id,
          name: datasetData.name,
          file_size: datasetData.file_size,
          uploaded_at: datasetData.created_at,
          status: datasetData.status
        }, ...datasets])

      } else {
        // Guest user - create demo dataset
        datasetId = `demo_${Date.now()}`
        const demoDataset = {
          id: datasetId,
          name: file.name,
          file_size: file.size,
          uploaded_at: new Date().toISOString(),
          status: 'completed' as const
        }

        setDatasets([demoDataset, ...datasets])

        // Simulate processing delay for demo
        await new Promise(resolve => setTimeout(resolve, 1500))
      }

      // Navigate to analysis page
      navigate(`/analysis/${datasetId}`)

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

  const getStatusBadge = (status: Dataset['status']) => {
    const variants = {
      processing: 'info',
      analyzing: 'warning',
      completed: 'success',
      failed: 'error'
    } as const

    return <Badge variant={variants[status]}>{status}</Badge>
  }

  return (
    <div className="min-h-screen bg-navy-900 py-8">
      <div className="container-premium">
        {/* Header */}
        <div className="mb-12 animate-slide-up">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Upload Dataset</h1>
              <p className="text-slate-400 text-lg">
                Upload your CSV or Excel file to generate comprehensive EDA reports with AI-powered insights
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="xl:col-span-2 space-y-8 animate-slide-up delay-100">
            {/* Main Upload Card */}
            <div className="card-premium">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2">Upload New File</h2>
                    <p className="text-slate-400">Start analyzing your data in seconds</p>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-400">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium">Secure & Private</span>
                  </div>
                </div>

                <FileUpload onUpload={handleFileUpload} />
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  ),
                  title: 'Lightning Fast',
                  description: 'Analysis completes in under 2 minutes for most datasets'
                },
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  ),
                  title: 'Enterprise Security',
                  description: 'Bank-grade encryption and SOC 2 compliance'
                },
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  ),
                  title: 'AI-Powered Insights',
                  description: 'Machine learning algorithms find hidden patterns'
                }
              ].map((feature, index) => (
                <div key={index} className="card p-6 hover:border-emerald-500/30 transition-colors">
                  <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400 mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-400">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Uploads Section */}
          <div className="xl:col-span-1 animate-slide-up delay-200">
            <div className="card-premium sticky top-24">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">Recent Uploads</h2>
                  <span className="badge badge-info">{datasets.length}</span>
                </div>

                {datasets.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-slate-400 mb-2">No datasets uploaded yet</p>
                    <p className="text-sm text-slate-500">Upload your first dataset to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {datasets.map((dataset) => (
                      <div
                        key={dataset.id}
                        className="p-4 bg-navy-900 rounded-lg border border-slate-700 hover:border-emerald-500/50 transition-all cursor-pointer group"
                        onClick={() => navigate(`/analysis/${dataset.id}`)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate group-hover:text-emerald-400 transition-colors">
                              {dataset.name}
                            </p>
                            <p className="text-xs text-slate-500">{formatFileSize(dataset.file_size)}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {getStatusBadge(dataset.status)}
                            <svg className="w-4 h-4 text-slate-600 group-hover:text-emerald-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                          </div>
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
    </div>
  )
}
