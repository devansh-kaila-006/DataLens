/**
 * Scatter Plot Component
 * Displays relationship between two numerical variables
 */

import { useEffect, useRef } from 'react'
import Plotly from 'plotly.js-dist-min'
import ChartCard from './ChartCard'

interface ScatterPlotProps {
  x: number[]
  y: number[]
  xColumn: string
  yColumn: string
  showTrendLine?: boolean
  colorBy?: string
  color?: string
  insights?: string[]
  onExport?: () => void
}

export default function ScatterPlot({
  x,
  y,
  xColumn,
  yColumn,
  showTrendLine = false,
  colorBy,
  color = '#34d399',
  insights = [],
  onExport
}: ScatterPlotProps) {
  const plotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!plotRef.current || x.length === 0 || y.length === 0) return

    const traces = [
      {
        x: x,
        y: y,
        mode: 'markers',
        type: 'scatter',
        name: `${xColumn} vs ${yColumn}`,
        marker: {
          color: color,
          size: 8,
          opacity: 0.6,
          line: {
            color: '#0f172a',
            width: 1
          }
        }
      }
    ]

    // Add trend line if requested
    if (showTrendLine) {
      const n = x.length
      const sumX = x.reduce((a, b) => a + b, 0)
      const sumY = y.reduce((a, b) => a + b, 0)
      const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0)
      const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0)

      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
      const intercept = (sumY - slope * sumX) / n

      const minX = Math.min(...x)
      const maxX = Math.max(...x)

      const trendLine = {
        x: [minX, maxX],
        y: [minX * slope + intercept, maxX * slope + intercept],
        mode: 'lines',
        type: 'scatter',
        name: 'Trend Line',
        line: {
          color: '#f87171',
          width: 2,
          dash: 'dash'
        },
        marker: {
          color: '#f87171',
          size: 4,
          opacity: 1,
          line: {
            color: '#f87171',
            width: 1
          }
        }
      }

      traces.push(trendLine)
    }

    const layout = {
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(15, 23, 42, 0.5)',
      font: {
        family: 'Inter, sans-serif',
        color: '#94a3b8'
      },
      margin: {
        l: 60,
        r: 20,
        t: 20,
        b: 60
      },
      xaxis: {
        title: xColumn,
        gridcolor: '#1e293b',
        color: '#94a3b8',
        zerolinecolor: '#475569'
      },
      yaxis: {
        title: yColumn,
        gridcolor: '#1e293b',
        color: '#94a3b8',
        zerolinecolor: '#475569'
      },
      showlegend: showTrendLine
    }

    const config = {
      responsive: true,
      displayModeBar: true,
      displaylogo: false,
      modeBarButtonsToRemove: ['lasso2d', 'select2d'],
      toImageButtonOptions: {
        format: 'png',
        filename: `scatter-${xColumn}-${yColumn}`,
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
  }, [x, y, xColumn, yColumn, showTrendLine, color, colorBy])

  const handleExport = () => {
    if (plotRef.current && onExport) {
      Plotly.downloadImage(plotRef.current, {
        format: 'png',
        filename: `scatter-${xColumn}-${yColumn}`,
        height: 600,
        width: 800
      })
      onExport()
    }
  }

  return (
    <ChartCard
      title={`${xColumn} vs ${yColumn}`}
      description={`Relationship between ${xColumn} and ${yColumn}`}
      insights={insights}
      exportable={true}
      onExport={handleExport}
    >
      <div ref={plotRef} className="w-full" style={{ height: '500px' }} />
    </ChartCard>
  )
}
