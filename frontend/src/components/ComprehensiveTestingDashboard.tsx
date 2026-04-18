/**
 * Comprehensive Testing Dashboard
 * Integrates security, API, auth, and E2E testing
 */

import { useState } from 'react'
import { securityTester } from '../lib/security-tests'
import { apiTester } from '../lib/api-tests'
import { authTestRunner } from '../lib/auth-test-fixtures'
import { e2eTester } from '../lib/e2e-tests'
import {
  ShieldIcon,
  SearchIcon,
  KeyIcon,
  CompassIcon,
  LoadingIcon,
  CheckCircleIcon,
  XCircleIcon,
  AlertTriangleIcon,
  CheckIcon,
  ZapIcon
} from './ui/Icon'

type TestCategory = 'all' | 'security' | 'api' | 'auth' | 'e2e'

export default function ComprehensiveTestingDashboard() {
  const [testing, setTesting] = useState(false)
  const [currentTest, setCurrentTest] = useState('')
  const [results, setResults] = useState<any>(null)
  const [selectedCategory, setSelectedCategory] = useState<TestCategory>('all')

  const runTests = async (category: TestCategory = 'all') => {
    setTesting(true)
    setSelectedCategory(category)

    try {
      const allResults: any = {
        security: null,
        api: null,
        auth: null,
        e2e: null
      }

      if (category === 'all' || category === 'security') {
        setCurrentTest('Running Security Tests...')
        allResults.security = await securityTester.runAllSecurityTests()
      }

      if (category === 'all' || category === 'api') {
        setCurrentTest('Running API Tests...')
        allResults.api = await apiTester.runAllAPITests()
      }

      if (category === 'all' || category === 'auth') {
        setCurrentTest('Running Authentication Tests...')
        allResults.auth = await authTestRunner.runAuthTests()
      }

      if (category === 'all' || category === 'e2e') {
        setCurrentTest('Running End-to-End Tests...')
        allResults.e2e = await e2eTester.runAllE2ETests()
      }

      // Calculate overall summary
      const totalTests =
        (allResults.security?.summary.total || 0) +
        (allResults.api?.summary.total || 0) +
        (allResults.auth?.summary.total || 0) +
        (allResults.e2e?.summary.total || 0)

      const totalPassed =
        (allResults.security?.summary.passed || 0) +
        (allResults.api?.summary.passed || 0) +
        (allResults.auth?.summary.passed || 0) +
        (allResults.e2e?.summary.passed || 0)

      const totalFailed =
        (allResults.security?.summary.failed || 0) +
        (allResults.api?.summary.failed || 0) +
        (allResults.auth?.summary.failed || 0) +
        (allResults.e2e?.summary.failed || 0)

      const allRecommendations = [
        ...(allResults.security?.recommendations || []),
        ...(allResults.api?.recommendations || []),
        ...(allResults.auth?.recommendations || []),
        ...(allResults.e2e?.recommendations || [])
      ]

      setResults({
        summary: {
          total: totalTests,
          passed: totalPassed,
          failed: totalFailed,
          score: totalTests > 0 ? Math.round((totalPassed / totalTests) * 100) : 0
        },
        categories: allResults,
        recommendations: allRecommendations
      })
    } catch (error) {
      console.error('Testing failed:', error)
      setResults({
        summary: { total: 0, passed: 0, failed: 0, score: 0 },
        categories: {},
        recommendations: ['Testing failed to complete']
      })
    } finally {
      setTesting(false)
      setCurrentTest('')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="card-premium p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Comprehensive Testing Dashboard</h3>
            <p className="text-slate-400 text-sm">
              Run security, API, authentication, and end-to-end tests
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => runTests('all')}
              disabled={testing}
              className="btn btn-primary"
            >
              {testing ? 'Testing...' : 'Run All Tests'}
            </button>
          </div>
        </div>

        {/* Category Selection */}
        <div className="grid grid-cols-5 gap-3 mb-6">
          {[
            { key: 'all', label: 'All Tests', icon: <ZapIcon className="w-6 h-6" /> },
            { key: 'security', label: 'Security', icon: <ShieldIcon className="w-6 h-6" /> },
            { key: 'api', label: 'API', icon: <SearchIcon className="w-6 h-6" /> },
            { key: 'auth', label: 'Auth', icon: <KeyIcon className="w-6 h-6" /> },
            { key: 'e2e', label: 'E2E', icon: <CompassIcon className="w-6 h-6" /> }
          ].map((category) => (
            <button
              key={category.key}
              onClick={() => runTests(category.key as TestCategory)}
              disabled={testing}
              className={`p-4 rounded-lg border transition-all duration-200 ${
                selectedCategory === category.key
                  ? 'bg-emerald-500/10 border-emerald-500 text-emerald-400'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600 hover:text-slate-300'
              }`}
            >
              <div className="flex justify-center mb-1">{category.icon}</div>
              <div className="text-xs font-medium">{category.label}</div>
            </button>
          ))}
        </div>

        {/* Current Test Status */}
        {currentTest && (
          <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
            <div className="flex items-center gap-3">
              <LoadingIcon className="w-5 h-5 text-indigo-400" />
              <span className="text-indigo-300 text-sm">{currentTest}</span>
            </div>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="space-y-6">
            {/* Overall Summary */}
            <div className="p-4 bg-navy-900 rounded-lg border border-slate-700">
              <h4 className="text-lg font-semibold text-white mb-4">Overall Test Summary</h4>
              <div className="grid grid-cols-4 gap-4 text-center">
                <div className="p-3 bg-slate-800 rounded-lg">
                  <div className="text-2xl font-bold text-white">{results.summary.total}</div>
                  <div className="text-xs text-slate-400">Total Tests</div>
                </div>
                <div className="p-3 bg-emerald-500/10 rounded-lg">
                  <div className="text-2xl font-bold text-emerald-400">{results.summary.passed}</div>
                  <div className="text-xs text-slate-400">Passed</div>
                </div>
                <div className="p-3 bg-rose-500/10 rounded-lg">
                  <div className="text-2xl font-bold text-rose-400">{results.summary.failed}</div>
                  <div className="text-xs text-slate-400">Failed</div>
                </div>
                <div className="p-3 bg-slate-800 rounded-lg">
                  <div className="text-2xl font-bold text-white">{results.summary.score}%</div>
                  <div className="text-xs text-slate-400">Score</div>
                </div>
              </div>
            </div>

            {/* Category Results */}
            {Object.entries(results.categories).map(([category, data]: [string, any]) => {
              if (!data || !data.summary) return null

              const categoryColors: Record<string, any> = {
                security: { bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-400' },
                api: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', text: 'text-indigo-400' },
                auth: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400' },
                e2e: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400' }
              }

              const colors = categoryColors[category] || categoryColors.security

              return (
                <div key={category} className={`p-4 rounded-lg border ${colors.bg} ${colors.border}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-md font-semibold text-white capitalize">{category} Tests</h4>
                    <span className={`text-sm font-medium ${colors.text}`}>
                      {data.summary.score}% Score
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center mb-3">
                    <div>
                      <div className="text-lg font-bold text-white">{data.summary.total}</div>
                      <div className="text-xs text-slate-400">Total</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-emerald-400">{data.summary.passed}</div>
                      <div className="text-xs text-slate-400">Passed</div>
                    </div>
                    <div>
                      <div className="text-lg font-bold text-rose-400">{data.summary.failed}</div>
                      <div className="text-xs text-slate-400">Failed</div>
                    </div>
                  </div>

                  {/* Test Results */}
                  {data.tests && data.tests.length > 0 && (
                    <div className="space-y-2">
                      {data.tests.map((test: any, index: number) => (
                        <div
                          key={index}
                          className={`p-3 rounded border ${
                            test.passed
                              ? 'bg-emerald-500/10 border-emerald-500/20'
                              : 'bg-rose-500/10 border-rose-500/20'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <div className="flex-shrink-0 mt-0.5">
                              {test.passed ? (
                                <CheckCircleIcon className="w-4 h-4 text-emerald-400" />
                              ) : (
                                <XCircleIcon className="w-4 h-4 text-rose-400" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-white text-sm truncate">
                                {test.testName || test.endpoint}
                              </div>
                              {test.message && (
                                <div className="text-xs text-slate-400 mt-1">{test.message}</div>
                              )}
                              {test.details && (
                                <div className="text-xs text-slate-500 mt-1 font-mono truncate">
                                  {test.details}
                                </div>
                              )}
                            </div>
                            {test.severity && (
                              <span className={`text-xs px-2 py-1 rounded ${
                                test.severity === 'critical' ? 'bg-rose-500/20 text-rose-400' :
                                test.severity === 'high' ? 'bg-rose-500/20 text-rose-400' :
                                test.severity === 'medium' ? 'bg-amber-500/20 text-amber-400' :
                                'bg-emerald-500/20 text-emerald-400'
                              }`}>
                                {test.severity}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {/* Recommendations */}
            {results.recommendations && results.recommendations.length > 0 && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <h4 className="text-md font-semibold text-white mb-3 flex items-center gap-2">
                  <AlertTriangleIcon className="w-5 h-5 text-amber-400" />
                  Recommendations & Issues
                </h4>
                <ul className="space-y-2">
                  {results.recommendations.map((rec: string, index: number) => (
                    <li key={index} className="text-sm text-slate-300 flex items-start gap-2">
                      <AlertTriangleIcon className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Testing Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Test Categories Info */}
        <div className="card-premium p-6">
          <h4 className="text-lg font-bold text-white mb-4">Test Categories</h4>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded bg-rose-500/20 flex items-center justify-center flex-shrink-0">
                <ShieldIcon className="w-4 h-4 text-rose-400" />
              </div>
              <div>
                <div className="font-medium text-white text-sm">Security Tests</div>
                <div className="text-xs text-slate-400">SQL injection, XSS, file upload, auth security</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                <SearchIcon className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <div className="font-medium text-white text-sm">API Tests</div>
                <div className="text-xs text-slate-400">Endpoint health, response times, rate limiting, CORS</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                <KeyIcon className="w-4 h-4 text-emerald-400" />
              </div>
              <div>
                <div className="font-medium text-white text-sm">Authentication Tests</div>
                <div className="text-xs text-slate-400">Session management, password reset, RLS policies</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <CompassIcon className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <div className="font-medium text-white text-sm">End-to-End Tests</div>
                <div className="text-xs text-slate-400">User flows, error recovery, performance</div>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Status */}
        <div className="card-premium p-6">
          <h4 className="text-lg font-bold text-white mb-4">Testing Status</h4>
          <div className="space-y-3">
            {[
              { check: 'Security testing framework implemented', done: true },
              { check: 'API testing utilities available', done: true },
              { check: 'Authentication test fixtures created', done: true },
              { check: 'E2E testing infrastructure ready', done: true },
              { check: 'Sample datasets for testing', done: true },
              { check: 'Comprehensive test reporting', done: true },
              { check: 'Test results export functionality', done: false },
              { check: 'Automated test scheduling', done: false },
              { check: 'CI/CD integration', done: false },
              { check: 'Performance monitoring dashboard', done: false }
            ].map((item, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className={`w-5 h-5 rounded flex items-center justify-center ${
                  item.done
                    ? 'bg-emerald-500/20 text-emerald-400'
                    : 'bg-slate-700 text-slate-500'
                }`}>
                  {item.done ? (
                    <CheckIcon className="w-3 h-3" />
                  ) : (
                    <div className="w-3 h-3 border-2 border-slate-500 rounded-full" />
                  )}
                </div>
                <span className={`text-sm ${item.done ? 'text-slate-300' : 'text-slate-500'}`}>
                  {item.check}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
