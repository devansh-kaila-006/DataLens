/**
 * Chart Card Component
 * Standardized container for all visualizations
 */

import type { ReactNode } from 'react'
import Card from '../ui/Card'

interface ChartCardProps {
  title: string
  description?: string
  insights?: string[]
  children: ReactNode
  exportable?: boolean
  onExport?: () => void
  loading?: boolean
  error?: string
}

export default function ChartCard({
  title,
  description,
  insights = [],
  children,
  exportable = false,
  onExport,
  loading = false,
  error
}: ChartCardProps) {
  return (
    <Card variant="premium" className="p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-white mb-1">{title}</h3>
          {description && (
            <p className="text-sm text-slate-400">{description}</p>
          )}
        </div>
        {exportable && onExport && (
          <button
            onClick={onExport}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
            title="Export chart as PNG"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
          </button>
        )}
      </div>

      {/* Chart Content */}
      <div className="mb-4">
        {loading ? (
          <div className="flex items-center justify-center h-64 bg-navy-900 rounded-lg">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400"></div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center h-64 bg-navy-900 rounded-lg">
            <div className="text-center">
              <svg className="w-12 h-12 text-rose-400 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-rose-400 text-sm">{error}</p>
            </div>
          </div>
        ) : (
          children
        )}
      </div>

      {/* Insights Panel */}
      {insights.length > 0 && !loading && !error && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
          <div className="flex items-start gap-2">
            <svg className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-xs text-emerald-400 font-medium mb-1">Key Insights</p>
              <ul className="text-xs text-slate-400 space-y-0.5">
                {insights.map((insight, index) => (
                  <li key={index}>• {insight}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </Card>
  )
}