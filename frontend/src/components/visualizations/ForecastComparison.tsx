/**
 * Forecast Comparison Component
 * Compare multiple forecasting methods with accuracy metrics
 */

import { useEffect, useRef, useState } from 'react'
import Plotly from 'plotly.js-dist-min'
import ChartCard from './ChartCard'

interface ForecastMethod {
  method: string
  forecast: number[]
  lower_bound?: number[]
  upper_bound?: number[]
  accuracy_metrics?: {
    mae: number
    rmse: number
  }
  error?: string
}

interface ForecastComparisonProps {
  columnName: string
  historicalData: number[]
  forecasts: Record<string, ForecastMethod>
}

export default function ForecastComparison({
  columnName,
  historicalData,
  forecasts
}: ForecastComparisonProps) {
  const plotRef = useRef<HTMLDivElement>(null)
  const [selectedMethod, setSelectedMethod] = useState<string>('')

  useEffect(() => {
    if (!historicalData || !forecasts) return

    const methods = Object.keys(forecasts).filter(key => {
      const [, method] = key.split('_')
      return !forecasts[key].error && method === selectedMethod
    })

    if (methods.length === 0 && Object.keys(forecasts).length > 0) {
      // Initialize with first available method
      const firstKey = Object.keys(forecasts)[0]
      const [, method] = firstKey.split('_')
      setSelectedMethod(method)
    }
  }, [forecasts, selectedMethod])

  useEffect(() => {
    if (!historicalData || !forecasts || !selectedMethod) return

    const n = historicalData.length
    const xHistorical = Array.from({ length: n }, (_, i) => i)

    const traces: any[] = [
      {
        x: xHistorical,
        y: historicalData,
        mode: 'lines',
        name: 'Historical',
        line: {
          color: '#34d399',
          width: 2
        }
      }
    ]

    // Find selected forecast
    const forecastKey = Object.keys(forecasts).find(key => {
      const [, method] = key.split('_')
      return method === selectedMethod && !forecasts[key].error
    })

    if (forecastKey) {
      const forecast = forecasts[forecastKey]
      const xForecast = Array.from({ length: forecast.forecast.length }, (_, i) => n + i)

      traces.push({
        x: xForecast,
        y: forecast.forecast,
        mode: 'lines',
        name: `${selectedMethod} Forecast`,
        line: {
          color: '#60a5fa',
          width: 2
        }
      })

      // Add confidence intervals if available
      if (forecast.lower_bound && forecast.upper_bound) {
        traces.push({
          x: [...xForecast, ...xForecast.reverse()],
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
        text: `Forecast Comparison: ${columnName}`,
        font: { size: 16, color: '#f1f5f9' }
      },
      xaxis: {
        title: 'Time',
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

    if (plotRef.current) {
      Plotly.newPlot(plotRef.current, traces, layout)
    }
  }, [historicalData, forecasts, selectedMethod, columnName])

  const handleExport = () => {
    if (plotRef.current) {
      Plotly.downloadImage(plotRef.current, {
        format: 'png',
        filename: `forecast-comparison-${columnName}-${Date.now()}`,
        height: 800,
        width: 1200
      })
    }
  }

  // Get unique methods
  const methods = Object.keys(forecasts).reduce((acc, key) => {
    const [, method] = key.split('_')
    if (!forecasts[key].error && !acc.includes(method)) {
      acc.push(method)
    }
    return acc
  }, [] as string[])

  return (
    <ChartCard
      title={`Forecast Comparison: ${columnName}`}
      description="Compare forecasting methods with accuracy metrics"
      exportable={true}
      onExport={handleExport}
    >
      {methods.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {methods.map(method => {
            const forecastKey = Object.keys(forecasts).find(key => {
              const [, m] = key.split('_')
              return m === method
            })
            const forecast = forecastKey ? forecasts[forecastKey] : null

            return (
              <button
                key={method}
                onClick={() => setSelectedMethod(method)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedMethod === method
                    ? 'bg-indigo-500 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {method.replace('_', ' ').toUpperCase()}
                {forecast?.accuracy_metrics && (
                  <span className="ml-2 text-xs opacity-80">
                    (RMSE: {forecast.accuracy_metrics!.rmse.toFixed(2)})
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      <div ref={plotRef} style={{ width: '100%', height: '450px' }} />
    </ChartCard>
  )
}
