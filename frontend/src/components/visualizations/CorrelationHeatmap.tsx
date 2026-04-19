/**
 * Correlation Heatmap Component
 * Displays correlation matrix as a heatmap
 */

import { useEffect, useRef } from 'react'
import Plotly from 'plotly.js-dist-min'
import ChartCard from './ChartCard'

interface CorrelationHeatmapProps {
  correlations: Array<{
    col1: string
    col2: string
    correlation: number
  }>
  columnNames: string[]
  correlationMatrix?: number[][]
  colorScale?: 'RdBu' | 'Viridis' | 'Plasma'
  showValues?: boolean
  insights?: string[]
  onExport?: () => void
}

export default function CorrelationHeatmap({
  correlations,
  columnNames,
  correlationMatrix,
  colorScale = 'RdBu',
  showValues = true,
  insights = [],
  onExport
}: CorrelationHeatmapProps) {
  const plotRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!plotRef.current || columnNames.length === 0) return

    // Build correlation matrix if not provided
    const matrix = correlationMatrix || buildCorrelationMatrix(correlations, columnNames)

    const colorscale = colorScale === 'RdBu' ? 'RdBu' : colorScale === 'Viridis' ? 'Viridis' : 'Plasma'

    const trace = {
      z: matrix,
      x: columnNames,
      y: columnNames,
      type: 'heatmap',
      colorscale: colorscale,
      reversescale: true,
      showscale: true,
      colorbar: {
        title: 'Correlation',
        titleside: 'right',
        tickfont: {
          color: '#94a3b8'
        },
        titlefont: {
          color: '#94a3b8'
        }
      },
      text: showValues ? matrix.map(row => row.map(val => val.toFixed(2))) : undefined,
      texttemplate: showValues ? '%{text:.2f}' : undefined,
      textfont: {
        color: '#0f172a',
        size: 10
      },
      hovertemplate: '%{x} vs %{y}<br>Correlation: %{z:.3f}<extra></extra>'
    }

    const layout = {
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(15, 23, 42, 0.5)',
      font: {
        family: 'Inter, sans-serif',
        color: '#94a3b8'
      },
      margin: {
        l: 80,
        r: 20,
        t: 20,
        b: 80
      },
      xaxis: {
        side: 'bottom',
        tickangle: -45,
        tickfont: {
          color: '#94a3b8',
          size: 10
        },
        gridcolor: '#1e293b'
      },
      yaxis: {
        tickfont: {
          color: '#94a3b8',
          size: 10
        },
        gridcolor: '#1e293b'
      }
    }

    const config = {
      responsive: true,
      displayModeBar: true,
      displaylogo: false,
      modeBarButtonsToRemove: ['lasso2d', 'select2d', 'zoom2d', 'pan2d'],
      toImageButtonOptions: {
        format: 'png',
        filename: 'correlation-heatmap',
        height: 800,
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
  }, [correlations, columnNames, correlationMatrix, colorScale, showValues])

  const handleExport = () => {
    if (plotRef.current && onExport) {
      Plotly.downloadImage(plotRef.current, {
        format: 'png',
        filename: 'correlation-heatmap',
        height: 800,
        width: 800
      })
      onExport()
    }
  }

  return (
    <ChartCard
      title="Correlation Matrix"
      description="Heatmap showing correlations between all numerical variables"
      insights={insights}
      exportable={true}
      onExport={handleExport}
    >
      <div ref={plotRef} className="w-full" style={{ height: `${Math.max(500, columnNames.length * 40)}px` }} />
    </ChartCard>
  )
}

// Helper function to build correlation matrix from pair-wise correlations
function buildCorrelationMatrix(
  correlations: Array<{ col1: string; col2: string; correlation: number }>,
  columnNames: string[]
): number[][] {
  const n = columnNames.length
  const matrix: number[][] = []

  // Initialize matrix with 1s on diagonal
  for (let i = 0; i < n; i++) {
    matrix[i] = new Array(n).fill(0)
    matrix[i][i] = 1
  }

  // Fill in correlations
  correlations.forEach(({ col1, col2, correlation }) => {
    const i = columnNames.indexOf(col1)
    const j = columnNames.indexOf(col2)
    if (i !== -1 && j !== -1) {
      matrix[i][j] = correlation
      matrix[j][i] = correlation
    }
  })

  return matrix
}
