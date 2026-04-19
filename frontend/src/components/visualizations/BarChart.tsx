/**
 * Bar Chart Component
 * Displays categorical data frequency distributions
 */

import { useEffect, useRef } from 'react'
import Plotly from 'plotly.js-dist-min'
import ChartCard from './ChartCard'

interface BarChartProps {
  labels: string[]
  values: number[]
  columnName: string
  orientation?: 'vertical' | 'horizontal'
  topN?: number
  color?: string
  insights?: string[]
  onExport?: () => void
}

export default function BarChart({
  labels,
  values,
  columnName,
  orientation = 'vertical',
  topN,
  color = '#818cf8',
  insights = [],
  onExport
}: BarChartProps) {
  const plotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!plotRef.current || labels.length === 0) return

    // Sort and limit if topN specified
    let sortedData = labels.map((label, i) => ({
      label,
      value: values[i]
    }))

    sortedData.sort((a, b) => b.value - a.value)

    if (topN && topN < sortedData.length) {
      sortedData = sortedData.slice(0, topN)
    }

    const trace = {
      x: orientation === 'vertical' ? sortedData.map(d => d.label) : sortedData.map(d => d.value),
      y: orientation === 'vertical' ? sortedData.map(d => d.value) : sortedData.map(d => d.label),
      type: 'bar',
      marker: {
        color: color,
        opacity: 0.8
      },
      orientation: orientation === 'vertical' ? 'v' : 'h',
      text: sortedData.map(d => d.value.toLocaleString()),
      textposition: 'auto',
      hoverinfo: 'x+y+text'
    }

    const layout = {
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(15, 23, 42, 0.5)',
      font: {
        family: 'Inter, sans-serif',
        color: '#94a3b8'
      },
      margin: {
        l: orientation === 'horizontal' ? 80 : 50,
        r: 20,
        t: 20,
        b: orientation === 'vertical' ? 80 : 50
      },
      xaxis: {
        title: orientation === 'vertical' ? columnName : 'Count',
        gridcolor: '#1e293b',
        color: '#94a3b8',
        tickangle: orientation === 'vertical' ? -45 : 0
      },
      yaxis: {
        title: orientation === 'vertical' ? 'Count' : columnName,
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
        filename: `barchart-${columnName}`,
        height: 600,
        width: 800,
        scale: 1
      }
    }

    Plotly.newPlot(plotRef.current, [trace], layout, config)

    return () => {
      if (plotRef.current) {
        Plotly.purge(plotRef.current)
      }
    }
  }, [labels, values, columnName, orientation, topN, color])

  const handleExport = () => {
    if (plotRef.current && onExport) {
      Plotly.downloadImage(plotRef.current, {
        format: 'png',
        filename: `barchart-${columnName}`,
        height: 600,
        width: 800
      })
      onExport()
    }
  }

  return (
    <ChartCard
      title={`${columnName} Distribution`}
      description={`Bar chart showing frequency distribution${topN ? ` (top ${topN} categories)` : ''}`}
      insights={insights}
      exportable={true}
      onExport={handleExport}
    >
      <div ref={plotRef} className="w-full" style={{ height: '500px' }} />
    </ChartCard>
  )
}
