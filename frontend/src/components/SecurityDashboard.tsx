/**
 * Security Testing Dashboard
 * Interactive security testing interface for DataLens
 */

import { useState } from 'react'
import { securityTester } from '../lib/security-tests'
import {
  ShieldIcon,
  LoadingIcon,
  CheckCircleIcon,
  XCircleIcon,
  CheckIcon,
  AlertTriangleIcon
} from './ui/Icon'

export default function SecurityDashboard() {
  const [testing, setTesting] = useState(false)
  const [results, setResults] = useState<any>(null)
  const [currentTest, setCurrentTest] = useState('')

  const runSecurityTests = async () => {
    setTesting(true)
    setCurrentTest('Running comprehensive security tests...')

    try {
      const report = await securityTester.runAllSecurityTests()
      setResults(report)
    } catch (error) {
      console.error('Security testing failed:', error)
      setResults({
        summary: { total: 0, passed: 0, failed: 0, critical: 0, score: 0 },
        tests: [],
        recommendations: ['Security testing failed to complete']
      })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="card-premium p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-2">Security Testing Dashboard</h3>
            <p className="text-slate-400 text-sm">
              Verify your application's security measures before production deployment
            </p>
          </div>
          <button
            onClick={runSecurityTests}
            disabled={testing}
            className="btn btn-primary"
          >
            {testing ? (
              <>
                <LoadingIcon className="w-5 h-5 animate-spin" />
                Testing...
              </>
            ) : (
              <>
                <ShieldIcon className="w-5 h-5" />
                Run Security Tests
              </>
            )}
          </button>
        </div>

        {/* Current Test Status */}
        {currentTest && (
          <div className="p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-lg mb-4">
            <div className="flex items-center gap-2">
              <LoadingIcon className="w-4 h-4 text-indigo-400 animate-spin" />
              <span className="text-indigo-300 text-sm">{currentTest}</span>
            </div>
          </div>
        )}

        {/* Results */}
        {results && (
          <div className="space-y-4">
            {/* Summary */}
            <div className="p-4 bg-navy-900 rounded-lg border border-slate-700">
              <h4 className="text-lg font-semibold text-white mb-4">Security Test Summary</h4>
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

            {/* Test Results */}
            <div className="space-y-3">
              <h4 className="text-md font-semibold text-white">Individual Test Results</h4>
              {results.tests.map((test: any, index: number) => (
                <div key={index} className={`p-4 rounded-lg border ${
                  test.passed
                    ? 'bg-emerald-500/10 border-emerald-500/20'
                    : 'bg-rose-500/10 border-rose-500/20'
                }`}>
                  <div className="flex items-start gap-3">
                    {test.passed ? (
                      <CheckCircleIcon className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircleIcon className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-white">{test.testName}</span>
                        <span className={`badge ${
                          test.severity === 'critical' ? 'badge-error' :
                          test.severity === 'high' ? 'badge-error' :
                          test.severity === 'medium' ? 'badge-warning' :
                          'badge-success'
                        }`}>
                          {test.severity}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300 mt-1">{test.message}</p>
                      {test.details && (
                        <p className="text-xs text-slate-400 mt-2 font-mono">{test.details}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Recommendations */}
            {results.recommendations && results.recommendations.length > 0 && (
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                <h4 className="text-md font-semibold text-white mb-3 flex items-center gap-2">
                  <AlertTriangleIcon className="w-5 h-5 text-amber-400" />
                  Security Recommendations
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

      {/* Quick Security Checklist */}
      <div className="card-premium p-6">
        <h4 className="text-lg font-bold text-white mb-4">Quick Security Checklist</h4>
        <div className="space-y-3">
          {[
            { check: 'All API keys in Railway environment variables (not code)', done: true },
            { check: 'Row Level Security enabled on all Supabase tables', done: true },
            { check: 'File upload validation implemented (type, size, content)', done: true },
            { check: 'HTTPS enforced everywhere', done: true },
            { check: 'CORS properly configured', done: true },
            { check: 'Secrets never logged or exposed', done: true },
            { check: 'Dependencies scanned for vulnerabilities', done: true },
            { check: 'SQL injection prevention verified', done: false },
            { check: 'XSS prevention implemented', done: true },
            { check: 'Error messages don\'t leak information', done: true },
            { check: 'Session timeout configured', done: true },
            { check: 'Password strength requirements enforced', done: true },
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
  )
}
