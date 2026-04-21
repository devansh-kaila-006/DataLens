/**
 * Regression Analysis Component
 * Scatter plots with regression lines and model summaries
 */

import { useEffect, useRef, useState } from 'react'
import Plotly from 'plotly.js-dist-min'
import ChartCard from './ChartCard'

interface RegressionResult {
  dependent: string
  independent: string | string[]
  coefficients: {
    intercept: number
    [key: string]: number
  }
  model_fit: {
    r_squared: number
    rmse?: number
    adj_r_squared?: number
    f_statistic?: number
    p_value?: number
  }
}

interface RegressionAnalysisProps {
  regressions: {
    simple_regression?: RegressionResult[]
    multiple_regression?: RegressionResult
  }
  data: Record<string, number[]>
}

export default function RegressionAnalysis({ regressions, data }: RegressionAnalysisProps) {
  const plotRef = useRef<HTMLDivElement>(null)
  const [selectedRegression, setSelectedRegression] = useState<string>('')

  // Initialize selection
  useEffect(() => {
    if (regressions.simple_regression && regressions.simple_regression.length > 0 && !selectedRegression) {
      const firstReg = regressions.simple_regression[0]
      setSelectedRegression(`${firstReg.dependent}_vs_${firstReg.independent}`)
    }
  }, [regressions, selectedRegression])

  useEffect(() => {
    if (!regressions.simple_regression || !selectedRegression || !data) return

    const regression = regressions.simple_regression.find(
      r => `${r.dependent}_vs_${r.independent}` === selectedRegression
    )

    if (!regression || typeof regression.independent !== 'string') return

    const xData = data[regression.independent]
    const yData = data[regression.dependent]

    if (!xData || !yData) return

    const scatterTrace = {
      x: xData,
      y: yData,
      mode: 'markers',
      type: 'scatter',
      name: 'Data',
      marker: {
        color: '#34d399',
        opacity: 0.6
      }
    }

    // Regression line
    const xMin = Math.min(...xData)
    const xMax = Math.max(...xData)
    const xLine = [xMin, xMax]

    // Find slope coefficient (could be 'slope' or 'beta_0')
    const slope = regression.coefficients.slope || regression.coefficients.beta_0 || 0
    const yLine = xLine.map(x =>
      regression.coefficients.intercept + slope * x
    )

    const lineTrace = {
      x: xLine,
      y: yLine,
      mode: 'lines',
      type: 'scatter',
      name: 'Regression Line',
      line: {
        color: '#f43f5e',
        width: 2
      }
    }

    const layout = {
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(15, 23, 42, 0.5)',
      font: { family: 'Inter, sans-serif', color: '#94a3b8', size: 12 },
      title: {
        text: `${regression.dependent} vs ${regression.independent}`,
        font: { size: 16, color: '#f1f5f9' }
      },
      xaxis: {
        title: regression.independent,
        gridcolor: '#1e293b',
        color: '#94a3b8'
      },
      yaxis: {
        title: regression.dependent,
        gridcolor: '#1e293b',
        color: '#94a3b8'
      },
      showlegend: true
    }

    if (plotRef.current) {
      Plotly.newPlot(plotRef.current, [scatterTrace, lineTrace], layout)
    }
  }, [regressions, selectedRegression, data])

  const handleExport = () => {
    if (plotRef.current) {
      Plotly.downloadImage(plotRef.current, {
        format: 'png',
        filename: `regression-${selectedRegression}-${Date.now()}`,
        height: 800,
        width: 1200
      })
    }
  }

  const selectedReg = regressions.simple_regression?.find(
    r => `${r.dependent}_vs_${r.independent}` === selectedRegression
  )

  // Find slope coefficient
  const getSlope = (reg: RegressionResult) => {
    return reg.coefficients.slope || reg.coefficients.beta_0 || 0
  }

  return (
    <ChartCard
      title="Regression Analysis"
      description="Linear regression models with diagnostics"
      exportable={true}
      onExport={handleExport}
    >
      {/* Regression selector */}
      {regressions.simple_regression && regressions.simple_regression.length > 0 && (
        <div className="mb-4">
          <label className="block text-sm text-slate-400 mb-2">Select Regression:</label>
          <select
            value={selectedRegression}
            onChange={(e) => setSelectedRegression(e.target.value)}
            className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            {regressions.simple_regression.map((reg) => (
              <option key={`${reg.dependent}_vs_${reg.independent}`} value={`${reg.dependent}_vs_${reg.independent}`}>
                {reg.dependent} vs {reg.independent} (R² = {reg.model_fit.r_squared.toFixed(3)})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Plot */}
      <div ref={plotRef} style={{ width: '100%', height: '400px' }} />

      {/* Model summary */}
      {selectedReg && (
        <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
          <div className="space-y-2 text-sm">
            <div className="font-semibold text-slate-300">Model Summary:</div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-400">R²:</span>{' '}
                <span className="text-indigo-600 font-semibold">{selectedReg.model_fit.r_squared.toFixed(4)}</span>
              </div>
              <div>
                <span className="text-slate-400">RMSE:</span>{' '}
                <span className="text-blue-400 font-semibold">
                  {selectedReg.model_fit.rmse?.toFixed(4) || 'N/A'}
                </span>
              </div>
              {selectedReg.model_fit.adj_r_squared !== undefined && (
                <div>
                  <span className="text-slate-400">Adj. R²:</span>{' '}
                  <span className="text-purple-400 font-semibold">{selectedReg.model_fit.adj_r_squared.toFixed(4)}</span>
                </div>
              )}
              {selectedReg.model_fit.f_statistic !== undefined && (
                <div>
                  <span className="text-slate-400">F-stat:</span>{' '}
                  <span className="text-orange-400 font-semibold">{selectedReg.model_fit.f_statistic.toFixed(4)}</span>
                </div>
              )}
            </div>
            <div className="text-xs text-slate-400 pt-2 border-t border-slate-700">
              <strong>Equation:</strong> {selectedReg.dependent} = {selectedReg.coefficients.intercept.toFixed(4)} + {getSlope(selectedReg).toFixed(4)} × {selectedReg.independent}
            </div>
          </div>
        </div>
      )}

      {/* Multiple regression summary */}
      {regressions.multiple_regression && Object.keys(regressions.multiple_regression).length > 0 && (
        <div className="mt-4 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
          <div className="text-sm font-semibold text-slate-300 mb-2">Multiple Regression:</div>
          <div className="text-xs text-slate-400 space-y-1">
            <div>
              <strong>Dependent:</strong> {regressions.multiple_regression.dependent}
            </div>
            <div>
              <strong>Independent:</strong> {Array.isArray(regressions.multiple_regression.independent)
                ? regressions.multiple_regression.independent.join(', ')
                : 'N/A'}
            </div>
            <div>
              <strong>R²:</strong> <span className="text-indigo-600">{regressions.multiple_regression.model_fit.r_squared.toFixed(4)}</span>
            </div>
          </div>
        </div>
      )}
    </ChartCard>
  )
}
