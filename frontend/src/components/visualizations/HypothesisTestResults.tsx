/**
 * Hypothesis Test Results Component
 * Tabbed interface displaying statistical test results with significance indicators
 */

import { useState } from 'react'
import ChartCard from './ChartCard'

interface TestResult {
  p_value: number
  is_significant: boolean
  [key: string]: any
}

interface HypothesisTestResultsProps {
  tests: {
    one_sample_t?: Record<string, TestResult>
    two_sample_t?: Record<string, TestResult>
    anova?: Record<string, TestResult>
    chi_square?: Record<string, TestResult>
    mann_whitney?: Record<string, TestResult>
    kruskal_wallis?: Record<string, TestResult>
  }
}

export default function HypothesisTestResults({ tests }: HypothesisTestResultsProps) {
  const [activeTab, setActiveTab] = useState<string>('all')

  const testCategories = [
    { key: 'all', label: 'All Tests' },
    { key: 'one_sample_t', label: 'One-Sample T' },
    { key: 'two_sample_t', label: 'Two-Sample T' },
    { key: 'anova', label: 'ANOVA' },
    { key: 'chi_square', label: 'Chi-Square' },
    { key: 'mann_whitney', label: 'Mann-Whitney' },
    { key: 'kruskal_wallis', label: 'Kruskal-Wallis' }
  ]

  const renderTestResult = (testName: string, result: TestResult) => (
    <div key={testName} className="mb-3 p-3 bg-slate-800/50 rounded-lg border border-slate-700">
      <div className="flex justify-between items-center mb-2">
        <span className="text-sm font-mono text-slate-300">{testName}</span>
        <span className={`px-2 py-1 rounded text-xs font-semibold ${
          result.is_significant
            ? 'bg-rose-500/20 text-red-500'
            : 'bg-indigo-600/20 text-indigo-600'
        }`}>
          {result.is_significant ? 'Significant' : 'Not Significant'}
        </span>
      </div>
      <div className="text-xs text-slate-400">
        <span>p-value: </span>
        <span className={`font-semibold ${
          result.p_value < 0.001 ? 'text-red-500' :
          result.p_value < 0.01 ? 'text-orange-400' :
          result.p_value < 0.05 ? 'text-yellow-400' :
          'text-indigo-600'
        }`}>
          {result.p_value < 0.001 ? '< 0.001' : result.p_value.toFixed(3)}
        </span>
      </div>
    </div>
  )

  const renderTests = () => {
    if (activeTab === 'all') {
      return Object.entries(tests).flatMap(([, categoryTests]) =>
        categoryTests ? Object.entries(categoryTests).map(([name, result]) =>
          renderTestResult(name, result as TestResult)
        ) : []
      )
    }

    const categoryTests = tests[activeTab as keyof typeof tests]
    if (!categoryTests || Object.keys(categoryTests).length === 0) {
      return (
        <div className="text-center py-8 text-slate-500">
          <p>No tests available for this category</p>
        </div>
      )
    }

    return Object.entries(categoryTests).map(([name, result]) =>
      renderTestResult(name, result as TestResult)
    )
  }

  const totalTests = Object.values(tests).reduce((sum, category) =>
    sum + (category ? Object.keys(category).length : 0), 0
  )

  const significantTests = Object.values(tests).reduce((sum, category) =>
    sum + (category ? Object.values(category).filter(r => r.is_significant).length : 0), 0
  )

  return (
    <ChartCard
      title="Hypothesis Test Results"
      description={`Statistical significance testing (${significantTests}/${totalTests} significant)`}
    >
      {/* Tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {testCategories.map(category => {
          const count = category.key === 'all'
            ? totalTests
            : tests[category.key as keyof typeof tests]
              ? Object.keys(tests[category.key as keyof typeof tests]!).length
              : 0

          return (
            <button
              key={category.key}
              onClick={() => setActiveTab(category.key)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                activeTab === category.key
                  ? 'bg-indigo-500 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
              disabled={count === 0}
            >
              {category.label}
              {count > 0 && <span className="ml-1 text-xs opacity-80">({count})</span>}
            </button>
          )
        })}
      </div>

      {/* Results */}
      <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
        {renderTests()}
      </div>

      {/* Legend */}
      <div className="mt-4 pt-4 border-t border-slate-700">
        <div className="text-xs text-slate-400 space-y-1">
          <div>
            <span className="font-semibold">Significance Level:</span> α = 0.05
          </div>
          <div className="flex gap-4">
            <span className="text-red-500">p &lt; 0.05 → Significant</span>
            <span className="text-indigo-600">p ≥ 0.05 → Not Significant</span>
          </div>
          <div className="flex gap-4 text-xs">
            <span className="text-red-500">p &lt; 0.001 → Very Strong</span>
            <span className="text-orange-400">p &lt; 0.01 → Strong</span>
            <span className="text-yellow-400">p &lt; 0.05 → Moderate</span>
          </div>
        </div>
      </div>
    </ChartCard>
  )
}
