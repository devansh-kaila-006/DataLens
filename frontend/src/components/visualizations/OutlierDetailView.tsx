/**
 * Outlier Detail View Component
 * Detailed analysis of detected outliers with tabular view and export
 */

import { useState } from 'react'
import ChartCard from './ChartCard'

interface Outlier {
  index: number
  value: number
  zScore: number
  column: string
  modifiedZScore?: number
  iqrScore?: number
}

interface OutlierDetailViewProps {
  outliers: Outlier[]
  columnName: string
  threshold?: number
  showIndices?: boolean
  insights?: string[]
}

export default function OutlierDetailView({
  outliers,
  columnName,
  threshold = 3,
  showIndices = true,
  insights = []
}: OutlierDetailViewProps) {
  const [sortField, setSortField] = useState<'index' | 'value' | 'zScore'>('zScore')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Sort outliers
  const sortedOutliers = [...outliers].sort((a, b) => {
    const aVal = a[sortField]
    const bVal = b[sortField]

    if (sortOrder === 'asc') {
      return (aVal as number) - (bVal as number)
    }
    return (bVal as number) - (aVal as number)
  })

  // Calculate statistics
  const avgZScore = outliers.length > 0
    ? outliers.reduce((sum, o) => sum + Math.abs(o.zScore), 0) / outliers.length
    : 0

  const maxZScore = outliers.length > 0
    ? Math.max(...outliers.map(o => Math.abs(o.zScore)))
    : 0

  const extremeOutliers = outliers.filter(o => Math.abs(o.zScore) > threshold * 1.5).length

  // Generate insights
  const autoInsights = insights.length > 0 ? insights : [
    `${outliers.length} outliers detected in ${columnName}`,
    `Average |Z-score|: ${avgZScore.toFixed(2)}`,
    `Maximum |Z-score|: ${maxZScore.toFixed(2)}`,
    extremeOutliers > 0
      ? `${extremeOutliers} extreme outliers (> ${(threshold * 1.5).toFixed(1)}σ)`
      : undefined
  ].filter(Boolean) as string[]

  const handleExport = () => {
    const csvContent = [
      ['Index', 'Value', 'Z-Score', 'Modified Z-Score', 'IQR Score'].join(','),
      ...sortedOutliers.map(o => [
        o.index,
        o.value.toFixed(4),
        o.zScore.toFixed(4),
        o.modifiedZScore?.toFixed(4) || 'N/A',
        o.iqrScore?.toFixed(4) || 'N/A'
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `outliers-${columnName}-${Date.now()}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const handleSort = (field: 'index' | 'value' | 'zScore') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('desc')
    }
  }

  const getZScoreColor = (zScore: number) => {
    const absZ = Math.abs(zScore)
    if (absZ > threshold * 2) return 'text-rose-400 font-semibold' // Extreme
    if (absZ > threshold * 1.5) return 'text-orange-400 font-semibold' // High
    if (absZ > threshold) return 'text-yellow-400' // Moderate
    return 'text-emerald-400' // Mild
  }

  return (
    <ChartCard
      title={`Outlier Details: ${columnName}`}
      description="Detailed breakdown of detected outliers with statistics"
      insights={autoInsights}
      exportable={true}
      onExport={handleExport}
    >
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-700">
              {showIndices && (
                <th
                  className="px-4 py-3 text-left text-slate-400 font-medium cursor-pointer hover:text-slate-300 transition-colors"
                  onClick={() => handleSort('index')}
                >
                  Index {sortField === 'index' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
              )}
              <th
                className="px-4 py-3 text-left text-slate-400 font-medium cursor-pointer hover:text-slate-300 transition-colors"
                onClick={() => handleSort('value')}
              >
                Value {sortField === 'value' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th
                className="px-4 py-3 text-left text-slate-400 font-medium cursor-pointer hover:text-slate-300 transition-colors"
                onClick={() => handleSort('zScore')}
              >
                Z-Score {sortField === 'zScore' && (sortOrder === 'asc' ? '↑' : '↓')}
              </th>
              <th className="px-4 py-3 text-left text-slate-400 font-medium">
                Modified Z-Score
              </th>
              <th className="px-4 py-3 text-left text-slate-400 font-medium">
                IQR Score
              </th>
              <th className="px-4 py-3 text-left text-slate-400 font-medium">
                Severity
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedOutliers.map((outlier, idx) => (
              <tr
                key={outlier.index}
                className={`border-b border-slate-800 hover:bg-slate-800/50 transition-colors ${
                  idx === 0 ? 'bg-rose-500/5' : ''
                }`}
              >
                {showIndices && (
                  <td className="px-4 py-3 text-slate-300 font-mono">{outlier.index}</td>
                )}
                <td className="px-4 py-3 text-slate-300 font-mono">
                  {outlier.value.toFixed(4)}
                </td>
                <td className={`px-4 py-3 font-mono ${getZScoreColor(outlier.zScore)}`}>
                  {outlier.zScore.toFixed(4)}
                </td>
                <td className="px-4 py-3 text-slate-400 font-mono">
                  {outlier.modifiedZScore?.toFixed(4) || 'N/A'}
                </td>
                <td className="px-4 py-3 text-slate-400 font-mono">
                  {outlier.iqrScore?.toFixed(4) || 'N/A'}
                </td>
                <td className="px-4 py-3">
                  {Math.abs(outlier.zScore) > threshold * 2 ? (
                    <span className="px-2 py-1 bg-rose-500/20 text-rose-400 rounded text-xs font-semibold">
                      EXTREME
                    </span>
                  ) : Math.abs(outlier.zScore) > threshold * 1.5 ? (
                    <span className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-xs font-semibold">
                      HIGH
                    </span>
                  ) : (
                    <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded text-xs">
                      MODERATE
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {sortedOutliers.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <svg
              className="mx-auto h-12 w-12 mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-lg font-medium mb-2">No outliers detected</p>
            <p className="text-sm">All values fall within the normal range</p>
          </div>
        )}
      </div>

      {/* Summary statistics */}
      {sortedOutliers.length > 0 && (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="text-sm text-slate-400 mb-1">Total Outliers</div>
            <div className="text-2xl font-bold text-slate-200">{sortedOutliers.length}</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="text-sm text-slate-400 mb-1">Avg |Z-Score|</div>
            <div className="text-2xl font-bold text-slate-200">{avgZScore.toFixed(2)}</div>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
            <div className="text-sm text-slate-400 mb-1">Max |Z-Score|</div>
            <div className="text-2xl font-bold text-rose-400">{maxZScore.toFixed(2)}</div>
          </div>
        </div>
      )}
    </ChartCard>
  )
}
