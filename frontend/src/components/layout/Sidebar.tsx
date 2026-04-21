/**
 * Sidebar Navigation - New Design System
 * Professional sidebar navigation for internal app pages
 */

import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const isActive = (path: string) => {
    return location.pathname.startsWith(path)
  }

  const navItems = [
    {
      section: 'Workspace',
      items: [
        {
          name: 'Upload',
          path: '/upload',
          icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          ),
        },
      ]
    }
  ]

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-gray-900/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed left-0 top-0 h-screen w-64 bg-gray-DARK_200 border-r border-gray-DARK_300 z-50
        transform transition-transform duration-200 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-6 border-b border-gray-DARK_300">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-8 h-8 rounded-md bg-indigo-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-DARK_900">DataLens</h1>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4">
          {navItems.map((section) => (
            <div key={section.section} className="mb-6">
              <p className="px-4 mb-2 text-xs font-semibold text-gray-DARK_500 uppercase tracking-wider">
                {section.section}
              </p>
              <ul className="space-y-1">
                {section.items.map((item) => (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => {
                        if (window.innerWidth < 1024) {
                          onClose()
                        }
                      }}
                      className={`
                        flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-md transition-colors
                        ${isActive(item.path)
                          ? 'bg-indigo-600 text-white'
                          : 'text-gray-DARK_600 hover:bg-gray-DARK_300 hover:text-gray-DARK_800'
                        }
                      `}
                    >
                      {item.icon}
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {/* User Section */}
        <div className="p-4 border-t border-gray-DARK_300">
          {user ? (
            <div className="space-y-3">
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white text-sm font-semibold">
                  {(user.user_metadata?.name || user.email)?.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-DARK_800 truncate">
                    {user.user_metadata?.name || 'User'}
                  </p>
                  <p className="text-xs text-gray-DARK_500 truncate">{user.email}</p>
                </div>
              </div>

              <button
                onClick={handleSignOut}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-DARK_600 hover:bg-gray-DARK_200 rounded-md transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Sign out
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="px-3 py-2 text-sm text-gray-600">
                <span className="text-indigo-600 font-medium">Demo Mode</span>
                <span className="text-gray-500"> - Sign up to save your data</span>
              </div>
              <Link
                to="/login"
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    onClose()
                  }
                }}
                className="block px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md transition-colors"
              >
                Sign In
              </Link>
              <Link
                to="/signup"
                onClick={() => {
                  if (window.innerWidth < 1024) {
                    onClose()
                  }
                }}
                className="block px-3 py-2.5 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md transition-colors text-center"
              >
                Get Started
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  )
}
