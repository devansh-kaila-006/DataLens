/**
 * Box Plot Component
 * Displays statistical summary with median, quartiles, and outliers
 */

import { useEffect, useRef } from 'react'
import Plotly from 'plotly.js-dist-min'
import ChartCard from './ChartCard'

interface BoxPlotProps {
  data: number[][]
  columnNames: string[]
  orientation?: 'horizontal' | 'vertical'
  color?: string
  insights?: string[]
  onExport?: () => void
}

export default function BoxPlot({
  data,
  columnNames,
  orientation = 'vertical',
  color = '#818cf8',
  insights = [],
  onExport
}: BoxPlotProps) {
  const plotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!plotRef.current || data.length === 0) return

    const traces = data.map((columnData, index) => ({
      y: orientation === 'vertical' ? columnData : undefined,
      x: orientation === 'horizontal' ? columnData : undefined,
      type: 'box',
      name: columnNames[index],
      marker: {
        color: color,
        outliercolor: '#f87171',
        outlierwidth: 2
      },
      boxpoints: 'outliers',
      jitter: 0.3,
      pointpos: -1.8,
      fillcolor: `${color}33`,
      line: {
        color: color,
        width: 2
      }
    }))

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
        b: 80
      },
      showlegend: orientation === 'horizontal',
      xaxis: orientation === 'vertical' ? {
        title: 'Features',
        tickangle: -45,
        gridcolor: '#1e293b',
        color: '#94a3b8'
      } : {
        title: 'Value',
        gridcolor: '#1e293b',
        color: '#94a3b8'
      },
      yaxis: orientation === 'vertical' ? {
        title: 'Value',
        gridcolor: '#1e293b',
        color: '#94a3b8'
      } : {
        title: 'Features',
        gridcolor: '#1e293b',
        color: '#94a3b8'
      }
    }

    const config = {
      responsive: true,
      displayModeBar: true,
      displaylogo: false,
      modeBarButtonsToRemove: ['lasso2d', 'select2d'],
      toImageButtonOptions: {
        format: 'png',
        filename: 'boxplot',
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
  }, [data, columnNames, orientation, color])

  const handleExport = () => {
    if (plotRef.current && onExport) {
      Plotly.downloadImage(plotRef.current, {
        format: 'png',
        filename: 'boxplot',
        height: 600,
        width: 800
      })
      onExport()
    }
  }

  return (
    <ChartCard
      title="Statistical Summary"
      description="Box plots showing median, quartiles, and outliers for each numerical column"
      insights={insights}
      exportable={true}
      onExport={handleExport}
    >
      <div ref={plotRef} className="w-full" style={{ height: `${Math.max(400, columnNames.length * 40)}px` }} />
    </ChartCard>
  )
}
