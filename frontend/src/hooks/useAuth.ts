/**
 * Custom authentication hooks for DataLens
 */

import { useState, useEffect } from 'react'
import { useAuth as useAuthContext } from '../contexts/AuthContext'
import { User } from '@supabase/supabase-js'

/**
 * Hook to manage authentication state and operations
 */
export function useAuth() {
  return useAuthContext()
}

/**
 * Hook to check if user is authenticated
 */
export function useIsAuthenticated() {
  const { user, loading } = useAuth()
  return { isAuthenticated: !!user, loading }
}

/**
 * Hook to get current user with loading state
 */
export function useUser() {
  const { user, loading } = useAuth()
  return { user, loading }
}

/**
 * Hook to handle redirect after auth
 */
export function useAuthRedirect() {
  const { isAuthenticated, loading } = useAuth()

  useEffect(() => {
    if (!loading && isAuthenticated) {
      // User is authenticated, you can redirect if needed
      // window.location.href = '/dashboard'
    }
  }, [isAuthenticated, loading])

  return { isAuthenticated, loading }
}

/**
 * Hook to require authentication - use this to protect routes
 */
export function useRequireAuth() {
  const { isAuthenticated, loading } = useAuth()

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // Redirect to login if not authenticated
      window.location.href = '/login'
    }
  }, [isAuthenticated, loading])

  return { isAuthenticated, loading }
}

/**
 * Hook to manage logout with redirect
 */
export function useLogout() {
  const { signOut } = useAuth()
  const [loggingOut, setLoggingOut] = useState(false)

  const handleLogout = async () => {
    setLoggingOut(true)
    await signOut()
    window.location.href = '/login'
  }

  return { handleLogout, loggingOut }
}