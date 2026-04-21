/**
 * Premium Login Page
 * Sophisticated authentication experience with split-screen design
 */

import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import AuthForm from '../components/auth/AuthForm'

// Generate stable random positions for floating data points
const generateFloatingPoints = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: `${Math.random() * 100}%`,
    top: `${Math.random() * 100}%`,
    animationDelay: `${Math.random() * 3}s`,
    animationDuration: `${4 + Math.random() * 2}s`,
  }))
}

export default function LoginPage() {
  // Generate stable floating points once on mount
  const floatingPoints = useMemo(() => generateFloatingPoints(15), [])
  return (
    <div className="min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid opacity-20"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-navy-900/50 to-navy-900"></div>

      {/* Floating Data Points */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {floatingPoints.map((point) => (
          <div
            key={point.id}
            className="absolute w-2 h-2 bg-emerald-400/10 rounded-full animate-float"
            style={{
              left: point.left,
              top: point.top,
              animationDelay: point.animationDelay,
              animationDuration: point.animationDuration,
            }}
          />
        ))}
      </div>

      <div className="relative z-10 min-h-screen flex">
        {/* Left Side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 bg-gradient-to-br from-navy-800 to-navy-900 p-12 flex-col justify-between">
          <div className="space-y-8">
            <Link to="/" className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-400 to-indigo-400 flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">DataLens</h1>
                <p className="text-sm text-gray-600">Intelligent Data Analysis</p>
              </div>
            </Link>

            <div className="space-y-6">
              <h2 className="text-5xl font-bold text-gray-900 leading-tight">
                Transform your data into
                <span className="gradient-text"> actionable insights</span>
              </h2>
              <p className="text-xl text-gray-600 max-w-xl">
                Upload CSV/Excel files and get comprehensive EDA reports with AI-powered insights in minutes.
              </p>
            </div>

            {/* Features */}
            <div className="space-y-4">
              {[
                'Automated exploratory data analysis',
                'AI-powered insights and recommendations',
                'Interactive visualizations and reports',
                'Enterprise-grade security and compliance'
              ].map((feature, index) => (
                <div key={index} className="flex items-center gap-3 text-slate-300">
                  <svg className="w-5 h-5 text-teal-600 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="text-3xl font-bold text-gray-900">10K+</div>
              <div className="text-sm text-gray-600">Datasets Analyzed</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">99.9%</div>
              <div className="text-sm text-gray-600">Uptime</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-gray-900">&lt;2min</div>
              <div className="text-sm text-gray-600">Avg Analysis</div>
            </div>
          </div>
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-8">
          <div className="w-full max-w-md">
            <div className="lg:hidden mb-8 text-center">
              <Link to="/" className="inline-flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-400 to-indigo-400 flex items-center justify-center">
                  <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <div className="text-left">
                  <h1 className="text-xl font-bold text-gray-900">DataLens</h1>
                  <p className="text-xs text-gray-600">Intelligent Data Analysis</p>
                </div>
              </Link>
            </div>

            <AuthForm mode="login" />
          </div>
        </div>
      </div>
    </div>
  )
}
