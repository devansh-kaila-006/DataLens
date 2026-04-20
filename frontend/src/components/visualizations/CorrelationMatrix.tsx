/**
 * Correlation Matrix Component
 * Switchable correlation matrices (Pearson, Spearman, Kendall) with significance testing
 */

import { useEffect, useRef, useState } from 'react'
import Plotly from 'plotly.js-dist-min'
import ChartCard from './ChartCard'

interface CorrelationResult {
  column1: string
  column2: string
  correlation: number
  p_value: number
  is_significant: boolean
}

interface CorrelationMatrixProps {
  correlations: {
    pearson?: CorrelationResult[]
    spearman?: CorrelationResult[]
    kendall?: CorrelationResult[]
  }
  columns: string[]
}

export default function CorrelationMatrix({ correlations, columns }: CorrelationMatrixProps) {
  const plotRef = useRef<HTMLDivElement>(null)
  const [method, setMethod] = useState<'pearson' | 'spearman' | 'kendall'>('pearson')

  useEffect(() => {
    if (!correlations[method] || !columns.length) return

    const data = correlations[method]!
    const n = columns.length

    // Build correlation matrix
    const matrix = Array.from({ length: n }, () => Array(n).fill(0))

    data.forEach(({ column1, column2, correlation }) => {
      const i = columns.indexOf(column1)
      const j = columns.indexOf(column2)
      if (i !== -1 && j !== -1) {
        matrix[i][j] = correlation
        matrix[j][i] = correlation
      }
    })

    // Diagonal is 1
    for (let i = 0; i < n; i++) {
      matrix[i][i] = 1
    }

    const traces = [
      {
        z: matrix,
        x: columns,
        y: columns,
        type: 'heatmap',
        colorscale: 'RdBu',
        zmid: 0,
        zmin: -1,
        zmax: 1,
        colorbar: {
          title: method === 'pearson' ? 'Pearson r' : method === 'spearman' ? 'Spearman ρ' : 'Kendall τ',
          titlefont: { color: '#94a3b8' },
          tickfont: { color: '#94a3b8' }
        },
        hovertemplate: '%{x} vs %{y}<br>Correlation: %{z:.3f}<extra></extra>'
      }
    ]

    // Add significance annotations
    const annotations = data
      .filter(d => d.is_significant)
      .map(({ column1, column2 }) => ({
        x: column1,
        y: column2,
        text: '*',
        showarrow: false,
        font: { color: '#f43f5e', size: 20 }
      }))

    const layout = {
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(15, 23, 42, 0.5)',
      font: { family: 'Inter, sans-serif', color: '#94a3b8', size: 11 },
      title: {
        text: `${method === 'pearson' ? 'Pearson' : method === 'spearman' ? 'Spearman' : 'Kendall'} Correlation Matrix`,
        font: { size: 16, color: '#f1f5f9' }
      },
      xaxis: {
        tickangle: -45,
        tickfont: { size: 10 }
      },
      yaxis: {
        tickfont: { size: 10 }
      },
      annotations,
      margin: { l: 100, r: 20, t: 60, b: 100 }
    }

    if (plotRef.current) {
      Plotly.newPlot(plotRef.current, traces, layout)
    }
  }, [correlations, method, columns])

  const handleExport = () => {
    if (plotRef.current) {
      Plotly.downloadImage(plotRef.current, {
        format: 'png',
        filename: `correlation-${method}-${Date.now()}`,
        height: 800,
        width: 1200
      })
    }
  }

  // Count significant correlations
  const significantCount = correlations[method]?.filter(c => c.is_significant).length || 0

  return (
    <ChartCard
      title="Correlation Analysis"
      description={`${significantCount} significant correlations (p < 0.05)`}
      exportable={true}
      onExport={handleExport}
    >
      {/* Method selector */}
      <div className="mb-4 flex gap-2">
        <button
          onClick={() => setMethod('pearson')}
          disabled={!correlations.pearson || correlations.pearson.length === 0}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            method === 'pearson'
              ? 'bg-indigo-500 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          } ${!correlations.pearson || correlations.pearson.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Pearson
        </button>
        <button
          onClick={() => setMethod('spearman')}
          disabled={!correlations.spearman || correlations.spearman.length === 0}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            method === 'spearman'
              ? 'bg-indigo-500 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          } ${!correlations.spearman || correlations.spearman.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Spearman
        </button>
        <button
          onClick={() => setMethod('kendall')}
          disabled={!correlations.kendall || correlations.kendall.length === 0}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            method === 'kendall'
              ? 'bg-indigo-500 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          } ${!correlations.kendall || correlations.kendall.length === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          Kendall
        </button>
      </div>

      <div ref={plotRef} style={{ width: '100%', height: '500px' }} />

      {/* Legend */}
      <div className="mt-4 text-xs text-slate-400">
        <div className="flex gap-4">
          <span className="font-semibold">*</span> = Statistically significant (p &lt; 0.05)
          <span>Blue = Negative correlation</span>
          <span>Red = Positive correlation</span>
        </div>
      </div>
    </ChartCard>
  )
}
