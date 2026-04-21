/**
 * App Layout - New Design System
 * Wraps pages with sidebar navigation and main content area
 */

import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'

interface AppLayoutProps {
  children: React.ReactNode
}

export default function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const location = useLocation()

  // Don't show sidebar on landing page
  const showSidebar = location.pathname !== '/'

  if (!showSidebar) {
    return <>{children}</>
  }

  return (
    <div className="min-h-screen bg-gray-50 bg-gray-DARK_50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-gray-DARK_200 border-b border-gray-DARK_300 z-30 flex items-center gap-4 px-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="p-2 text-gray-DARK_600 hover:bg-gray-DARK_300 rounded-md transition-colors"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-md bg-indigo-600 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <span className="text-lg font-semibold text-gray-DARK_900">DataLens</span>
        </div>
      </div>

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen">
        <div className="lg:pt-0 pt-16">
          {children}
        </div>
      </main>
    </div>
  )
}
