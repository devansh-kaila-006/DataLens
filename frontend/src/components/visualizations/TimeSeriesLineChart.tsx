/**
 * Time Series Line Chart Component
 * Displays time series data with trend lines and forecast overlays
 */

import { useEffect, useRef } from 'react'
import Plotly from 'plotly.js-dist-min'
import ChartCard from './ChartCard'

interface TimeSeriesPoint {
  date: string
  value: number
}

interface TrendAnalysis {
  linear: {
    slope: number
    p_value: number
    is_significant: boolean
  }
}

interface Forecast {
  forecast: number[]
  lower_bound?: number[]
  upper_bound?: number[]
}

interface TimeSeriesLineChartProps {
  data: TimeSeriesPoint[]
  columnName: string
  trendAnalysis?: TrendAnalysis
  forecast?: Forecast
  height?: number
}

export default function TimeSeriesLineChart({
  data,
  columnName,
  trendAnalysis,
  forecast,
  height = 450
}: TimeSeriesLineChartProps) {
  const plotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!data || data.length === 0) return

    const dates = data.map(d => d.date)
    const values = data.map(d => d.value)

    const traces: any[] = [
      {
        x: dates,
        y: values,
        mode: 'lines',
        name: columnName,
        line: {
          color: '#34d399',
          width: 2
        }
      }
    ]

    // Add trend line if significant
    if (trendAnalysis?.linear?.is_significant) {
      const slope = trendAnalysis.linear.slope
      const intercept = values[0]

      const trendY = values.map((_, i) => intercept + slope * i)

      traces.push({
        x: dates,
        y: trendY,
        mode: 'lines',
        name: 'Trend',
        line: {
          color: '#f43f5e',
          width: 2,
          dash: 'dash'
        }
      })
    }

    // Add forecast if available
    if (forecast && forecast.forecast) {
      const lastDate = new Date(dates[dates.length - 1])
      const forecastDates = Array.from({ length: forecast.forecast.length }, (_, i) => {
        const d = new Date(lastDate)
        d.setMonth(d.getMonth() + i + 1)
        return d.toISOString()
      })

      traces.push({
        x: forecastDates,
        y: forecast.forecast,
        mode: 'lines',
        name: 'Forecast',
        line: {
          color: '#60a5fa',
          width: 2
        }
      })

      // Confidence intervals
      if (forecast.lower_bound && forecast.upper_bound) {
        traces.push({
          x: [...forecastDates, ...forecastDates.reverse()],
          y: [...forecast.upper_bound, ...forecast.lower_bound.reverse()],
          fill: 'toself',
          type: 'scatter',
          name: '95% CI',
          line: { color: 'transparent' },
          marker: { color: 'transparent' },
          showlegend: true
        })
      }
    }

    const layout = {
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(15, 23, 42, 0.5)',
      font: { family: 'Inter, sans-serif', color: '#94a3b8', size: 12 },
      title: {
        text: `${columnName}${trendAnalysis?.linear?.is_significant ? ' (Significant Trend)' : ''}`,
        font: { size: 16, color: '#f1f5f9' }
      },
      xaxis: {
        title: 'Date',
        gridcolor: '#1e293b',
        color: '#94a3b8'
      },
      yaxis: {
        title: columnName,
        gridcolor: '#1e293b',
        color: '#94a3b8'
      },
      hovermode: 'x unified',
      showlegend: true,
      legend: {
        x: 0,
        y: 1,
        xanchor: 'left',
        yanchor: 'top',
        bgcolor: 'rgba(15, 23, 42, 0.8)',
        bordercolor: '#334155',
        borderwidth: 1
      }
    }

    const config = {
      responsive: true,
      displayModeBar: true,
      displaylogo: false
    }

    if (plotRef.current) {
      Plotly.newPlot(plotRef.current, traces, layout, config)
    }
  }, [data, columnName, trendAnalysis, forecast])

  const handleExport = () => {
    if (plotRef.current) {
      Plotly.downloadImage(plotRef.current, {
        format: 'png',
        filename: `timeseries-${columnName}-${Date.now()}`,
        height: 800,
        width: 1200
      })
    }
  }

  return (
    <ChartCard
      title={`${columnName} - Time Series`}
      description="Time series visualization with trend analysis and forecasting"
      exportable={true}
      onExport={handleExport}
    >
      <div ref={plotRef} style={{ width: '100%', height: `${height}px` }} />
    </ChartCard>
  )
}
