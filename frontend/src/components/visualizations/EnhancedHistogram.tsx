/**
 * Enhanced Histogram Component
 * Advanced histogram with KDE overlay, normal curve, and statistical annotations
 */

import { useState, useEffect, useRef } from 'react'
import Plotly from 'plotly.js-dist-min'
import ChartCard from './ChartCard'

interface EnhancedHistogramProps {
  data: number[]
  columnName: string
  showKDE?: boolean
  showNormalCurve?: boolean
  showStatistics?: boolean
  bins?: number | 'auto'
  statistics?: {
    mean: number
    median: number
    std: number
    min: number
    max: number
    q1: number
    q3: number
  }
  normalityTestResult?: {
    isNormal: boolean
    pValue: number
  }
  insights?: string[]
}

export default function EnhancedHistogram({
  data,
  columnName,
  showKDE = true,
  showNormalCurve = true,
  showStatistics = true,
  bins = 'auto',
  statistics,
  normalityTestResult,
  insights = []
}: EnhancedHistogramProps) {
  const [loading, setLoading] = useState(true)
  const plotRef = useRef<HTMLDivElement>(null)

  // Calculate histogram bins
  const calculateHistogram = () => {
    const min = Math.min(...data)
    const max = Math.max(...data)
    const binCount = bins === 'auto' ? Math.min(50, Math.ceil(Math.sqrt(data.length))) : bins

    const binWidth = (max - min) / binCount
    const binEdges = []
    for (let i = 0; i <= binCount; i++) {
      binEdges.push(min + i * binWidth)
    }

    const counts = new Array(binCount).fill(0)
    data.forEach(value => {
      const binIndex = Math.min(Math.floor((value - min) / binWidth), binCount - 1)
      counts[binIndex]++
    })

    return { bins: binEdges, counts, binWidth, min, max }
  }

  // Calculate KDE (Kernel Density Estimation)
  const calculateKDE = () => {
    const std = statistics?.std || Math.sqrt(data.reduce((sum, x) => sum + Math.pow(x - (statistics?.mean || 0), 2), 0) / data.length)

    // Silverman's rule of thumb for bandwidth
    const h = 1.06 * std * Math.pow(data.length, -0.2)

    const minX = Math.min(...data) - 3 * std
    const maxX = Math.max(...data) + 3 * std
    const numPoints = 200

    const kdeX: number[] = []
    const kdeY: number[] = []
    for (let i = 0; i <= numPoints; i++) {
      const x = minX + (i / numPoints) * (maxX - minX)
      kdeX.push(x)

      const y = data.reduce((sum, xi) => {
        return sum + gaussianKernel((x - xi) / h)
      }, 0) / (data.length * h)

      kdeY.push(y)
    }

    return { kdeX, kdeY }
  }

  // Gaussian kernel function
  const gaussianKernel = (u: number) => {
    return (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * u * u)
  }

  // Generate normal distribution curve
  const generateNormalCurve = () => {
    if (!statistics) return { x: [], y: [] }

    const mean = statistics.mean
    const std = statistics.std
    const minX = Math.min(...data) - 3 * std
    const maxX = Math.max(...data) + 3 * std

    const x: number[] = []
    const y: number[] = []
    for (let i = 0; i <= 100; i++) {
      const value = minX + (i / 100) * (maxX - minX)
      x.push(value)

      // Normal distribution PDF
      const pdfValue = (1 / (std * Math.sqrt(2 * Math.PI))) *
        Math.exp(-0.5 * Math.pow((value - mean) / std, 2))
      y.push(pdfValue)
    }

    return { x, y }
  }

  // Generate insights
  const autoInsights = insights.length > 0 ? insights : [
    normalityTestResult
      ? (normalityTestResult.isNormal
          ? `✅ ${columnName} follows normal distribution (p=${normalityTestResult.pValue.toFixed(3)})`
          : `⚠️ ${columnName} deviates from normal distribution (p=${normalityTestResult.pValue.toFixed(3)})`)
      : undefined,
    statistics
      ? `μ=${statistics.mean.toFixed(2)}, σ=${statistics.std.toFixed(2)}, median=${statistics.median.toFixed(2)}`
      : undefined
  ].filter(Boolean) as string[]

  const handleExport = () => {
    if (plotRef.current) {
      Plotly.downloadImage(plotRef.current, {
        format: 'png',
        filename: `histogram-${columnName}-${Date.now()}`,
        height: 800,
        width: 1200
      })
    }
  }

  useEffect(() => {
    setLoading(true)
    try {
      const { bins: binsArray, counts } = calculateHistogram()

      const traces: any[] = [
        {
          x: binsArray,
          y: counts,
          type: 'histogram',
          name: 'Distribution',
          marker: {
            color: 'rgba(52, 212, 153, 0.7)', // emerald-400 with opacity
            line: { color: '#34d399' }
          },
          histnorm: 'percent'
        }
      ]

      // Add KDE curve
      if (showKDE) {
        const { kdeX, kdeY } = calculateKDE()
        traces.push({
          x: kdeX,
          y: kdeY,
          mode: 'lines',
          name: 'KDE',
          line: {
            color: '#60a5fa', // blue-400
            width: 3
          }
        })
      }

      // Add normal distribution curve
      if (showNormalCurve) {
        const { x, y } = generateNormalCurve()
        traces.push({
          x: x,
          y: y,
          mode: 'lines',
          name: 'Normal',
          line: {
            color: '#f43f5e', // rose-500
            width: 2,
            dash: 'dash'
          }
        })
      }

      // Add statistics lines (mean, median)
      if (showStatistics && statistics) {
        // Mean line
        traces.push({
          x: [statistics.mean, statistics.mean],
          y: [0, Math.max(...counts)],
          mode: 'lines',
          name: 'Mean',
          line: {
            color: '#818cf8', // indigo-400
            width: 2,
            dash: 'dash'
          },
          showlegend: true
        })

        // Median line
        traces.push({
          x: [statistics.median, statistics.median],
          y: [0, Math.max(...counts)],
          mode: 'lines',
          name: 'Median',
          line: {
            color: '#c084fc', // purple-400
            width: 2,
            dash: 'dot'
          },
          showlegend: true
        })

        // Standard deviation bands (±1σ, ±2σ)
        if (statistics.std) {
          const std = statistics.std
          const yMax = Math.max(...counts)

          // +1σ
          traces.push({
            x: [statistics.mean + std, statistics.mean + std],
            y: [0, yMax * 0.3],
            mode: 'lines',
            name: '+1σ',
            line: { color: '#34d399', width: 1 },
            showlegend: false,
            hoverinfo: 'skip'
          })

          // -1σ
          traces.push({
            x: [statistics.mean - std, statistics.mean - std],
            y: [0, yMax * 0.3],
            mode: 'lines',
            name: '-1σ',
            line: { color: '#34d399', width: 1 },
            showlegend: false,
            hoverinfo: 'skip'
          })
        }
      }

      const layout = {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(15, 23, 42, 0.5)',
        font: { family: 'Inter, sans-serif', color: '#94a3b8', size: 12 },
        title: {
          text: `Distribution: ${columnName}`,
          font: { size: 16, color: '#f1f5f9' }
        },
        xaxis: {
          title: columnName,
          gridcolor: '#1e293b',
          color: '#94a3b8',
          zerolinecolor: '#475569'
        },
        yaxis: {
          title: 'Count / Density',
          gridcolor: '#1e293b',
          color: '#94a3b8',
          zerolinecolor: '#475569'
        },
        hovermode: 'x unified',
        bargap: 0.1,
        showlegend: true,
        legend: {
          x: 1,
          y: 1,
          xanchor: 'right',
          yanchor: 'top',
          bgcolor: 'rgba(15, 23, 42, 0.8)',
          bordercolor: '#334155',
          borderwidth: 1,
          font: { color: '#94a3b8', size: 11 }
        }
      }

      const config = {
        responsive: true,
        displayModeBar: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['lasso2d', 'select2d']
      }

      if (plotRef.current) {
        Plotly.newPlot(plotRef.current, traces, layout, config)
      }
      setLoading(false)
    } catch (error) {
      console.error('Error rendering histogram:', error)
      setLoading(false)
    }
  }, [data, showKDE, showNormalCurve, showStatistics, statistics, normalityTestResult])

  return (
    <ChartCard
      title={`Distribution Analysis: ${columnName}`}
      description="Enhanced histogram with KDE overlay and normality assessment"
      insights={autoInsights}
      exportable={true}
      onExport={handleExport}
      loading={loading}
    >
      <div ref={plotRef} style={{ width: '100%', height: '450px' }} />
    </ChartCard>
  )
}
