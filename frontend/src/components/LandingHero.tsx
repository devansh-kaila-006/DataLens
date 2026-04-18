/**
 * Sophisticated Landing Hero Component
 * Features animated data visualization and premium design
 */

import { Link } from 'react-router-dom'

export default function LandingHero() {
  return (
    <div className="relative min-h-screen bg-gradient-to-br from-navy-900 via-navy-800 to-navy-900 overflow-hidden">
      {/* Animated Background Pattern */}
      <div className="absolute inset-0 bg-grid opacity-30"></div>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-navy-900/50 to-navy-900"></div>

      {/* Floating Data Points */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-emerald-400/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${3 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative container-premium">
        <div className="grid grid-cols-12 gap-8 items-center min-h-screen py-20">
          {/* Left Column - Hero Content */}
          <div className="col-span-12 lg:col-span-7 space-y-8 animate-slide-up">
            <div className="space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
                <span>AI-Powered Data Analysis</span>
              </div>

              <h1 className="text-5xl lg:text-7xl font-bold text-white leading-tight">
                Transform Data into
                <span className="gradient-text"> Actionable Insights</span>
              </h1>

              <p className="text-xl text-slate-400 max-w-2xl leading-relaxed">
                Upload your datasets and get comprehensive EDA reports with AI-powered insights.
                From raw data to intelligent recommendations in seconds.
              </p>
            </div>

            <div className="flex flex-wrap gap-4">
              <Link
                to="/upload"
                className="btn btn-primary text-lg px-8 py-4"
              >
                Try Demo Free
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              <Link
                to="/signup"
                className="btn btn-secondary text-lg px-8 py-4"
              >
                Get Started
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex items-center gap-8 pt-8 border-t border-slate-700">
              <div className="space-y-1">
                <div className="text-3xl font-bold text-white">10K+</div>
                <div className="text-sm text-slate-400">Datasets Analyzed</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold text-white">99.9%</div>
                <div className="text-sm text-slate-400">Uptime SLA</div>
              </div>
              <div className="space-y-1">
                <div className="text-3xl font-bold text-white">&lt;2min</div>
                <div className="text-sm text-slate-400">Analysis Time</div>
              </div>
            </div>
          </div>

          {/* Right Column - Data Visualization */}
          <div className="col-span-12 lg:col-span-5 animate-scale-in delay-200">
            <div className="relative">
              {/* Main Chart Container */}
              <div className="card-premium p-6 backdrop-blur-sm">
                <div className="space-y-6">
                  {/* Chart Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold text-white">Analysis Preview</h3>
                      <p className="text-sm text-slate-400">Real-time insights</p>
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
                          stroke="rgba(148, 163, 184, 0.1)"
                          strokeWidth="1"
                        />
                      ))}

                      {/* Data Line */}
                      <path
                        d="M0,150 Q50,120 100,130 T200,80 T300,100 T400,60"
                        stroke="url(#gradient)"
                        strokeWidth="3"
                        fill="none"
                        className="animate-pulse-slow"
                      />

                      {/* Area Fill */}
                      <path
                        d="M0,150 Q50,120 100,130 T200,80 T300,100 T400,60 L400,200 L0,200 Z"
                        fill="url(#gradientArea)"
                        opacity="0.3"
                      />

                      {/* Data Points */}
                      {[0, 100, 200, 300, 400].map((x, i) => (
                        <circle
                          key={i}
                          cx={x}
                          cy={[150, 130, 80, 100, 60][i]}
                          r="6"
                          fill="#34d399"
                          className="animate-pulse"
                          style={{ animationDelay: `${i * 200}ms` }}
                        />
                      ))}

                      {/* Gradient Definitions */}
                      <defs>
                        <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#34d399" />
                          <stop offset="100%" stopColor="#818cf8" />
                        </linearGradient>
                        <linearGradient id="gradientArea" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#34d399" stopOpacity="0.3" />
                          <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 bg-navy-900 rounded-lg">
                      <div className="text-2xl font-bold text-emerald-400">+24%</div>
                      <div className="text-xs text-slate-400">Growth</div>
                    </div>
                    <div className="text-center p-3 bg-navy-900 rounded-lg">
                      <div className="text-2xl font-bold text-indigo-400">1.2K</div>
                      <div className="text-xs text-slate-400">Records</div>
                    </div>
                    <div className="text-center p-3 bg-navy-900 rounded-lg">
                      <div className="text-2xl font-bold text-amber-400">98%</div>
                      <div className="text-xs text-slate-400">Accuracy</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floating Elements */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-gradient-to-br from-emerald-400 to-indigo-400 rounded-2xl opacity-20 blur-2xl animate-pulse-slow"></div>
              <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-gradient-to-br from-indigo-400 to-rose-400 rounded-2xl opacity-20 blur-2xl animate-pulse-slow delay-300"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Scroll Indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
        <svg className="w-6 h-6 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </div>
  )
}
