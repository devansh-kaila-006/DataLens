/**
 * Premium Analysis Dashboard
 * Sophisticated data visualization and insights interface
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import Button from '../components/ui/Button'
import Badge from '../components/ui/Badge'
import Card, { CardHeader, CardBody, CardFooter } from '../components/ui/Card'

interface AnalysisData {
  id: string
  name: string
  status: string
  created_at: string
  file_size: number
}

export default function AnalysisPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id || !user) return

    const fetchAnalysisData = async () => {
      try {
        const { data, error } = await supabase
          .from('datasets')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single()

        if (error) throw error
        if (!data) throw new Error('Dataset not found')

        setAnalysisData(data)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchAnalysisData()
  }, [id, user])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="w-20 h-20 border-4 border-slate-700 rounded-full mx-auto"></div>
            <div className="absolute top-0 left-0 w-20 h-20 border-4 border-emerald-500 rounded-full border-t-transparent animate-spin"></div>
          </div>
          <p className="mt-6 text-slate-400">Loading your analysis...</p>
        </div>
      </div>
    )
  }

  if (error || !analysisData) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center p-8">
        <div className="card-premium max-w-md w-full p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 flex items-center justify-center mx-auto mb-6">
            <svg className="w-8 h-8 text-rose-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-white mb-3">Analysis Not Found</h2>
          <p className="text-slate-400 mb-8">{error || 'The requested analysis could not be found.'}</p>
          <Button onClick={() => navigate('/upload')} className="w-full">
            Upload New Dataset
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-navy-900 py-8">
      <div className="container-premium">
        {/* Header */}
        <div className="mb-8 animate-slide-up">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/upload')}
                className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
              </button>
              <div>
                <h1 className="text-3xl font-bold text-white mb-1">Analysis Results</h1>
                <p className="text-slate-400">{analysisData.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {Badge({ variant: 'info', children: analysisData.status })}
              <Button variant="secondary" onClick={() => navigate('/upload')}>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                New Analysis
              </Button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-12 gap-8">
          {/* Left Column - Dataset Info & Controls */}
          <div className="col-span-12 lg:col-span-3 space-y-6 animate-slide-up delay-100">
            {/* Dataset Info */}
            <Card variant="premium" className="sticky top-24">
              <CardHeader>
                <h3 className="text-lg font-bold text-white">Dataset Information</h3>
              </CardHeader>
              <CardBody className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">File Name</span>
                    <span className="text-sm font-medium text-white">{analysisData.name}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">File Size</span>
                    <span className="text-sm font-medium text-white">{formatFileSize(analysisData.file_size)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Uploaded</span>
                    <span className="text-sm font-medium text-white">
                      {new Date(analysisData.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-slate-400">Status</span>
                    {Badge({ variant: 'info', children: analysisData.status })}
                  </div>
                </div>
              </CardBody>
              <CardFooter className="space-y-3">
                <Button variant="secondary" className="w-full" size="sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  Export PDF
                </Button>
                <Button variant="ghost" className="w-full" size="sm">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Main Content Area */}
          <div className="col-span-12 lg:col-span-9 space-y-6">
            {/* Status Banner */}
            <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-lg animate-slide-up delay-200">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div className="flex-1">
                  <p className="text-sm text-indigo-300">
                    <span className="font-medium">Analysis in progress</span> - Your dataset is being processed. Advanced insights and visualizations will appear automatically.
                  </p>
                </div>
              </div>
            </div>

            {/* Analysis Dashboard Coming Soon */}
            <div className="card-premium overflow-hidden animate-slide-up delay-300">
              <div className="p-8 text-center">
                <div className="relative w-24 h-24 mx-auto mb-6">
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/20 to-indigo-400/20 rounded-2xl animate-pulse-slow"></div>
                  <div className="relative w-24 h-24 bg-gradient-to-br from-emerald-400/10 to-indigo-400/10 rounded-2xl flex items-center justify-center">
                    <svg className="w-12 h-12 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                </div>

                <h3 className="text-2xl font-bold text-white mb-4">Advanced Analysis Dashboard</h3>
                <p className="text-slate-400 mb-8 max-w-md mx-auto">
                  We're building powerful visualization tools and AI-powered insights for your data.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                  {[
                    { icon: '📊', title: 'Statistical Summaries', description: 'Comprehensive distributions and correlations' },
                    { icon: '📈', title: 'Interactive Charts', description: 'Dynamic visualizations with drill-down' },
                    { icon: '🤖', title: 'AI Insights', description: 'Machine learning-powered recommendations' },
                    { icon: '📄', title: 'Export Reports', description: 'Beautiful PDF reports for sharing' }
                  ].map((feature, index) => (
                    <div key={index} className="p-4 bg-navy-900 rounded-lg border border-slate-700 text-left">
                      <div className="flex items-start gap-3">
                        <span className="text-2xl">{feature.icon}</span>
                        <div>
                          <h4 className="text-white font-medium mb-1">{feature.title}</h4>
                          <p className="text-sm text-slate-400">{feature.description}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg inline-block">
                  <p className="text-sm text-emerald-400">
                    💡 Your dataset is safe and ready. Full dashboard coming soon!
                  </p>
                </div>
              </div>
            </div>

            {/* Placeholder for Chart */}
            <div className="card-premium p-6 animate-slide-up delay-400">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white">Data Overview</h3>
                  <p className="text-sm text-slate-400">Interactive visualization</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm">Day</Button>
                  <Button variant="secondary" size="sm">Week</Button>
                  <Button variant="ghost" size="sm">Month</Button>
                </div>
              </div>

              {/* Placeholder Chart */}
              <div className="h-64 bg-navy-900 rounded-lg border border-slate-700 flex items-center justify-center">
                <div className="text-center">
                  <svg className="w-12 h-12 text-slate-600 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                  <p className="text-slate-500 text-sm">Chart visualization coming soon</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
