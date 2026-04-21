/**
 * Premium Upload Page
 * Enhanced file upload experience with sophisticated design
 * Now with complete backend worker integration!
 */

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import FileUpload from '../components/upload/FileUpload'
import Badge from '../components/ui/Badge'
import { completeAnalysisWorkflow } from '../lib/backend-api'

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
  const [datasets] = useState<Dataset[]>([])
  const [demoDatasets, setDemoDatasets] = useState<Dataset[]>([])

  const handleFileUpload = async (file: File) => {
    try {
      console.log('Starting file upload with backend processing:', file.name, file.size)

      // Use the complete analysis workflow with Railway workers
      const { jobId } = await completeAnalysisWorkflow(file, user?.id)

      console.log('Analysis complete, navigating to report:', jobId)

      // Navigate to report page with job ID
      navigate(`/report/${jobId}`)

    } catch (error) {
      console.error('Upload/analysis error:', error)

      // Fallback to demo mode if backend fails
      console.log('Backend unavailable, falling back to demo mode')
      handleDemoModeUpload(file)
    }
  }

  const handleDemoModeUpload = async (file: File) => {
    try {
      console.log('Demo mode upload for:', file.name)

      // Generate proper UUID for demo mode
      const demoId = crypto.randomUUID()

      // Store file in localStorage for demo mode
      await new Promise<void>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          try {
            const content = e.target?.result as string
            localStorage.setItem(`demo-file-${demoId}`, content)
            localStorage.setItem(`demo-file-${demoId}-meta`, JSON.stringify({
              name: file.name,
              size: file.size,
              uploadedAt: new Date().toISOString()
            }))
            resolve()
          } catch (error) {
            reject(error)
          }
        }
        reader.onerror = () => reject(new Error('Failed to read file'))
        reader.readAsText(file)
      })

      // Add to demo datasets
      const demoDataset: Dataset = {
        id: demoId,
        name: file.name,
        file_size: file.size,
        uploaded_at: new Date().toISOString(),
        status: 'processing'
      }

      setDemoDatasets([demoDataset, ...demoDatasets])
      navigate(`/report/${demoId}`)

    } catch (error) {
      console.error('Demo mode upload error:', error)
      throw error
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
    <div className="min-h-screen bg-gray-DARK_50 py-8">
      <div className="container-premium">
        {/* Header */}
        <div className="mb-12 animate-slide-up">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Upload Dataset</h1>
              <p className="text-gray-300 text-lg">
                Upload your CSV or Excel file for comprehensive AI-powered EDA analysis
              </p>
            </div>
          </div>
        </div>

        {/* Backend Integration Notice */}
        <div className="mb-8 animate-slide-up">
          <div className="p-4 bg-indigo-600/20 border border-indigo-500/30 rounded-lg">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <div className="flex-1">
                <p className="text-sm text-indigo-300 font-medium mb-1">Backend Integration Active!</p>
                <p className="text-xs text-gray-400">
                  Your files are now processed by Railway workers with pandas, scipy, and Gemini AI.
                  Get professional-grade analysis with ML readiness assessments and AI-powered insights.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Upload Section */}
          <div className="xl:col-span-2 space-y-8 animate-slide-up delay-100">
            {/* Main Upload Card */}
            <div className="card">
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-white mb-2">Upload New File</h2>
                    <p className="text-gray-300">Professional analysis with Railway workers</p>
                  </div>
                  <div className="flex items-center gap-2 text-indigo-400">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-sm font-medium">AI-Powered</span>
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
                  title: 'Pandas Analysis',
                  description: 'Professional statistical processing with pandas and scipy'
                },
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  ),
                  title: 'Gemini 2.5 Pro AI',
                  description: 'Advanced AI insights and recommendations'
                },
                {
                  icon: (
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  ),
                  title: 'Professional Reports',
                  description: 'Beautiful HTML, PDF, and JSON reports'
                }
              ].map((feature, index) => (
                <div key={index} className="card p-6 hover:border-indigo-300 transition-colors">
                  <div className="w-12 h-12 rounded-md bg-indigo-600/20 flex items-center justify-center text-indigo-400 mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-gray-300">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Uploads Section */}
          <div className="xl:col-span-1 animate-slide-up delay-200">
            <div className="card sticky top-24">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-white">
                    {user ? 'Recent Uploads' : 'Demo Session'}
                  </h2>
                  <span className="badge badge-info">
                    {user ? datasets.length : demoDatasets.length}
                  </span>
                </div>

                {!user && (
                  <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                    <p className="text-xs text-amber-400">
                      Demo Mode: Try without signup! Get full analysis capabilities.
                    </p>
                  </div>
                )}

                {(user ? datasets : demoDatasets).length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 rounded-2xl bg-gray-DARK_300 flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-gray-300 mb-2">No datasets uploaded yet</p>
                    <p className="text-sm text-gray-400">Upload your first dataset to get started</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {(user ? datasets : demoDatasets).map((dataset) => (
                      <div
                        key={dataset.id}
                        className="p-4 bg-gray-DARK_200 rounded-lg border border-gray-DARK_300 hover:border-indigo-500 transition-all cursor-pointer group"
                        onClick={() => navigate(`/report/${dataset.id}`)}
                      >
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-md bg-indigo-600/20 flex items-center justify-center flex-shrink-0">
                            <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-100 truncate group-hover:text-indigo-400 transition-colors">
                              {dataset.name}
                            </p>
                            <p className="text-xs text-gray-400">{formatFileSize(dataset.file_size)}</p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            {getStatusBadge(dataset.status)}
                            <svg className="w-4 h-4 text-gray-400 group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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