/**
 * Landing Hero Component - New Design System
 * Professional, data-focused hero section
 */

import { Link } from 'react-router-dom'

export default function LandingHero() {
  return (
    <div className="relative bg-white">
      {/* Main Content */}
      <div className="relative container-premium">
        <div className="grid grid-cols-12 gap-8 items-center min-h-screen py-20">
          {/* Left Column - Hero Content */}
          <div className="col-span-12 lg:col-span-7 space-y-8">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-medium">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span>AI-Powered Data Analysis</span>
              </div>

              <h1 className="text-6xl font-semibold text-gray-900 leading-tight tracking-tight">
                Transform Data into
                <span className="text-indigo-600"> Actionable Insights</span>
              </h1>

              <p className="text-lg text-gray-600 max-w-2xl leading-relaxed">
                Upload your datasets and get comprehensive EDA reports with AI-powered insights.
                From raw data to intelligent recommendations in seconds.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                to="/upload"
                className="btn btn-primary"
              >
                Try Demo Free
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                to="/signup"
                className="btn btn-secondary"
              >
                Get Started
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center gap-8 pt-8 border-t border-gray-200">
              <div className="space-y-1">
                <div className="text-3xl font-semibold text-gray-900">10K+</div>
                <div className="text-sm text-gray-600">Datasets Analyzed</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-semibold text-gray-900">99.9%</div>
                <div className="text-sm text-gray-600">Uptime SLA</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-semibold text-gray-900">&lt;2min</div>
                <div className="text-sm text-gray-600">Analysis Time</div>
              </div>
            </div>
          </div>

          {/* Right Column - Data Visualization */}
          <div className="col-span-12 lg:col-span-5">
            <div className="relative">
              {/* Main Chart Container */}
              <div className="card p-6 shadow-md">
                <div className="space-y-6">
                  {/* Chart Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-semibold text-gray-900">Analysis Preview</h3>
                      <p className="text-sm text-gray-600">Real-time insights</p>
                    </div>
                    <div className="flex gap-2">
                      <span className="badge badge-success">Live</span>
                    </div>
                  </div>

                  {/* Animated Chart */}
                  <div className="h-64 relative">
                    <svg className="w-full h-full" viewBox="0 0 400 200">
                      {/* Grid Lines */}
                      {[...Array(5)].map((_, i) => (
                        <line
                          key={i}
                          x1="0"
                          y1={i * 50}
                          x2="400"
                          y2={i * 50}
                          stroke="#E5E7EB"
                          strokeWidth="1"
                        />
                      ))}

                      {/* Data Line */}
                      <path
                        d="M0,150 Q50,120 100,130 T200,80 T300,100 T400,60"
                        stroke="#4F46E5"
                        strokeWidth="3"
                        fill="none"
                        className="animate-pulse"
                      />

                      {/* Area Fill */}
                      <path
                        d="M0,150 Q50,120 100,130 T200,80 T300,100 T400,60 L400,200 L0,200 Z"
                        fill="#4F46E5"
                        opacity="0.1"
                      />

                      {/* Data Points */}
                      {[0, 100, 200, 300, 400].map((x, i) => (
                        <circle
                          key={i}
                          cx={x}
                          cy={[150, 130, 80, 100, 60][i]}
                          r="6"
                          fill="#4F46E5"
                          className="animate-pulse"
                          style={{ animationDelay: `${i * 200}ms` }}
                        />
                      ))}
                    </svg>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-gray-50 rounded-md border border-gray-200">
                      <div className="text-2xl font-semibold text-indigo-600">+24%</div>
                      <div className="text-xs text-gray-600">Growth</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-md border border-gray-200">
                      <div className="text-2xl font-semibold text-gray-700">1.2K</div>
                      <div className="text-xs text-gray-600">Records</div>
                    </div>
                    <div className="text-center p-3 bg-gray-50 rounded-md border border-gray-200">
                      <div className="text-2xl font-semibold text-warning-600">98%</div>
                      <div className="text-xs text-gray-600">Accuracy</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </div>
  )
}
