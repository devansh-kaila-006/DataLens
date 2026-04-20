/**
 * Seasonal Decomposition Component
 * 4-panel plot showing original, trend, seasonal, and residual components
 */

import { useEffect, useRef } from 'react'
import Plotly from 'plotly.js-dist-min'
import ChartCard from './ChartCard'

interface DecompositionResult {
  trend?: number[]
  seasonal?: number[]
  residual?: number[]
  period?: number
  error?: string
}

interface SeasonalDecompositionProps {
  data: number[]
  columnName: string
  decomposition: DecompositionResult
}

export default function SeasonalDecomposition({
  data,
  columnName,
  decomposition
}: SeasonalDecompositionProps) {
  const plotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!decomposition || decomposition.error || !decomposition.trend) return

    const n = data.length
    const x = Array.from({ length: n }, (_, i) => i)

    // 4 subplots: Original, Trend, Seasonal, Residual
    const traces = [
      {
        x: x,
        y: data,
        type: 'scatter',
        mode: 'lines',
        name: 'Original',
        line: { color: '#34d399' },
        xaxis: 'x',
        yaxis: 'y'
      },
      {
        x: x,
        y: decomposition.trend,
        type: 'scatter',
        mode: 'lines',
        name: 'Trend',
        line: { color: '#f43f5e' },
        xaxis: 'x2',
        yaxis: 'y2'
      },
      {
        x: x,
        y: decomposition.seasonal,
        type: 'scatter',
        mode: 'lines',
        name: 'Seasonal',
        line: { color: '#60a5fa' },
        xaxis: 'x3',
        yaxis: 'y3'
      },
      {
        x: x,
        y: decomposition.residual,
        type: 'scatter',
        mode: 'lines',
        name: 'Residual',
        line: { color: '#fbbf24' },
        xaxis: 'x4',
        yaxis: 'y4'
      }
    ]

    const layout = {
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(15, 23, 42, 0.5)',
      font: { family: 'Inter, sans-serif', color: '#94a3b8', size: 10 },
      grid: { rows: 4, columns: 1, pattern: 'independent' },
      height: 800,
      showlegend: false,
      xaxis: { title: 'Time' },
      yaxis: { title: 'Original' },
      xaxis2: { title: 'Time' },
      yaxis2: { title: 'Trend' },
      xaxis3: { title: 'Time' },
      yaxis3: { title: 'Seasonal' },
      xaxis4: { title: 'Time' },
      yaxis4: { title: 'Residual' }
    }

    if (plotRef.current) {
      Plotly.newPlot(plotRef.current, traces, layout)
    }
  }, [data, columnName, decomposition])

  const handleExport = () => {
    if (plotRef.current) {
      Plotly.downloadImage(plotRef.current, {
        format: 'png',
        filename: `decomposition-${columnName}-${Date.now()}`,
        height: 800,
        width: 1200
      })
    }
  }

  return (
    <ChartCard
      title={`Seasonal Decomposition: ${columnName}`}
      description={decomposition.period ? `Period: ${decomposition.period}` : 'STL decomposition'}
      exportable={true}
      onExport={handleExport}
    >
      {decomposition.error ? (
        <div className="text-center py-8 text-slate-500">
          <p className="text-lg">Decomposition not available</p>
          <p className="text-sm mt-2">{decomposition.error}</p>
        </div>
      ) : (
        <div ref={plotRef} style={{ width: '100%', height: '850px' }} />
      )}
    </ChartCard>
  )
}
