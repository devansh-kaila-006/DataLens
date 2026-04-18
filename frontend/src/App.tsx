import { useState } from 'react'
import { testSupabaseConnection } from './lib/test-supabase'
import './App.css'

interface TestResult {
  connection: boolean
  tables: boolean
  rls: boolean
  storage: boolean
  functions: boolean
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-3xl font-bold text-purple-600">DataLens</h1>
              <span className="ml-4 text-sm text-gray-500">Automated EDA Platform</span>
            </div>
            <div className="text-sm text-gray-600">
              Supabase + Railway + Vercel
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Transform Data into Insights
          </h2>
          <p className="mt-4 text-xl text-gray-600">
            Upload CSV/Excel files and get comprehensive EDA reports with AI-powered insights
          </p>
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Database Ready</h3>
                <p className="text-sm text-gray-500">Supabase tables & RLS configured</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Workers Ready</h3>
                <p className="text-sm text-gray-500">3 Python services configured</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Frontend Ready</h3>
                <p className="text-sm text-gray-500">React + TypeScript + Tailwind</p>
              </div>
            </div>
          </div>
        </div>

        {/* Test Connection Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-12">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Test Supabase Connection</h3>
            <p className="text-gray-600 mb-6">
              Verify your database setup by running the connection test
            </p>

            <button
              onClick={runTest}
              disabled={testing}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {testing ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Testing...
                </>
              ) : (
                'Run Connection Test'
              )}
            </button>

            {/* Test Results */}
            {testResults && (
              <div className="mt-8 text-left">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">Test Results:</h4>
                <div className="space-y-2">
                  {Object.entries(testResults).map(([test, passed]) => (
                    <div key={test} className="flex items-center">
                      {passed ? (
                        <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      <span className="text-gray-700">{test}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 p-4 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-600">
                    💡 Open your browser console (F12) to see detailed test logs
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Next Steps */}
        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg shadow-lg p-8 text-white">
          <h3 className="text-2xl font-bold mb-4">Next Steps</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start">
              <span className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-white bg-opacity-20 text-sm font-bold mr-3">1</span>
              <div>
                <h4 className="font-semibold">Deploy Workers to Railway</h4>
                <p className="text-sm text-purple-100">Connect GitHub & deploy 3 Python services</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-white bg-opacity-20 text-sm font-bold mr-3">2</span>
              <div>
                <h4 className="font-semibold">Build Authentication</h4>
                <p className="text-sm text-purple-100">Create login/signup pages with Supabase Auth</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-white bg-opacity-20 text-sm font-bold mr-3">3</span>
              <div>
                <h4 className="font-semibold">Create File Upload</h4>
                <p className="text-sm text-purple-100">Build drag-and-drop file upload interface</p>
              </div>
            </div>
            <div className="flex items-start">
              <span className="flex-shrink-0 h-6 w-6 flex items-center justify-center rounded-full bg-white bg-opacity-20 text-sm font-bold mr-3">4</span>
              <div>
                <h4 className="font-semibold">Deploy Frontend to Vercel</h4>
                <p className="text-sm text-purple-100">Connect GitHub & deploy React app</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default App
