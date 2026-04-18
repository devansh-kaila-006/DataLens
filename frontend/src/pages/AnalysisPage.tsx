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
import {
  InfoIcon,
  ZapIcon,
  DownloadIcon,
  CheckIcon
} from '../components/ui/Icon'
import { processDataset, processDemoDataset, generateExportData, type AnalysisResult } from '../lib/data-processor'

interface AnalysisData {
  id: string
  name: string
  status: string
  created_at: string
  file_size: number
  storage_path?: string
}

interface EDAResult extends AnalysisResult {
  isDemo?: boolean
}

export default function AnalysisPage() {
  const { id } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null)
  const [edaResult, setEdaResult] = useState<EDAResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!id) return

    const fetchAndProcessData = async () => {
      try {
        setLoading(true)
        setProcessing(true)

        const isDemo = !user || id.startsWith('demo-')

        if (!isDemo) {
          // Authenticated user - fetch from database and process
          const { data, error } = await supabase
            .from('datasets')
            .select('*')
            .eq('id', id)
            .eq('user_id', user.id)
            .single()

          if (error) throw error
          if (!data) throw new Error('Dataset not found')

          setAnalysisData(data)

          // Process the dataset for EDA
          try {
            const eda = await processDataset(id)
            setEdaResult({ ...eda, isDemo: false })
          } catch (processError) {
            console.warn('Could not process dataset:', processError)
            // Still show the data even if processing fails
          }
        } else {
          // Guest user - process demo file from localStorage
          console.log('Loading demo dataset:', id)

          const demoFileMeta = localStorage.getItem(`demo-file-${id}-meta`)
          if (!demoFileMeta) {
            console.error('Demo metadata not found')
            throw new Error('Demo file not found. Please upload the file again.')
          }

          const meta = JSON.parse(demoFileMeta)
          const demoData = {
            id: id,
            name: meta.name || 'Demo Dataset',
            status: 'completed',
            created_at: meta.uploadedAt || new Date().toISOString(),
            file_size: meta.size || 0
          }

          console.log('Demo metadata loaded:', meta)
          setAnalysisData(demoData)

          // Process the actual demo file from localStorage
          try {
            console.log('Starting demo file processing...')
            const eda = await processDemoDataset(id)
            console.log('Demo processing completed successfully')
            setEdaResult({ ...eda, isDemo: true })
          } catch (processError) {
            console.error('Could not process demo dataset:', processError)
            setError(`Failed to process file: ${processError instanceof Error ? processError.message : 'Unknown error'}`)
          }
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load analysis data')
      } finally {
        setLoading(false)
        setProcessing(false)
      }
    }

    fetchAndProcessData()
  }, [id, user])

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  // Export functionality
  const handleExport = () => {
    if (!edaResult || !analysisData) return

    try {
      const exportData = generateExportData(edaResult, analysisData.name)
      const blob = new Blob([exportData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `datalens-analysis-${analysisData.id}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    }
  }

  // Share functionality
  const handleShare = () => {
    if (!analysisData) return

    const shareUrl = `${window.location.origin}/analysis/${analysisData.id}`
    navigator.clipboard.writeText(shareUrl).then(() => {
      alert('Analysis link copied to clipboard!')
    }).catch(() => {
      alert('Failed to copy link. Please copy manually: ' + shareUrl)
    })
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
              {edaResult && (
                <>
                  <Button variant="secondary" onClick={handleExport}>
                    <DownloadIcon className="w-4 h-4" />
                    Export
                  </Button>
                  <Button variant="ghost" onClick={handleShare}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632 3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Share
                  </Button>
                </>
              )}
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
            {processing ? (
              <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-lg animate-slide-up delay-200">
                <div className="flex items-start gap-3">
                  <ZapIcon className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-indigo-300">
                      <span className="font-medium">Processing your dataset...</span> - Performing exploratory data analysis and generating insights.
                    </p>
                  </div>
                </div>
              </div>
            ) : edaResult && edaResult.isDemo ? (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg animate-slide-up delay-200">
                <div className="flex items-start gap-3">
                  <InfoIcon className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-amber-300">
                      <span className="font-medium">Demo Mode</span> - Showing sample analysis. Sign up to analyze your own datasets with real EDA.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg animate-slide-up delay-200">
                <div className="flex items-start gap-3">
                  <CheckIcon className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-emerald-300">
                      <span className="font-medium">Analysis Complete</span> - Your dataset has been processed with {edaResult?.summary.totalRows} rows and {edaResult?.summary.totalColumns} columns analyzed.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Real EDA Results */}
            {edaResult && (
              <div className="space-y-6 animate-slide-up delay-300">
                {/* Data Overview */}
                <div className="card-premium p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Data Overview</h3>
                  <div className="grid grid-cols-4 gap-4">
                    <div className="p-4 bg-navy-900 rounded-lg border border-slate-700">
                      <div className="text-2xl font-bold text-emerald-400">{edaResult.summary.totalRows.toLocaleString()}</div>
                      <div className="text-xs text-slate-400">Total Rows</div>
                    </div>
                    <div className="p-4 bg-navy-900 rounded-lg border border-slate-700">
                      <div className="text-2xl font-bold text-indigo-400">{edaResult.summary.totalColumns}</div>
                      <div className="text-xs text-slate-400">Total Columns</div>
                    </div>
                    <div className="p-4 bg-navy-900 rounded-lg border border-slate-700">
                      <div className="text-2xl font-bold text-amber-400">
                        {Object.keys(edaResult.summary.columnTypes).filter(k =>
                          edaResult.summary.columnTypes[k] === 'numerical'
                        ).length}
                      </div>
                      <div className="text-xs text-slate-400">Numerical</div>
                    </div>
                    <div className="p-4 bg-navy-900 rounded-lg border border-slate-700">
                      <div className="text-2xl font-bold text-rose-400">
                        {Object.keys(edaResult.summary.columnTypes).filter(k =>
                          edaResult.summary.columnTypes[k] === 'categorical'
                        ).length}
                      </div>
                      <div className="text-xs text-slate-400">Categorical</div>
                    </div>
                  </div>
                </div>

                {/* Statistical Summary */}
                {Object.keys(edaResult.statistics.numerical).length > 0 && (
                  <div className="card-premium p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Statistical Summary</h3>
                    <div className="space-y-4">
                      {Object.entries(edaResult.statistics.numerical).map(([col, stats]: [string, any]) => (
                        <div key={col} className="p-4 bg-navy-900 rounded-lg border border-slate-700">
                          <div className="flex items-center justify-between mb-3">
                            <h4 className="font-medium text-white">{col}</h4>
                            <span className="text-xs text-emerald-400">Numerical</span>
                          </div>
                          <div className="grid grid-cols-4 gap-3 text-sm">
                            <div>
                              <div className="text-slate-400 text-xs">Mean</div>
                              <div className="text-white font-medium">{stats.mean.toFixed(2)}</div>
                            </div>
                            <div>
                              <div className="text-slate-400 text-xs">Median</div>
                              <div className="text-white font-medium">{stats.median.toFixed(2)}</div>
                            </div>
                            <div>
                              <div className="text-slate-400 text-xs">Std Dev</div>
                              <div className="text-white font-medium">{stats.std.toFixed(2)}</div>
                            </div>
                            <div>
                              <div className="text-slate-400 text-xs">Range</div>
                              <div className="text-white font-medium">{stats.min} - {stats.max}</div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Correlations */}
                {edaResult.correlations.length > 0 && (
                  <div className="card-premium p-6">
                    <h3 className="text-xl font-bold text-white mb-4">Strong Correlations</h3>
                    <div className="space-y-3">
                      {edaResult.correlations.slice(0, 5).map((corr, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-navy-900 rounded-lg border border-slate-700">
                          <div>
                            <span className="text-white font-medium">{corr.col1}</span>
                            <span className="text-slate-500 mx-2">↔</span>
                            <span className="text-white font-medium">{corr.col2}</span>
                          </div>
                          <span className={`font-bold ${
                            Math.abs(corr.correlation) > 0.7 ? 'text-emerald-400' :
                            Math.abs(corr.correlation) > 0.4 ? 'text-amber-400' :
                            'text-slate-400'
                          }`}>
                            {corr.correlation.toFixed(3)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Insights */}
                <div className="card-premium p-6">
                  <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                    <ZapIcon className="w-6 h-6 text-amber-400" />
                    Key Insights
                  </h3>
                  <div className="space-y-3">
                    {edaResult.insights.map((insight, index) => (
                      <div key={index} className="p-3 bg-navy-900 rounded-lg border border-slate-700">
                        <p className="text-sm text-slate-300">{insight}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Column Information */}
                <div className="card-premium p-6">
                  <h3 className="text-xl font-bold text-white mb-4">Column Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {edaResult.summary.columnNames.map((col, index) => (
                      <div key={index} className="p-3 bg-navy-900 rounded-lg border border-slate-700">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-white">{col}</span>
                          <span className={`text-xs px-2 py-1 rounded ${
                            edaResult.summary.columnTypes[col] === 'numerical' ? 'bg-emerald-500/20 text-emerald-400' :
                            edaResult.summary.columnTypes[col] === 'categorical' ? 'bg-indigo-500/20 text-indigo-400' :
                            'bg-slate-500/20 text-slate-400'
                          }`}>
                            {edaResult.summary.columnTypes[col]}
                          </span>
                        </div>
                        {edaResult.summary.missingValues[col] > 0 && (
                          <div className="text-xs text-slate-500">
                            Missing: {edaResult.summary.missingValues[col]} values
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
