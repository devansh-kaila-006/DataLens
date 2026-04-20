/**
 * Q-Q Plot Component
 * Q-Q plot to assess normality of numerical distributions
 */

import { useEffect, useRef } from 'react'
import Plotly from 'plotly.js-dist-min'
import ChartCard from './ChartCard'

interface QQPlotProps {
  data: number[] // Raw data for quantile calculation
  columnName: string
  showReference?: boolean // y = x line
  showConfidence?: boolean // 95% CI band
  pValue?: number
  isNormal?: boolean
  insights?: string[]
}

export default function QQPlot({
  data,
  columnName,
  showReference = true,
  showConfidence = true,
  pValue,
  isNormal,
  insights = []
}: QQPlotProps) {
  const plotRef = useRef<HTMLDivElement>(null)

  // Calculate theoretical quantiles
  const calculateTheoreticalQuantiles = (sortedData: number[]) => {
    const n = sortedData.length
    const theoreticalQuantiles = []

    for (let i = 0; i < n; i++) {
      const p = (i - 0.5) / n // Plotting position
      const zScore = probit(p) // Inverse normal CDF
      theoreticalQuantiles.push(zScore)
    }

    return theoreticalQuantiles
  }

  // Probit function (inverse of normal CDF)
  const probit = (p: number): number => {
    // Beasley-Moro algorithm approximation
    const a0 = -3.969683028665376e+01
    const a1 = 2.209460984245205e+02
    const a2 = -2.759285104469687e+02
    const a3 = 1.383577518672690e+02
    const a4 = -3.066479806157354e+01
    const a5 = 1.631387643941929e+01

    const q = p - 0.5
    const r = q * q

    if (Math.abs(p - 0.5) <= 0.0000001) {
      const numerator = q * (a3 + r * (a4 + r * a5))
      const denominator = a0 + r * (a1 + r * (a2 + r * (a3 + r * (a4 + r * a5))))
      return numerator / denominator
    }

    const numerator = q
    const denominator = a0 + r * (a1 + r * (a2 + r * (a3 + r * (a4 + r * a5))))
    return numerator / denominator
  }

  // Calculate confidence interval
  const calculateConfidenceInterval = (theoreticalQuantiles: number[]) => {
    const n = theoreticalQuantiles.length
    const se = 1 / Math.sqrt(n) // Standard error
    const z95 = 1.96 // 95% CI z-score

    const upper = theoreticalQuantiles.map(z => z + z95 * se)
    const lower = theoreticalQuantiles.map(z => z - z95 * se)

    return { lower, upper }
  }

  // Calculate sample quantiles
  const calculateSampleQuantiles = (sortedData: number[]) => {
    return sortedData // Already sorted data is sample quantiles
  }

  // Generate insights
  const autoInsights = insights.length > 0 ? insights : [
    isNormal !== undefined
      ? (isNormal
          ? `✅ Data appears normally distributed`
          : `⚠️ Data deviates from normality`)
      : undefined,
    pValue !== undefined
      ? `p-value: ${pValue < 0.001 ? '< 0.001' : pValue.toFixed(3)}`
      : undefined,
    `Points: ${data.length}`
  ].filter(Boolean) as string[]

  const handleExport = () => {
    if (plotRef.current) {
      Plotly.downloadImage(plotRef.current, {
        format: 'png',
        filename: `qqplot-${columnName}-${Date.now()}`,
        height: 800,
        width: 1200
      })
    }
  }

  useEffect(() => {
    console.log('🔍 QQPlot rendering START:', {
      columnName,
      dataLength: data.length,
      dataSample: data.slice(0, 3),
      showReference,
      showConfidence
    })

    if (!data || data.length === 0) {
      console.warn('⚠️ No data available for Q-Q plot')
      return
    }

    // Use requestAnimationFrame to ensure DOM is ready
    requestAnimationFrame(() => {
      try {
      if (!data || data.length === 0) {
        return
      }

      const sortedData = [...data].sort((a, b) => a - b)
      const theoreticalQuantiles = calculateTheoreticalQuantiles(sortedData)
      const sampleQuantiles = calculateSampleQuantiles(sortedData)

      const traces: any[] = [
        {
          x: theoreticalQuantiles,
          y: sampleQuantiles,
          mode: 'markers',
          type: 'scatter',
          name: 'Data Points',
          marker: {
            color: isNormal ? '#34d399' : '#f43f5e',
            size: 8,
            opacity: 0.6
          }
        }
      ]

      // Add reference line (y = x)
      if (showReference) {
        const minQ = Math.min(...theoreticalQuantiles)
        const maxQ = Math.max(...theoreticalQuantiles)

        traces.push({
          x: [minQ, maxQ],
          y: [minQ, maxQ],
          mode: 'lines',
          name: 'Reference (y=x)',
          line: {
            color: '#f43f5e', // rose-500
            width: 2,
            dash: 'solid'
          },
          showlegend: true
        })
      }

      // Add confidence interval band
      if (showConfidence) {
        const { lower, upper } = calculateConfidenceInterval(theoreticalQuantiles)

        traces.push({
          x: [...theoreticalQuantiles, ...theoreticalQuantiles.slice().reverse()],
          y: [...upper, ...lower.slice().reverse()],
          fill: 'toself',
          type: 'scatter',
          name: '95% CI',
          mode: 'none',
          marker: { color: 'transparent' },
          line: { color: 'transparent' },
          showlegend: true,
          hoverinfo: 'skip'
        })
      }

      // Highlight outliers
      const threshold = 2 // Standard deviations from reference
      const outliers = theoreticalQuantiles.filter((_, i) => {
        const residual = sampleQuantiles[i] - theoreticalQuantiles[i]
        return Math.abs(residual) > threshold
      })

      if (outliers.length > 0 && outliers.length < 20) {
        // Add outlier annotations
        const annotations = outliers.map((val) => {
          const idx = theoreticalQuantiles.indexOf(val)
          return {
            x: val,
            y: sampleQuantiles[idx],
            xref: 'x',
            yref: 'y',
            text: '⚠️',
            showarrow: true,
            arrowhead: 2,
            ax: 0,
            ay: -40,
            font: { color: '#f43f5e', size: 10 }
          }
        })

        annotations.forEach(annot => {
          if (plotRef.current) {
            Plotly.relayout(plotRef.current, { annotations: [annot] })
          }
        })
      }

      const layout = {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(15, 23, 42, 0.5)',
        font: { family: 'Inter, sans-serif', color: '#94a3b8', size: 12 },
        title: {
          text: `Q-Q Plot: ${columnName}`,
          font: { size: 16, color: '#f1f5f9' }
        },
        xaxis: {
          title: 'Theoretical Quantiles',
          gridcolor: '#1e293b',
          color: '#94a3b8',
          zerolinecolor: '#475569'
        },
        yaxis: {
          title: 'Sample Quantiles',
          gridcolor: '#1e293b',
          color: '#94a3b8',
          zerolinecolor: '#475569'
        },
        hovermode: 'closest',
        showlegend: true,
        legend: {
          x: 0,
          y: 1,
          xanchor: 'left',
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
        console.log('📊 Rendering Q-Q plot with traces:', traces.length)
        Plotly.newPlot(plotRef.current, traces, layout, config)
          .then(() => {
            console.log('✅ Q-Q plot rendered successfully for', columnName)
          })
          .catch((err: any) => {
            console.error('❌ Q-Q plot rendering error:', err)
          })
      } else {
        console.warn('⚠️ plotRef.current is null after requestAnimationFrame')
      }
    } catch (error) {
      console.error('❌ Error rendering Q-Q plot:', error)
    }
    })
  }, [data, showReference, showConfidence, isNormal, pValue, columnName])

  return (
    <ChartCard
      title={`Normality Assessment: ${columnName}`}
      description="Q-Q plot with 95% confidence interval"
      insights={autoInsights}
      exportable={true}
      onExport={handleExport}
    >
      <div ref={plotRef} style={{ width: '100%', height: '450px' }} />
    </ChartCard>
  )
}
