/**
 * Reusable authentication form component
 * Used for both login and signup
 */

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

interface AuthFormProps {
  mode: 'login' | 'signup'
  onSuccess?: () => void
}

export default function AuthForm({ mode, onSuccess }: AuthFormProps) {
  const { signIn, signUp, loading } = useAuth()
  const navigate = useNavigate()

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '', // Only for signup
  })

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      if (mode === 'signup') {
        if (!formData.name.trim()) {
          setError('Name is required')
          return
        }
        await signUp(formData.email, formData.password, formData.name)
        setSuccess('Account created! Please check your email to confirm your account.')
      } else {
        await signIn(formData.email, formData.password)
        if (onSuccess) {
          onSuccess()
        } else {
          navigate('/')
        }
      }
    } catch (err: any) {
      setError(err.message || 'Authentication failed')
    }
  }

  const handleGoogleSignIn = async () => {
    try {
      await signIn()
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed')
    }
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-white rounded-lg shadow-xl p-8">
        <h2 className="text-2xl font-bold text-center text-gray-900 mb-6">
          {mode === 'login' ? 'Welcome Back' : 'Create Account'}
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-600">{success}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'signup' && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="John Doe"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="you@example.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              required
              minLength={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="•••••••••"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : mode === 'login' ? 'Sign In' : 'Create Account'}
          </button>

          {mode === 'login' && (
            <div className="mt-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Or continue with</span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="w-full mt-4 flex items-center justify-center gap-2 py-2 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25-.46-1.15-.32-2.25-.92-3.2-1.92-1.95-1.28-2.6-2.76-.29-1.42-.04-2.78-.58-4.05-.93-1.23-.27-2.45-.61-3.65-1.03-1.19-.39-2.35-.77-3.48-1.16-.11-.04-.22-.08-.33-.12-.13-.04-.22-.06-.33-.06-1.26-.14-2.48-.36-3.65-.76-1.17-.32-2.32-.73-3.43-1.19-.11-.04-.21-.07-.32-.11-.1-.04-.19-.02-.28.08-.48.25-.73.65-.29.33-.63.35-1.49-.65-2.43-.42-.92-.75-1.95-1-3.07-.28-.37-.55-.83-.78-1.39-.56-1.1-.37-2.23.02-3.35.08-1.12.38-2.22 1.07-3.32 1.09-.58 2.23-.22 3.35.56 1.12 1.23.45 2.48 1 3.74.56.31.63.47 1.29.47 2.06zm-4.78 8.05c-.6.6-.6-1.57-.6-2.17 0-.6.6-.6-1.57 0-2.17.6-.6 1.57-.6 2.17 0 .6.6 1.57.6 2.17 0 .6-.6 1.57-.6 2.17 0 .6.6 1.57.6 2.17zM13.97 17.63c-.6.6-.6-1.57-.6-2.17 0-.6.6-.6-1.57 0-2.17.6-.6 1.57-.6 2.17 0 .6.6 1.57.6 2.17 0 .6-.6 1.57-.6 2.17 0 .6.6 1.57.6 2.17 0 .6-.6 1.57-.6 2.17z"
                  />
                </svg>
                <span className="text-sm font-medium text-gray-700">Continue with Google</span>
              </button>
            </div>
          )}
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <Link
              to={mode === 'login' ? '/signup' : '/login'}
              className="font-medium text-blue-600 hover:text-blue-500 ml-1"
            >
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}