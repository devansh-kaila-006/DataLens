/**
 * Outlier Scatter Plot Component
 * Multivariate outlier detection with Z-score and isolation-based visualization
 */

import { useEffect, useRef } from 'react'
import Plotly from 'plotly.js-dist-min'
import ChartCard from './ChartCard'

interface OutlierScatterPlotProps {
  data: Array<Record<string, any>> // Raw dataset
  xColumn: string
  yColumn: string
  outliers?: number[] // Array of outlier indices
  zScores?: number[] // Z-scores for each point
  colorColumn?: string // Optional column for color mapping
  threshold?: number // Z-score threshold for outliers (default: 3)
  insights?: string[]
}

export default function OutlierScatterPlot({
  data,
  xColumn,
  yColumn,
  outliers = [],
  zScores = [],
  colorColumn,
  threshold = 3,
  insights = []
}: OutlierScatterPlotProps) {
  const plotRef = useRef<HTMLDivElement>(null)

  // Process data for plotting
  const processData = () => {
    const x = data.map(d => d[xColumn])
    const y = data.map(d => d[yColumn])

    // Determine point colors based on outlier status
    const markerColors = data.map((_, i) => {
      if (outliers.includes(i)) {
        return '#f43f5e' // rose-500 for outliers
      }
      return '#34d399' // indigo-600 for normal points
    })

    // Determine marker sizes based on Z-score magnitude
    const markerSizes = data.map((_, i) => {
      if (zScores[i]) {
        // Scale size by Z-score magnitude (min 6, max 20)
        return Math.min(20, Math.max(6, 6 + Math.abs(zScores[i]) * 2))
      }
      return 6
    })

    // Calculate statistics
    const outlierCount = outliers.length
    const outlierPercentage = ((outlierCount / data.length) * 100).toFixed(1)
    const avgZScore = zScores.length > 0
      ? (zScores.reduce((sum, z) => sum + Math.abs(z), 0) / zScores.length).toFixed(2)
      : 'N/A'

    return { x, y, markerColors, markerSizes, outlierCount, outlierPercentage, avgZScore }
  }

  const { x, y, markerColors, markerSizes, outlierCount, outlierPercentage, avgZScore } = processData()

  // Generate insights
  const autoInsights = insights.length > 0 ? insights : [
    `${outlierCount} outliers detected (${outlierPercentage}% of data)`,
    zScores.length > 0
      ? `Average |Z-score|: ${avgZScore}`
      : undefined,
    threshold !== 3
      ? `Detection threshold: ±${threshold} σ`
      : undefined,
    outlierCount > 0
      ? `Investigate points highlighted in red`
      : 'No significant outliers detected'
  ].filter(Boolean) as string[]

  const handleExport = () => {
    if (plotRef.current) {
      Plotly.downloadImage(plotRef.current, {
        format: 'png',
        filename: `outlier-scatter-${xColumn}-vs-${yColumn}-${Date.now()}`,
        height: 800,
        width: 1200
      })
    }
  }

  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      try {
      const traces: any[] = [
        {
          x: x,
          y: y,
          mode: 'markers',
          type: 'scatter',
          name: 'Data Points',
          marker: {
            color: markerColors,
            size: markerSizes,
            opacity: 0.7,
            line: {
              color: '#1e293b',
              width: 1
            }
          },
          text: data.map((_, i) => {
            const info = [`Index: ${i}`]
            if (zScores[i]) {
              info.push(`Z-score: ${zScores[i].toFixed(2)}`)
            }
            if (outliers.includes(i)) {
              info.push('⚠️ OUTLIER')
            }
            return info.join('<br>')
          }),
          hovertemplate: '%{text}<extra></extra>'
        }
      ]

      // Add threshold ellipses if outliers detected
      if (outliers.length > 0) {
        const xMean = x.reduce((sum, val) => sum + val, 0) / x.length
        const yMean = y.reduce((sum, val) => sum + val, 0) / y.length

        // Draw normal range ellipse (approximate)
        const theta = Array.from({ length: 100 }, (_, i) => (i * 2 * Math.PI) / 100)
        const xStd = Math.sqrt(x.reduce((sum, val) => sum + Math.pow(val - xMean, 2), 0) / x.length)
        const yStd = Math.sqrt(y.reduce((sum, val) => sum + Math.pow(val - yMean, 2), 0) / y.length)

        const ellipseX = theta.map(t => xMean + threshold * xStd * Math.cos(t))
        const ellipseY = theta.map(t => yMean + threshold * yStd * Math.sin(t))

        traces.push({
          x: ellipseX,
          y: ellipseY,
          mode: 'lines',
          type: 'scatter',
          name: `${threshold}σ Threshold`,
          line: {
            color: '#fbbf24', // amber-400
            width: 2,
            dash: 'dash'
          },
          showlegend: true,
          hoverinfo: 'skip'
        })
      }

      const layout = {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(15, 23, 42, 0.5)',
        font: { family: 'Inter, sans-serif', color: '#94a3b8', size: 12 },
        title: {
          text: `Outlier Detection: ${xColumn} vs ${yColumn}`,
          font: { size: 16, color: '#f1f5f9' }
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
        hovermode: 'closest',
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
          .then(() => {
            console.log('✅ OutlierScatterPlot rendered successfully')
          })
          .catch((err: any) => {
            console.error('❌ OutlierScatterPlot error:', err)
          })
      } else {
        console.warn('⚠️ plotRef.current is null after requestAnimationFrame')
      }
    } catch (error) {
      console.error('Error rendering outlier scatter plot:', error)
    }
    })
  }, [data, xColumn, yColumn, outliers, zScores, colorColumn, threshold])

  return (
    <ChartCard
      title={`Outlier Detection: ${xColumn} vs ${yColumn}`}
      description="Multivariate outlier analysis with Z-score visualization"
      insights={autoInsights}
      exportable={true}
      onExport={handleExport}
    >
      <div ref={plotRef} style={{ width: '100%', height: '450px' }} />
    </ChartCard>
  )
}
