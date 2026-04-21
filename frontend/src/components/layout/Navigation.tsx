/**
 * v2 Navigation Component - Light theme, clean design
 * Professional navigation with flat colors
 */

import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

export default function Navigation() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  // Don't show navigation on landing page
  if (location.pathname === '/') {
    return null
  }

  const isActive = (path: string) => {
    return location.pathname === path
  }

  return (
    <nav className={`sticky top-0 z-50 transition-colors duration-150 ${
      isScrolled ? 'bg-white/95 backdrop-blur-sm shadow-sm border-b border-gray-DARK_400' : 'bg-white border-b border-gray-DARK_400'
    }`}>
      <div className="container-premium">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-md bg-teal-600 flex items-center justify-center group-hover:bg-teal-700 transition-colors">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-bold text-gray-DARK_100 group-hover:text-teal-600 transition-colors">DataLens</h1>
                <p className="text-xs text-gray-DARK_500">Intelligent Analysis</p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              <Link
                to="/upload"
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${
                  isActive('/upload')
                    ? 'bg-teal-50 text-teal-600'
                    : 'text-gray-DARK_400 hover:text-gray-DARK_100 hover:bg-gray-DARK_300'
                }`}
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload
                </span>
              </Link>
            </div>
          </div>

          {/* User Menu */}
          <div className="hidden lg:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                {/* User Info */}
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-DARK_100">{user.user_metadata?.name || 'User'}</p>
                  <p className="text-xs text-gray-DARK_500">{user.email}</p>
                </div>

                {/* Avatar */}
                <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold">
                  {(user.user_metadata?.name || user.email)?.charAt(0).toUpperCase()}
                </div>

                {/* Sign Out Button */}
                <button
                  onClick={handleSignOut}
                  className="p-2 text-gray-DARK_500 hover:text-gray-DARK_100 hover:bg-gray-DARK_300 rounded-md transition-colors"
                  title="Sign out"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-DARK_500">
                  <span className="text-teal-600 font-medium">Demo Mode</span> - Sign up to save your data
                </span>
                <Link
                  to="/login"
                  className="px-4 py-2 text-sm font-medium text-gray-DARK_400 hover:text-gray-DARK_100 transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  to="/signup"
                  className="px-6 py-2 bg-teal-600 text-white text-sm font-medium rounded-md hover:bg-teal-700 shadow-sm transition-colors duration-150"
                >
                  Get Started
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 text-gray-DARK_500 hover:text-gray-DARK_100 hover:bg-gray-DARK_300 rounded-md transition-colors"
          >
            {isMenuOpen ? (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="lg:hidden py-4 border-t border-gray-DARK_400 animate-slide-down">
            <div className="space-y-2">
              <Link
                to="/upload"
                className={`flex items-center gap-3 px-4 py-3 rounded-md text-sm font-medium transition-colors ${
                  isActive('/upload')
                    ? 'bg-teal-50 text-teal-600'
                    : 'text-gray-DARK_400 hover:text-gray-DARK_100 hover:bg-gray-DARK_300'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                Upload Dataset
              </Link>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-DARK_400">
              {user ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 px-4">
                    <div className="w-10 h-10 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold">
                      {(user.user_metadata?.name || user.email)?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-DARK_100">{user.user_metadata?.name || 'User'}</p>
                      <p className="text-xs text-gray-DARK_500">{user.email}</p>
                    </div>
                  </div>
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-3 px-4 py-3 text-gray-DARK_400 hover:text-gray-DARK_100 hover:bg-gray-DARK_300 rounded-md transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Sign Out
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="px-4 text-center text-sm text-gray-DARK_500">
                    <span className="text-teal-600 font-medium">Demo Mode</span> - Sign up to save your data
                  </div>
                  <div className="space-y-2">
                    <Link
                      to="/login"
                      className="block px-4 py-3 text-gray-DARK_400 hover:text-gray-DARK_100 hover:bg-gray-DARK_300 rounded-md transition-colors"
                    >
                      Sign In
                    </Link>
                    <Link
                      to="/signup"
                      className="block px-4 py-3 bg-teal-600 text-white font-medium rounded-md text-center shadow-sm"
                    >
                      Get Started
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  )
}
