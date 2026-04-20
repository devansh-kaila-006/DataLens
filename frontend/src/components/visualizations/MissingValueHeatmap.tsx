/**
 * Missing Value Heatmap Component
 * Visualizes missing data patterns across all columns with toggleable bar chart view
 */

import { useState, useEffect, useRef } from 'react'
import Plotly from 'plotly.js-dist-min'
import type { PlotlyData } from 'plotly.js-dist-min'
import ChartCard from './ChartCard'

interface MissingValueHeatmapProps {
  missingData: Record<string, {
    total_rows: number
    missing_count: number
    missing_percentage: number
  }>
  columnNames?: string[]
  threshold?: number // Default: 20%
  insights?: string[]
}

export default function MissingValueHeatmap({
  missingData,
  columnNames = Object.keys(missingData),
  threshold = 20,
  insights = []
}: MissingValueHeatmapProps) {
  const [viewMode, setViewMode] = useState<'heatmap' | 'bar'>('heatmap')
  const plotRef = useRef<HTMLDivElement>(null)

  const data = Object.entries(missingData).map(([col, data]) => ({
    column: col,
    total: data.total_rows,
    missing: data.missing_count,
    percentage: data.missing_percentage
  }))

  // Generate insights
  const problematicColumns = data
    .filter(d => d.percentage > threshold)
    .sort((a, b) => b.percentage - a.percentage)
    .slice(0, 5)

  const autoInsights = insights.length > 0 ? insights : [
    problematicColumns.length > 0
      ? `⚠️ ${problematicColumns.length} column(s) exceed ${threshold}% missing threshold: ${problematicColumns.map(c => c.column).join(', ')}`
      : '✅ All columns have acceptable missing values (< ' + threshold + '%)',
    data.length > 10 ? `📊 ${data.length} columns analyzed for missing value patterns` : undefined
  ].filter(Boolean) as string[]

  const handleExport = () => {
    if (plotRef.current) {
      Plotly.downloadImage(plotRef.current, {
        format: 'png',
        filename: `missing-values-${Date.now()}`,
        height: 800,
        width: 1200
      })
    }
  }

  const renderHeatmap = (): PlotlyData => {
    const z = [data.map(d => d.percentage)]
    const x = data.map(d => d.column)
    const y = ['Missing %']

    const colorScale = [
      [0, '#10b981'],    // Green (0% missing)
      [0.1, '#34d399'],  // Emerald
      [0.2, '#fbbf24'],  // Yellow (20% missing)
      [0.5, '#f59e0b'],  // Orange
      [1, '#f43f5e']     // Red (100% missing)
    ]

    return [
      {
        z: z,
        x: x,
        y: y,
        type: 'heatmap',
        colorscale: colorScale,
        hovertemplate: '%{x}<br>Missing: %{z:.1f}%<extra></extra>',
        showscale: true,
        colorbar: {
          title: 'Missing %',
          titlefont: { color: '#94a3b8' },
          tickfont: { color: '#94a3b8' }
        }
      }
    ]
  }

  const renderBarChart = (): PlotlyData => {
    const sortedData = [...data].sort((a, b) => b.percentage - a.percentage)

    return [
      {
        x: sortedData.map(d => d.percentage),
        y: sortedData.map(d => d.column),
        type: 'bar',
        orientation: 'h',
        marker: {
          color: sortedData.map(d => {
            if (d.percentage < 5) return '#10b981'
            if (d.percentage < 20) return '#fbbf24'
            return '#f43f5e'
          }),
          line: { color: '#1e293b' }
        },
        text: sortedData.map(d => `${d.percentage.toFixed(1)}%`),
        textposition: 'outside',
        textfont: { color: '#94a3b8' }
      }
    ]
  }

  const layout = {
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(15, 23, 42, 0.5)',
    font: { family: 'Inter, sans-serif', color: '#94a3b8', size: 12 },
    margin: { l: viewMode === 'bar' ? 150 : 60, r: 20, t: 40, b: 60 },
    xaxis: viewMode === 'bar' ? {
      title: 'Missing %',
      gridcolor: '#1e293b',
      color: '#94a3b8',
      zerolinecolor: '#475569'
    } : {
      visible: false
    },
    yaxis: viewMode === 'bar' ? {
      gridcolor: '#1e293b',
      color: '#94a3b8'
    } : {
      visible: false
    },
    showlegend: false
  }

  const config = {
    responsive: true,
    displayModeBar: true,
    displaylogo: false,
    modeBarButtonsToRemove: ['lasso2d', 'select2d']
  }

  useEffect(() => {
    if (plotRef.current) {
      const plotData = viewMode === 'heatmap' ? renderHeatmap() : renderBarChart()
      Plotly.newPlot(plotRef.current, plotData, layout, config)
    }
  }, [viewMode, data])

  return (
    <ChartCard
      title="Missing Value Patterns"
      description={viewMode === 'heatmap' ? 'Heatmap view of missing data across all columns' : 'Bar chart view sorted by missing percentage'}
      insights={autoInsights}
      exportable={true}
      onExport={handleExport}
    >
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setViewMode('heatmap')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewMode === 'heatmap'
              ? 'bg-indigo-500 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Heatmap View
        </button>
        <button
          onClick={() => setViewMode('bar')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            viewMode === 'bar'
              ? 'bg-indigo-500 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Bar View
        </button>
      </div>

      <div ref={plotRef} style={{ width: '100%', height: '400px' }} />
    </ChartCard>
  )
}
