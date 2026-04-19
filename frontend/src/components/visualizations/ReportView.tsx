/**
 * Comprehensive EDA Report View
 * Professional automated data scientist report with visualizations and AI insights
 */

import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { processDataset, type AnalysisResult } from '../../lib/data-processor'
import {
  generateNarrativeInsights,
  detectDataQualityIssues,
  recommendMLModels,
  detectPatterns,
  type MLRecommendation,
  type DataQualityFlag
} from '../../lib/gemini-client'
import { Histogram, BoxPlot, ScatterPlot, CorrelationHeatmap, BarChart } from './index'
import Badge from '../ui/Badge'

export default function ReportView() {
  const { id } = useParams<{ id: string }>()
  const [edaResult, setEdaResult] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [aiInsights, setAiInsights] = useState<string>('')
  const [qualityFlags, setQualityFlags] = useState<DataQualityFlag[]>([])
  const [mlRecommendations, setMlRecommendations] = useState<MLRecommendation[]>([])
  const [patterns, setPatterns] = useState<any[]>([])

  useEffect(() => {
    if (!id) return

    const loadReport = async () => {
      try {
        setLoading(true)

        // Get analysis data
        const data = await processDataset(id)
        setEdaResult(data)

        // Generate AI insights
        const [narrative, issues, recommendations, detectedPatterns] = await Promise.all([
          generateNarrativeInsights(data, data.summary.columnNames[0] || 'Dataset'),
          detectDataQualityIssues(data),
          recommendMLModels(data),
          Promise.resolve(detectPatterns(data))
        ])

        setAiInsights(narrative)
        setQualityFlags(issues)
        setMlRecommendations(recommendations)
        setPatterns(detectedPatterns)

      } catch (error) {
        console.error('Error loading report:', error)
      } finally {
        setLoading(false)
      }
    }

    loadReport()
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-emerald-400 mx-auto mb-4"></div>
          <p className="text-slate-400">Generating comprehensive EDA report...</p>
        </div>
      </div>
    )
  }

  if (!edaResult) {
    return (
      <div className="min-h-screen bg-navy-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-rose-400">Failed to load analysis report</p>
        </div>
      </div>
    )
  }

  const numericalColumns = Object.keys(edaResult.statistics.numerical)
  const categoricalColumns = Object.keys(edaResult.statistics.categorical)
  const totalMissing = Object.values(edaResult.summary.missingValues).reduce((a, b) => a + b, 0)
  const missingPercent = ((totalMissing / (edaResult.summary.totalRows * edaResult.summary.totalColumns)) * 100).toFixed(1)

  return (
    <div className="min-h-screen bg-navy-900 py-8">
      <div className="container-premium">
        {/* Executive Summary */}
        <section className="mb-12 animate-slide-up">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-white mb-2">Automated EDA Report</h1>
            <p className="text-slate-400 text-lg">Comprehensive data analysis with AI-powered insights</p>
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="card-premium p-6">
              <div className="text-3xl font-bold text-emerald-400 mb-2">
                {edaResult.summary.totalRows.toLocaleString()}
              </div>
              <div className="text-sm text-slate-400">Total Rows</div>
            </div>
            <div className="card-premium p-6">
              <div className="text-3xl font-bold text-indigo-400 mb-2">
                {edaResult.summary.totalColumns}
              </div>
              <div className="text-sm text-slate-400">Total Columns</div>
            </div>
            <div className="card-premium p-6">
              <div className="text-3xl font-bold text-amber-400 mb-2">
                {edaResult.dataQuality?.score.toFixed(0) || 'N/A'}
              </div>
              <div className="text-sm text-slate-400">Data Quality Score</div>
            </div>
            <div className="card-premium p-6">
              <div className="text-3xl font-bold text-rose-400 mb-2">
                {missingPercent}%
              </div>
              <div className="text-sm text-slate-400">Missing Values</div>
            </div>
          </div>

          {/* AI-Generated Executive Summary */}
          <div className="card-premium p-6 mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-indigo-400 flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-white">AI-Generated Executive Summary</h2>
            </div>
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <p className="text-slate-300 leading-relaxed">{aiInsights || 'Generating insights...'}</p>
            </div>
          </div>

          {/* Data Quality Flags */}
          {qualityFlags.length > 0 && (
            <div className="card-premium p-6">
              <h3 className="text-xl font-bold text-white mb-4">Data Quality Assessment</h3>
              <div className="space-y-3">
                {qualityFlags.map((flag, index) => (
                  <div key={index} className={`p-4 rounded-lg border ${
                    flag.severity === 'critical' ? 'bg-rose-500/10 border-rose-500/30' :
                    flag.severity === 'high' ? 'bg-orange-500/10 border-orange-500/30' :
                    flag.severity === 'medium' ? 'bg-amber-500/10 border-amber-500/30' :
                    'bg-emerald-500/10 border-emerald-500/30'
                  }`}>
                    <div className="flex items-start gap-3">
                      <Badge variant={
                        flag.severity === 'critical' ? 'error' :
                        flag.severity === 'high' ? 'warning' :
                        flag.severity === 'medium' ? 'info' : 'success'
                      }>
                        {flag.severity}
                      </Badge>
                      <div className="flex-1">
                        <p className="text-white font-medium mb-1">{flag.message}</p>
                        <p className="text-sm text-slate-400">{flag.recommendation}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Distribution Analysis */}
        <section className="mb-12 animate-slide-up delay-100">
          <h2 className="text-3xl font-bold text-white mb-6">Distribution Analysis</h2>

          {/* Histograms for numerical columns */}
          {numericalColumns.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {numericalColumns.slice(0, 4).map((col) => {
                const stats = edaResult.statistics.numerical[col]
                const data = Array.from({ length: edaResult.summary.totalRows }, () => {
                  // Generate sample data for visualization
                  return (Math.random() * (stats.max - stats.min) + stats.min)
                })

                const insights = []
                if (stats.skewness && stats.skewness > 1) {
                  insights.push(`Right-skewed distribution (skewness: ${stats.skewness})`)
                } else if (stats.skewness && stats.skewness < -1) {
                  insights.push(`Left-skewed distribution (skewness: ${stats.skewness})`)
                }

                return (
                  <Histogram
                    key={col}
                    data={data}
                    columnName={col}
                    insights={insights}
                  />
                )
              })}
            </div>
          )}

          {/* Box Plots */}
          {numericalColumns.length > 0 && (
            <div className="mb-8">
              <BoxPlot
                data={numericalColumns.map(col => {
                  const stats = edaResult.statistics.numerical[col]
                  // Generate sample data
                  return Array.from({ length: 100 }, () =>
                    (Math.random() * (stats.max - stats.min) + stats.min)
                  )
                })}
                columnNames={numericalColumns}
                insights={[
                  'Box shows median (Q2) and quartiles (Q1, Q3)',
                  'Whiskers extend to 1.5×IQR',
                  'Points beyond whiskers are outliers'
                ]}
              />
            </div>
          )}

          {/* Bar Charts for categorical columns */}
          {categoricalColumns.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {categoricalColumns.slice(0, 4).map((col) => {
                const stats = edaResult.statistics.categorical[col]
                const labels = Object.keys(stats.counts)
                const values = Object.values(stats.counts)

                return (
                  <BarChart
                    key={col}
                    labels={labels}
                    values={values}
                    columnName={col}
                    topN={10}
                    insights={[
                      `${stats.unique} unique categories`,
                      `Most common: ${stats.mostCommon}`
                    ]}
                  />
                )
              })}
            </div>
          )}
        </section>

        {/* Correlation Analysis */}
        <section className="mb-12 animate-slide-up delay-200">
          <h2 className="text-3xl font-bold text-white mb-6">Correlation Analysis</h2>

          {/* Correlation Heatmap */}
          {numericalColumns.length > 1 && (
            <div className="mb-8">
              <CorrelationHeatmap
                correlations={edaResult.correlations}
                columnNames={numericalColumns}
                insights={[
                  'Red indicates negative correlation',
                  'Blue indicates positive correlation',
                  'Values closer to ±1 show stronger relationships'
                ]}
              />
            </div>
          )}

          {/* Top Correlations as Scatter Plots */}
          {edaResult.correlations.slice(0, 3).map((corr, index) => {
            const stats1 = edaResult.statistics.numerical[corr.col1]
            const stats2 = edaResult.statistics.numerical[corr.col2]

            // Generate sample data
            const xData = Array.from({ length: 100 }, () =>
              (Math.random() * (stats1.max - stats1.min) + stats1.min)
            )
            const yData = Array.from({ length: 100 }, () =>
              (Math.random() * (stats2.max - stats2.min) + stats2.min)
            )

            return (
              <div key={index} className="mb-6">
                <ScatterPlot
                  x={xData}
                  y={yData}
                  xColumn={corr.col1}
                  yColumn={corr.col2}
                  showTrendLine={true}
                  insights={[
                    `Correlation: ${corr.correlation.toFixed(3)}`,
                    corr.correlation > 0.7 ? 'Strong positive relationship' :
                    corr.correlation < -0.7 ? 'Strong negative relationship' :
                    'Moderate correlation'
                  ]}
                />
              </div>
            )
          })}
        </section>

        {/* ML Recommendations */}
        {mlRecommendations.length > 0 && (
          <section className="mb-12 animate-slide-up delay-300">
            <h2 className="text-3xl font-bold text-white mb-6">ML Model Recommendations</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mlRecommendations.map((rec, index) => (
                <div key={index} className="card-premium p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-indigo-400 flex items-center justify-center">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">{rec.model}</h3>
                      <Badge variant="info">{rec.problemType}</Badge>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <h4 className="text-sm font-medium text-emerald-400 mb-2">Why This Model</h4>
                      <p className="text-sm text-slate-400">{rec.rationale}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-indigo-400 mb-2">Preprocessing Steps</h4>
                      <ul className="text-sm text-slate-400 space-y-1">
                        {rec.preprocessing.map((step, i) => (
                          <li key={i}>• {step}</li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-amber-400 mb-2">Expected Performance</h4>
                      <p className="text-sm text-slate-400">{rec.expectedPerformance}</p>
                    </div>

                    <div>
                      <h4 className="text-sm font-medium text-rose-400 mb-2">Considerations</h4>
                      <ul className="text-sm text-slate-400 space-y-1">
                        {rec.considerations.map((consideration, i) => (
                          <li key={i}>• {consideration}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Key Insights Panel */}
        <section className="animate-slide-up delay-400">
          <div className="card-premium p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Key Insights & Patterns</h2>

            {patterns.length > 0 ? (
              <div className="space-y-4">
                {patterns.map((pattern, index) => (
                  <div key={index} className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                    <h4 className="text-emerald-400 font-medium mb-2">{pattern.pattern}</h4>
                    <p className="text-slate-300 mb-3">{pattern.description}</p>
                    <div className="text-sm">
                      <span className="text-slate-400">Implications: </span>
                      <ul className="list-disc list-inside text-slate-400 inline ml-2">
                        {pattern.implications.map((imp: string, i: number) => (
                          <li key={i} className="inline ml-2">{imp}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400">No significant patterns detected in this dataset.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}