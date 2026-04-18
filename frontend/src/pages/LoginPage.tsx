/**
 * Login Page for DataLens
 * User authentication entry point
 */

import AuthForm from '../components/auth/AuthForm'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-4xl font-extrabold text-center text-gray-900">
            DataLens
          </h1>
          <p className="mt-2 text-center text-xl text-gray-600">
            Automated EDA Report Generator
          </p>
          <p className="mt-2 text-center text-sm text-gray-500">
            Sign in to upload datasets and generate insights
          </p>
        </div>

        <AuthForm mode="login" />

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            By signing in, you agree to our{' '}
            <a href="/terms" className="font-medium text-blue-600 hover:text-blue-500">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="/privacy" className="font-medium text-blue-600 hover:text-blue-500">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}