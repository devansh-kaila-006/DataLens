/**
 * Histogram Component
 * Displays distribution of numerical data with optional KDE overlay
 */

import { useEffect, useRef } from 'react'
import Plotly from 'plotly.js-dist-min'
import ChartCard from './ChartCard'
import { getChartColors } from '../../lib/chartColors'
import { useTheme } from '../../contexts/ThemeContext'

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
  const { theme } = useTheme()

  useEffect(() => {
    if (!plotRef.current || data.length === 0) return

    const chartColors = getChartColors()

    // Calculate histogram data
    const trace1 = {
      x: data,
      type: 'histogram',
      name: columnName,
      marker: {
        color: color,
        line: {
          color: chartColors.axis_color,
          width: 1
        }
      },
      nbinsx: bins,
      opacity: 0.7
    }

    const traces = [trace1]

    const layout = {
      paper_bgcolor: chartColors.paper_bgcolor,
      plot_bgcolor: chartColors.plot_bgcolor,
      font: {
        family: 'Inter, sans-serif',
        color: chartColors.font_color
      },
      margin: {
        l: 50,
        r: 20,
        t: 20,
        b: 50
      },
      xaxis: {
        title: columnName,
        gridcolor: chartColors.grid_color,
        color: chartColors.axis_color
      },
      yaxis: {
        title: 'Frequency',
        gridcolor: chartColors.grid_color,
        color: chartColors.axis_color
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
  }, [data, columnName, bins, color, showKDE, showNormalCurve, theme])

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
