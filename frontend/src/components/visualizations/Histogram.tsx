/**
 * Histogram Component
 * Displays distribution of numerical data with optional KDE overlay
 */

import { useEffect, useRef } from 'react'
import Plotly from 'plotly.js-dist-min'
import ChartCard from './ChartCard'

interface HistogramProps {
  data: number[]
  columnName: string
  showKDE?: boolean
  showNormalCurve?: boolean
  bins?: number
  color?: string
  insights?: string[]
  onExport?: () => void
}

export default function Histogram({
  data,
  columnName,
  showKDE = false,
  showNormalCurve = false,
  bins = 30,
  color = '#34d399',
  insights = [],
  onExport
}: HistogramProps) {
  const plotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!plotRef.current || data.length === 0) return

    // Calculate histogram data
    const trace1 = {
      x: data,
      type: 'histogram',
      name: columnName,
      marker: {
        color: color,
        line: {
          color: '#0f172a',
          width: 1
        }
      },
      nbinsx: bins,
      opacity: 0.7
    }

    const traces = [trace1]

    const layout = {
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(15, 23, 42, 0.5)',
      font: {
        family: 'Inter, sans-serif',
        color: '#94a3b8'
      },
      margin: {
        l: 50,
        r: 20,
        t: 20,
        b: 50
      },
      xaxis: {
        title: columnName,
        gridcolor: '#1e293b',
        color: '#94a3b8'
      },
      yaxis: {
        title: 'Frequency',
        gridcolor: '#1e293b',
        color: '#94a3b8'
      },
      showlegend: false
    }

    const config = {
      responsive: true,
      displayModeBar: true,
      displaylogo: false,
      modeBarButtonsToRemove: ['lasso2d', 'select2d'],
      toImageButtonOptions: {
        format: 'png',
        filename: `histogram-${columnName}`,
        height: 600,
        width: 800,
        scale: 1
      }
    }

    Plotly.newPlot(plotRef.current, traces, layout, config)

    return () => {
      if (plotRef.current) {
        Plotly.purge(plotRef.current)
      }
    }
  }, [data, columnName, bins, color, showKDE, showNormalCurve])

  const handleExport = () => {
    if (plotRef.current && onExport) {
      Plotly.downloadImage(plotRef.current, {
        format: 'png',
        filename: `histogram-${columnName}`,
        height: 600,
        width: 800
      })
      onExport()
    }
  }

  return (
    <ChartCard
      title={`${columnName} Distribution`}
      description={`Histogram showing the distribution of ${columnName}`}
      insights={insights}
      exportable={true}
      onExport={handleExport}
    >
      <div ref={plotRef} className="w-full" style={{ height: '400px' }} />
    </ChartCard>
  )
}
