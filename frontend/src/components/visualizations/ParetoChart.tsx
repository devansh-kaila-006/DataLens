/**
 * Pareto Chart Component
 * 80/20 rule analysis with dual-axis visualization (bars + cumulative line)
 */

import { useEffect, useRef } from 'react'
import Plotly from 'plotly.js-dist-min'
import ChartCard from './ChartCard'

interface ParetoChartProps {
  data: Record<string, number> // Category-value pairs
  columnName: string
  threshold?: number // Default: 80%
  topN?: number // Limit to top N categories
  showThreshold?: boolean // Show 80% threshold line
  insights?: string[]
}

export default function ParetoChart({
  data,
  columnName,
  threshold = 80,
  topN = 20,
  showThreshold = true,
  insights = []
}: ParetoChartProps) {
  const plotRef = useRef<HTMLDivElement>(null)

  // Process and sort data
  const processData = () => {
    // Convert to array and sort by value descending
    const sorted = Object.entries(data)
      .sort(([, a], [, b]) => b - a)
      .slice(0, topN)

    const categories = sorted.map(([cat]) => cat)
    const values = sorted.map(([, val]) => val)

    // Calculate cumulative percentages
    const total = values.reduce((sum, val) => sum + val, 0)
    const cumulative: number[] = []
    let runningSum = 0

    values.forEach(val => {
      runningSum += val
      cumulative.push((runningSum / total) * 100)
    })

    // Find vital few (categories contributing to threshold%)
    const vitalFewIndex = cumulative.findIndex(cum => cum >= threshold)
    const vitalFew = categories.slice(0, vitalFewIndex + 1)
    const trivialMany = categories.slice(vitalFewIndex + 1)

    return { categories, values, cumulative, total, vitalFew, trivialMany, vitalFewIndex }
  }

  const { categories, values, cumulative, total, vitalFew, trivialMany, vitalFewIndex } = processData()

  // Generate insights
  const autoInsights = insights.length > 0 ? insights : [
    `${categories.length} categories analyzed (top ${topN} shown)`,
    `Vital Few: ${vitalFew.length} categories contribute ~${threshold}% of total`,
    vitalFew.length < categories.length
      ? `Trivial Many: ${trivialMany.length} categories contribute remaining ${(100 - threshold).toFixed(0)}%`
      : undefined,
    `Total ${columnName}: ${total.toLocaleString()}`
  ].filter(Boolean) as string[]

  const handleExport = () => {
    if (plotRef.current) {
      Plotly.downloadImage(plotRef.current, {
        format: 'png',
        filename: `pareto-${columnName}-${Date.now()}`,
        height: 800,
        width: 1200
      })
    }
  }

  useEffect(() => {
    try {
      const traces: any[] = [
        // Bar chart - individual values
        {
          x: categories,
          y: values,
          type: 'bar',
          name: 'Count',
          marker: {
            color: categories.map((_, i) =>
              i <= vitalFewIndex ? '#34d399' : '#64748b'
            ),
            line: { color: '#1e293b', width: 1 }
          },
          text: values.map(v => v.toLocaleString()),
          textposition: 'outside',
          textfont: { color: '#94a3b8', size: 10 },
          yaxis: 'y',
          hovertemplate: '%{x}<br>Count: %{y}<extra></extra>'
        },
        // Line chart - cumulative percentage
        {
          x: categories,
          y: cumulative,
          type: 'scatter',
          mode: 'lines+markers',
          name: 'Cumulative %',
          yaxis: 'y2',
          line: {
            color: '#f43f5e', // rose-500
            width: 3
          },
          marker: {
            color: '#f43f5e',
            size: 6
          },
          hovertemplate: '%{x}<br>Cumulative: %{y:.1f}%<extra></extra>'
        }
      ]

      // Add threshold line if enabled
      if (showThreshold) {
        traces.push({
          x: categories,
          y: categories.map(() => threshold),
          type: 'scatter',
          mode: 'lines',
          name: `${threshold}% Threshold`,
          yaxis: 'y2',
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
          text: `Pareto Analysis: ${columnName}`,
          font: { size: 16, color: '#f1f5f9' }
        },
        xaxis: {
          title: columnName,
          gridcolor: '#1e293b',
          color: '#94a3b8',
          zerolinecolor: '#475569',
          tickangle: -45
        },
        yaxis: {
          title: 'Count',
          gridcolor: '#1e293b',
          color: '#94a3b8',
          zerolinecolor: '#475569',
          side: 'left'
        },
        yaxis2: {
          title: 'Cumulative %',
          gridcolor: '#1e293b',
          color: '#f43f5e',
          zerolinecolor: '#475569',
          overlaying: 'y',
          side: 'right',
          range: [0, 105],
          showgrid: false
        },
        hovermode: 'x unified',
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
        },
        shapes: showThreshold ? [{
          type: 'line',
          x0: vitalFew.length > 0 ? categories[vitalFew.length - 1] : categories[0],
          x1: vitalFew.length > 0 ? categories[vitalFew.length - 1] : categories[0],
          y0: 0,
          y1: 1,
          yref: 'paper',
          line: {
            color: '#fbbf24',
            width: 2,
            dash: 'dot'
          }
        }] : [],
        annotations: showThreshold && vitalFew.length > 0 ? [{
          x: categories[vitalFew.length - 1],
          y: 1.02,
          yref: 'paper',
          text: `Vital Few`,
          showarrow: false,
          font: { color: '#34d399', size: 12 },
          xanchor: 'center'
        }] : []
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
    } catch (error) {
      console.error('Error rendering Pareto chart:', error)
    }
  }, [data, columnName, threshold, topN, showThreshold])

  return (
    <ChartCard
      title={`Pareto Analysis: ${columnName}`}
      description={`80/20 rule analysis: ${vitalFew.length} categories contribute ~${threshold}% of total`}
      insights={autoInsights}
      exportable={true}
      onExport={handleExport}
    >
      <div ref={plotRef} style={{ width: '100%', height: '450px' }} />
    </ChartCard>
  )
}
