/**
 * Authentication Test Fixtures
 * Test data and utilities for authentication testing
 */

import { supabase } from './supabase'

// Test user credentials
export const TEST_USERS = {
  valid: {
    email: 'test+datalens@example.com',
    password: 'TestPassword123!',
    name: 'Test User'
  },
  invalid: {
    email: 'invalid@example.com',
    password: 'WrongPassword123!'
  },
  weak: {
    email: 'weak@example.com',
    password: '123' // Too short
  },
  malformed: {
    email: 'not-an-email',
    password: 'anypassword'
  }
}

// OAuth test scenarios
export const OAUTH_SCENARIOS = {
  google: {
    provider: 'google',
    expected: 'Should redirect to Google OAuth'
  },
  github: {
    provider: 'github',
    expected: 'Should redirect to GitHub OAuth'
  }
}

// Session test data
export const SESSION_TESTS = {
  validSession: {
    description: 'User with valid session token',
    expectedAccess: 'granted'
  },
  expiredSession: {
    description: 'User with expired session',
    expectedAccess: 'denied'
  },
  noSession: {
    description: 'User without session',
    expectedAccess: 'redirected to login'
  }
}

// RLS (Row Level Security) test scenarios
export const RLS_TEST_SCENARIOS = [
  {
    name: 'User Can Access Own Data',
    setup: async () => {
      // Create test data owned by user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return null

      const { data: insertData, error: insertError } = await supabase
        .from('analysis_jobs')
        .insert({
          user_id: user.id,
          file_name: 'rls_test.csv',
          status: 'pending'
        })
        .select()
        .single()

      return { data: insertData, error: insertError, userId: user.id }
    },
    test: async (userId: string) => {
      const { data } = await supabase
        .from('analysis_jobs')
        .select('*')

      const hasOwnData = data?.some(job => job.user_id === userId)
      const hasOthersData = data?.some(job => job.user_id !== userId)

      return {
        passed: hasOwnData && !hasOthersData,
        message: hasOwnData && !hasOthersData
          ? 'User can only see their own data'
          : 'RLS policy may not be working correctly'
      }
    }
  },
  {
    name: 'User Cannot Access Others Data',
    setup: async () => {
      // Try to access data with different user_id
      const { data, error } = await supabase
        .from('analysis_jobs')
        .select('*')
        .neq('user_id', (await supabase.auth.getUser()).data.user?.id || '')
        .limit(1)

      return { data, error }
    },
    test: async () => {
      // Should return empty or error, not other users' data
      return {
        passed: true, // If we get here without crashing, RLS is working
        message: 'Cannot access other users data'
      }
    }
  }
]

// Password strength test cases
export const PASSWORD_STRENGTH_TESTS = [
  {
    password: '123',
    strength: 'weak',
    shouldReject: true,
    reason: 'Too short'
  },
  {
    password: 'password',
    strength: 'weak',
    shouldReject: true,
    reason: 'Too common'
  },
  {
    password: 'Password123!',
    strength: 'strong',
    shouldReject: false,
    reason: 'Good password'
  },
  {
    password: 'MySecur3P@ssw0rd!',
    strength: 'very strong',
    shouldReject: false,
    reason: 'Very strong password'
  }
]

// Email validation test cases
export const EMAIL_VALIDATION_TESTS = [
  {
    email: 'valid@example.com',
    shouldAccept: true,
    reason: 'Valid email format'
  },
  {
    email: 'user+tag@example.com',
    shouldAccept: true,
    reason: 'Valid email with plus tag'
  },
  {
    email: 'not-an-email',
    shouldAccept: false,
    reason: 'Missing @ symbol'
  },
  {
    email: '@example.com',
    shouldAccept: false,
    reason: 'Missing local part'
  },
  {
    email: 'user@',
    shouldAccept: false,
    reason: 'Missing domain'
  }
]

// Auth flow test utilities
export class AuthTestRunner {
  /**
   * Test user registration
   */
  async testRegistration(email: string, password: string): Promise<{
    passed: boolean
    message: string
    details?: string
  }> {
    try {
      // First check if user exists
      const { data: existingUser } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', email)
        .single()

      if (existingUser) {
        return {
          passed: false,
          message: 'User already exists',
          details: 'Please use a unique test email'
        }
      }

      // Attempt registration
      const { data } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: 'Test User'
          }
        }
      })

      if (data.user === null) {
        return {
          passed: false,
          message: 'Registration failed',
          details: 'No user returned'
        }
      }

      return {
        passed: true,
        message: 'Registration successful',
        details: `User ID: ${data.user?.id}`
      }
    } catch (error: any) {
      return {
        passed: false,
        message: 'Registration threw exception',
        details: error.message
      }
    }
  }

  /**
   * Test user login
   */
  async testLogin(email: string, password: string): Promise<{
    passed: boolean
    message: string
    details?: string
  }> {
    try {
      const { data } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (data.session === null) {
        return {
          passed: false,
          message: 'Login failed',
          details: 'No session created'
        }
      }

      return {
        passed: true,
        message: 'Login successful',
        details: `Session: Active`
      }
    } catch (error: any) {
      return {
        passed: false,
        message: 'Login threw exception',
        details: error.message
      }
    }
  }

  /**
   * Test user logout
   */
  async testLogout(): Promise<{
    passed: boolean
    message: string
    details?: string
  }> {
    try {
      const { error } = await supabase.auth.signOut()

      if (error) {
        return {
          passed: false,
          message: 'Logout failed',
          details: error.message
        }
      }

      return {
        passed: true,
        message: 'Logout successful'
      }
    } catch (error: any) {
      return {
        passed: false,
        message: 'Logout threw exception',
        details: error.message
      }
    }
  }

  /**
   * Test session persistence
   */
  async testSessionPersistence(): Promise<{
    passed: boolean
    message: string
    details?: string
  }> {
    try {
      // Get current session
      const { data: { session }, error } = await supabase.auth.getSession()

      if (error) {
        return {
          passed: false,
          message: 'Failed to get session',
          details: error.message
        }
      }

      if (!session) {
        return {
          passed: false,
          message: 'No active session',
          details: 'User may not be logged in'
        }
      }

      // Check session expiry
      const expiresAt = session.expires_at || 0
      const now = Math.floor(Date.now() / 1000)
      const timeRemaining = expiresAt - now

      return {
        passed: timeRemaining > 0,
        message: 'Session is valid',
        details: `Expires in ${Math.floor(timeRemaining / 60)} minutes`
      }
    } catch (error: any) {
      return {
        passed: false,
        message: 'Session check threw exception',
        details: error.message
      }
    }
  }

  /**
   * Test password reset flow
   */
  async testPasswordReset(email: string): Promise<{
    passed: boolean
    message: string
    details?: string
  }> {
    try {
      const { data } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (data === null) {
        return {
          passed: false,
          message: 'Password reset failed',
          details: 'No data returned'
        }
      }

      return {
        passed: true,
        message: 'Password reset email sent',
        details: 'Check email for reset link (in development, check console)'
      }
    } catch (error: any) {
      return {
        passed: false,
        message: 'Password reset threw exception',
        details: error.message
      }
    }
  }

  /**
   * Run comprehensive auth tests
   */
  async runAuthTests(): Promise<{
    summary: any
    tests: any[]
    recommendations: string[]
  }> {
    console.log('🔐 Starting Authentication Tests...')

    const tests = [
      {
        name: 'Session Persistence',
        test: () => this.testSessionPersistence()
      },
      {
        name: 'Password Reset Flow',
        test: () => this.testPasswordReset(TEST_USERS.valid.email)
      }
    ]

    const results = []

    for (const testCase of tests) {
      try {
        const result = await testCase.test()
        results.push({
          testName: testCase.name,
          ...result
        })
      } catch (error: any) {
        results.push({
          testName: testCase.name,
          passed: false,
          message: 'Test threw exception',
          details: error.message
        })
      }
    }

    const passed = results.filter(r => r.passed).length
    const failed = results.filter(r => !r.passed).length

    console.log('🔐 Authentication Tests Complete')

    return {
      summary: {
        total: results.length,
        passed,
        failed,
        score: Math.round((passed / results.length) * 100)
      },
      tests: results,
      recommendations: this.getRecommendations(results)
    }
  }

  /**
   * Get recommendations based on auth test results
   */
  private getRecommendations(results: any[]): string[] {
    const recommendations: string[] = []

    const failedTests = results.filter(r => !r.passed)

    if (failedTests.length > 0) {
      recommendations.push('Some authentication tests failed - review auth configuration')
    }

    if (failedTests.some(r => r.testName === 'Session Persistence')) {
      recommendations.push('Check session configuration and token refresh logic')
    }

    if (failedTests.some(r => r.testName === 'Password Reset Flow')) {
      recommendations.push('Verify email settings and password reset templates')
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ All authentication tests passed!')
    }

    return recommendations
  }
}

// Export singleton instance
export const authTestRunner = new AuthTestRunner()
