/**
 * ACF/PACF Plot Component
 * Side-by-side autocorrelation and partial autocorrelation bar charts
 */

import { useEffect, useRef } from 'react'
import Plotly from 'plotly.js-dist-min'
import ChartCard from './ChartCard'

interface ACFPACFResult {
  acf?: number[]
  pacf?: number[]
  acf_confint_lower?: number[]
  acf_confint_upper?: number[]
  n_lags?: number
  error?: string
}

interface ACFPACFPlotProps {
  columnName: string
  autocorrelation: ACFPACFResult
}

export default function ACFPACFPlot({ columnName, autocorrelation }: ACFPACFPlotProps) {
  const plotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!autocorrelation || autocorrelation.error || !autocorrelation.acf) return

    const lags = Array.from({ length: autocorrelation.n_lags || 20 }, (_, i) => i)

    // ACF trace
    const acfTrace = {
      x: lags,
      y: autocorrelation.acf,
      type: 'bar',
      name: 'ACF',
      marker: { color: '#34d399' },
      xaxis: 'x',
      yaxis: 'y'
    }

    // Confidence intervals for ACF
    const traces: any[] = [acfTrace]

    if (autocorrelation.acf_confint_lower && autocorrelation.acf_confint_upper) {
      const ciTrace = {
        x: lags,
        y: autocorrelation.acf_confint_upper,
        type: 'scatter',
        mode: 'lines',
        line: { color: '#f43f5e', dash: 'dash' },
        xaxis: 'x',
        yaxis: 'y',
        showlegend: false
      }

      const ciTrace2 = {
        x: lags,
        y: autocorrelation.acf_confint_lower,
        type: 'scatter',
        mode: 'lines',
        line: { color: '#f43f5e', dash: 'dash' },
        xaxis: 'x',
        yaxis: 'y',
        showlegend: false,
        fill: 'tonexty',
        fillcolor: 'rgba(244, 63, 94, 0.1)'
      }

      traces.push(ciTrace, ciTrace2)
    }

    // PACF trace
    if (autocorrelation.pacf) {
      const pacfTrace = {
        x: lags,
        y: autocorrelation.pacf,
        type: 'bar',
        name: 'PACF',
        marker: { color: '#60a5fa' },
        xaxis: 'x2',
        yaxis: 'y2'
      }

      traces.push(pacfTrace)
    }

    const layout = {
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(15, 23, 42, 0.5)',
      font: { family: 'Inter, sans-serif', color: '#94a3b8', size: 12 },
      grid: { rows: 1, columns: 2 },
      height: 400,
      showlegend: true,
      xaxis: { title: 'Lag', gridcolor: '#1e293b', color: '#94a3b8' },
      yaxis: { title: 'ACF', gridcolor: '#1e293b', color: '#94a3b8' },
      xaxis2: { title: 'Lag', gridcolor: '#1e293b', color: '#94a3b8' },
      yaxis2: { title: 'PACF', gridcolor: '#1e293b', color: '#94a3b8' }
    }

    if (plotRef.current) {
      Plotly.newPlot(plotRef.current, traces, layout)
    }
  }, [columnName, autocorrelation])

  const handleExport = () => {
    if (plotRef.current) {
      Plotly.downloadImage(plotRef.current, {
        format: 'png',
        filename: `acf-pacf-${columnName}-${Date.now()}`,
        height: 800,
        width: 1200
      })
    }
  }

  return (
    <ChartCard
      title={`Autocorrelation: ${columnName}`}
      description="ACF and PACF with confidence intervals"
      exportable={true}
      onExport={handleExport}
    >
      {autocorrelation.error ? (
        <div className="text-center py-8 text-slate-500">
          <p className="text-lg">Autocorrelation not available</p>
          <p className="text-sm mt-2">{autocorrelation.error}</p>
        </div>
      ) : (
        <div ref={plotRef} style={{ width: '100%', height: '450px' }} />
      )}
    </ChartCard>
  )
}
