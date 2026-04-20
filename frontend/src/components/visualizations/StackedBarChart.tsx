/**
 * Stacked Bar Chart Component
 * Compares categorical distributions across multiple categories with top-N limiting
 */

import { useEffect, useRef } from 'react'
import Plotly from 'plotly.js-dist-min'
import ChartCard from './ChartCard'

interface StackedBarChartProps {
  data: Record<string, Record<string, number>> // Nested object: { category1: { value1: count, value2: count }, ... }
  columnName: string
  categoryColumn?: string // Optional secondary column for cross-tabulation
  topN?: number // Limit to top N categories
  normalize?: boolean // Show percentages instead of counts
  sort?: 'desc' | 'asc' | 'name' // Sort order
  insights?: string[]
}

export default function StackedBarChart({
  data,
  columnName,
  categoryColumn,
  topN = 10,
  normalize = false,
  sort = 'desc',
  insights = []
}: StackedBarChartProps) {
  const plotRef = useRef<HTMLDivElement>(null)

  // Process data for visualization
  const processData = () => {
    // Flatten nested object into array of categories
    const categories = Object.keys(data)
    const allValues = new Set<string>()
    const valueTotals: Record<string, number> = {}

    // Collect all unique values and calculate totals
    categories.forEach(category => {
      Object.keys(data[category]).forEach(value => {
        allValues.add(value)
        valueTotals[value] = (valueTotals[value] || 0) + data[category][value]
      })
    })

    // Sort and limit values
    let sortedValues = Array.from(allValues).sort((a, b) => {
      if (sort === 'desc') return (valueTotals[b] || 0) - (valueTotals[a] || 0)
      if (sort === 'asc') return (valueTotals[a] || 0) - (valueTotals[b] || 0)
      return a.localeCompare(b)
    })

    if (topN && sortedValues.length > topN) {
      sortedValues = sortedValues.slice(0, topN)
    }

    // Prepare traces for each value
    const traces: any[] = sortedValues.map((value, index) => {
      const counts = categories.map(category => data[category][value] || 0)

      return {
        x: categories,
        y: counts,
        name: value,
        type: 'bar',
        marker: {
          color: getColor(index, sortedValues.length),
          line: { color: '#1e293b', width: 1 }
        },
        hovertemplate: `%{x}<br>${value}: %{y}${normalize ? '' : ' counts'}<extra></extra>`
      }
    })

    return { traces, categories, sortedValues }
  }

  // Generate distinct color palette
  const getColor = (index: number, total: number): string => {
    const colors = [
      '#34d399', // emerald-400
      '#60a5fa', // blue-400
      '#f472b6', // pink-400
      '#fbbf24', // amber-400
      '#a78bfa', // violet-400
      '#fb7185', // rose-400
      '#2dd4bf', // teal-400
      '#818cf8', // indigo-400
      '#fb923c', // orange-400
      '#c084fc', // purple-400
    ]

    if (total <= colors.length) {
      return colors[index % colors.length]
    }

    // Generate color variations if more than 10 categories
    const hue = (index * 360 / total) % 360
    return `hsl(${hue}, 70%, 60%)`
  }

  // Calculate statistics
  const calculateStats = () => {
    const categories = Object.keys(data)
    const totalRecords = categories.reduce((sum, cat) => {
      return sum + Object.values(data[cat]).reduce((a, b) => a + b, 0)
    }, 0)

    const dominantCategory = categories.reduce((max, cat) => {
      const catTotal = Object.values(data[cat]).reduce((a, b) => a + b, 0)
      const maxTotal = Object.values(data[max]).reduce((a, b) => a + b, 0)
      return catTotal > maxTotal ? cat : max
    }, categories[0])

    const uniqueValues = new Set<string>()
    categories.forEach(cat => {
      Object.keys(data[cat]).forEach(val => uniqueValues.add(val))
    })

    return { totalRecords, dominantCategory, uniqueValues: uniqueValues.size }
  }

  const stats = calculateStats()

  // Generate insights
  const autoInsights = insights.length > 0 ? insights : [
    `📊 ${Object.keys(data).length} ${categoryColumn ? 'categories' : 'values'} analyzed`,
    `📈 Total records: ${stats.totalRecords.toLocaleString()}`,
    stats.dominantCategory
      ? `🏆 Dominant: ${stats.dominantCategory} (${((Object.values(data[stats.dominantCategory]).reduce((a, b) => a + b, 0) / stats.totalRecords) * 100).toFixed(1)}%)`
      : undefined,
    stats.uniqueValues > 20
      ? `⚠️ High cardinality: ${stats.uniqueValues} unique values (consider grouping)`
      : undefined
  ].filter(Boolean) as string[]

  const handleExport = () => {
    if (plotRef.current) {
      Plotly.downloadImage(plotRef.current, {
        format: 'png',
        filename: `stacked-bar-${columnName}-${Date.now()}`,
        height: 800,
        width: 1200
      })
    }
  }

  useEffect(() => {
    try {
      const { traces } = processData()

      const layout = {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(15, 23, 42, 0.5)',
        font: { family: 'Inter, sans-serif', color: '#94a3b8', size: 12 },
        title: {
          text: `Categorical Distribution: ${columnName}`,
          font: { size: 16, color: '#f1f5f9' }
        },
        xaxis: {
          title: categoryColumn || 'Category',
          gridcolor: '#1e293b',
          color: '#94a3b8',
          zerolinecolor: '#475569'
        },
        yaxis: {
          title: normalize ? 'Percentage (%)' : 'Count',
          gridcolor: '#1e293b',
          color: '#94a3b8',
          zerolinecolor: '#475569'
        },
        barmode: 'stack',
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
    } catch (error) {
      console.error('Error rendering stacked bar chart:', error)
    }
  }, [data, columnName, categoryColumn, topN, normalize, sort])

  return (
    <ChartCard
      title={`Categorical Analysis: ${columnName}`}
      description={categoryColumn
        ? `Stacked distribution by ${categoryColumn}`
        : 'Distribution of categorical values'
      }
      insights={autoInsights}
      exportable={true}
      onExport={handleExport}
    >
      <div ref={plotRef} style={{ width: '100%', height: '450px' }} />
    </ChartCard>
  )
}
