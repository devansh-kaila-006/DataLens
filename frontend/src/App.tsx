import { useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { testSupabaseConnection } from './lib/test-supabase'
import './App.css'

// Pages
import LoginPage from './pages/LoginPage'
import SignupPage from './pages/SignupPage'
import UploadPage from './pages/UploadPage'
import AnalysisPage from './pages/AnalysisPage'

// Components
import Navigation from './components/layout/Navigation'
import LandingHero from './components/LandingHero'
import LandingFeatures from './components/LandingFeatures'

interface TestResult {
  connection: boolean
  tables: boolean
  rls: boolean
  storage: boolean
  functions: boolean
}

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function App() {
  const [testing, setTesting] = useState(false)
  const [testResults, setTestResults] = useState<TestResult | null>(null)

  const runTest = async () => {
    setTesting(true)
    const results = await testSupabaseConnection()
    setTestResults(results)
    setTesting(false)
  }

  return (
    <AuthProvider>
      <BrowserRouter>
        <div className="min-h-screen bg-navy-900">
          <Navigation />
          <main>
            <Routes>
              {/* Auth Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/signup" element={<SignupPage />} />

              {/* Protected Routes */}
              <Route path="/upload" element={
                <ProtectedRoute>
                  <UploadPage />
                </ProtectedRoute>
              } />

              <Route path="/analysis/:id" element={
                <ProtectedRoute>
                  <AnalysisPage />
                </ProtectedRoute>
              } />

              {/* Home Route - Premium Landing Page */}
              <Route path="/" element={
                <>
                  <LandingHero />
                  <LandingFeatures />

                  {/* Test Connection Section - Premium Design */}
                  <div className="py-20 bg-navy-900 relative">
                    <div className="absolute inset-0 bg-grid opacity-10"></div>
                    <div className="relative container-premium">
                      <div className="max-w-3xl mx-auto text-center">
                        <h2 className="text-3xl font-bold text-white mb-4">System Status</h2>
                        <p className="text-slate-400 mb-12">
                          Verify your database and service connections
                        </p>

                        <div className="card-premium p-8">
                          <button
                            onClick={runTest}
                            disabled={testing}
                            className="btn btn-primary text-lg"
                          >
                            {testing ? (
                              <>
                                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={4}></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Testing System...
                              </>
                            ) : (
                              <>
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Run Connection Test
                              </>
                            )}
                          </button>

                          {/* Test Results */}
                          {testResults && (
                            <div className="mt-8 text-left space-y-3">
                              <h4 className="text-lg font-semibold text-white mb-4">Test Results:</h4>
                              {Object.entries(testResults).map(([test, passed]) => (
                                <div key={test} className="flex items-center p-3 bg-navy-900 rounded-lg">
                                  {passed ? (
                                    <svg className="h-5 w-5 text-emerald-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  ) : (
                                    <svg className="h-5 w-5 text-rose-400 mr-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                  )}
                                  <span className="text-slate-200 capitalize">{test.replace(/_/g, ' ')}</span>
                                  <span className="ml-auto">
                                    {passed ? (
                                      <span className="badge badge-success">Passed</span>
                                    ) : (
                                      <span className="badge badge-error">Failed</span>
                                    )}
                                  </span>
                                </div>
                              ))}

                              <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                                <p className="text-sm text-emerald-400">
                                  💡 Open your browser console (F12) to see detailed test logs
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </>
              } />

              {/* Protected dashboard routes (can add later) */}
              {/* <Route path="/dashboard" element={
                <ProtectedRoute>
                  <div className="p-8">Dashboard (Coming Soon)</div>
                </ProtectedRoute>
              } /> */}
            </Routes>
          </main>
        </div>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
