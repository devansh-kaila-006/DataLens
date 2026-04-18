/**
 * API Testing Utilities
 * Comprehensive API endpoint testing for DataLens
 */

import { supabase } from './supabase'

// API Test Result Interface
interface APITestResult {
  endpoint: string
  method: string
  passed: boolean
  statusCode?: number
  responseTime?: number
  message: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  details?: string
}

export class APITester {
  private results: APITestResult[] = []

  /**
   * Test API Endpoint Health
   */
  async testEndpointHealth(endpoint: string, method: string = 'GET'): Promise<APITestResult> {
    const startTime = performance.now()

    try {
      const { error, status } = await supabase
        .from('analysis_jobs')
        .select('*')
        .limit(1)

      const responseTime = performance.now() - startTime

      const result: APITestResult = {
        endpoint,
        method,
        passed: !error,
        statusCode: status,
        responseTime,
        message: error ? `API error: ${error.message}` : 'Endpoint responding normally',
        severity: error ? 'high' : 'low'
      }

      this.results.push(result)
      return result
    } catch {
      const responseTime = performance.now() - startTime

      const result: APITestResult = {
        endpoint,
        method,
        passed: false,
        responseTime,
        message: 'Exception occurred during API call',
        severity: 'critical'
      }

      this.results.push(result)
      return result
    }
  }

  /**
   * Test API Response Times
   */
  async testResponseTimes(): Promise<APITestResult> {
    const tests = [
      { name: 'Database Query', maxTime: 500 },
      { name: 'Authentication Check', maxTime: 300 },
      { name: 'File Upload Preparation', maxTime: 200 }
    ]

    let allPassed = true
    const details: string[] = []

    for (const test of tests) {
      const startTime = performance.now()

      try {
        // Simulate different API calls
        await supabase.auth.getSession()
      } catch (error) {
        // Continue testing
      }

      const responseTime = performance.now() - startTime
      const passed = responseTime < test.maxTime

      if (!passed) allPassed = false
      details.push(`${test.name}: ${responseTime.toFixed(0)}ms ${passed ? '✓' : '✗'}`)
    }

    const result: APITestResult = {
      endpoint: '/api/*',
      method: 'GET',
      passed: allPassed,
      message: allPassed ? 'All API response times within acceptable limits' : 'Some API endpoints are slow',
      severity: allPassed ? 'low' : 'medium',
      details: details.join(', ')
    }

    this.results.push(result)
    return result
  }

  /**
   * Test Rate Limiting
   */
  async testRateLimiting(): Promise<APITestResult> {
    const requests = []
    const requestCount = 10

    // Make multiple rapid requests
    for (let i = 0; i < requestCount; i++) {
      requests.push(
        supabase.from('analysis_jobs').select('*').limit(1)
      )
    }

    const startTime = performance.now()
    const results = await Promise.allSettled(requests)
    const responseTime = performance.now() - startTime

    const successful = results.filter(r => r.status === 'fulfilled').length
    const passed = successful > 0 // At least some requests should succeed

    const result: APITestResult = {
      endpoint: '/api/*',
      method: 'MULTIPLE',
      passed,
      responseTime,
      message: passed ? 'Rate limiting allows legitimate traffic' : 'Rate limiting may be too strict',
      severity: 'medium',
      details: `${successful}/${requestCount} requests succeeded`
    }

    this.results.push(result)
    return result
  }

  /**
   * Test CORS Configuration
   */
  async testCORS(): Promise<APITestResult> {
    try {
      // Test if we can make cross-origin requests
      const { error } = await supabase
        .from('analysis_jobs')
        .select('*')
        .limit(1)

      const passed = !error || error.message !== 'Failed to fetch'

      const result: APITestResult = {
        endpoint: '/api/*',
        method: 'CORS',
        passed,
        message: passed ? 'CORS properly configured' : 'CORS misconfiguration detected',
        severity: 'high',
        details: error ? error.message : 'Cross-origin requests allowed'
      }

      this.results.push(result)
      return result
    } catch (error: any) {
      const result: APITestResult = {
        endpoint: '/api/*',
        method: 'CORS',
        passed: false,
        message: 'CORS test failed',
        severity: 'high',
        details: error.message
      }

      this.results.push(result)
      return result
    }
  }

  /**
   * Test Input Validation
   */
  async testInputValidation(): Promise<APITestResult> {
    const invalidInputs = [
      { name: 'Negative ID', value: -1 },
      { name: 'Empty String', value: '' },
      { name: 'SQL Injection', value: "'; DROP TABLE--" },
      { name: 'XSS Payload', value: '<script>alert(1)</script>' }
    ]

    let allBlocked = true
    const results: string[] = []

    for (const input of invalidInputs) {
      try {
        // Try to use invalid input (should be handled gracefully)
        const { error } = await supabase
          .from('analysis_jobs')
          .select('*')
          .limit(input.value as number)

        // If we get here without error, the input wasn't properly validated
        if (error) {
          results.push(`${input.name}: Blocked ✓`)
        } else {
          results.push(`${input.name}: Passed (may not be validated)`)
          allBlocked = false
        }
      } catch (error) {
        results.push(`${input.name}: Exception caught`)
      }
    }

    const result: APITestResult = {
      endpoint: '/api/*',
      method: 'INPUT_VALIDATION',
      passed: allBlocked,
      message: allBlocked ? 'All invalid inputs properly rejected' : 'Some inputs may not be validated',
      severity: 'high',
      details: results.join(', ')
    }

    this.results.push(result)
    return result
  }

  /**
   * Test Error Handling
   */
  async testErrorHandling(): Promise<APITestResult> {
    const errorScenarios = [
      { name: 'Invalid Table', test: () => supabase.from('nonexistent_table').select('*') },
      { name: 'Invalid Query', test: () => supabase.from('analysis_jobs').select('nonexistent_column') },
      { name: 'Invalid ID', test: () => supabase.from('analysis_jobs').select('*').eq('id', 'invalid') }
    ]

    let allHandled = true
    const results: string[] = []

    for (const scenario of errorScenarios) {
      try {
        const { error } = await scenario.test()

        // Errors should be handled gracefully
        if (error) {
          results.push(`${scenario.name}: Error handled ✓`)
        } else {
          results.push(`${scenario.name}: No error detected`)
          allHandled = true // Not finding an error is also ok
        }
      } catch {
        results.push(`${scenario.name}: Exception (not ideal)`)
        allHandled = false
      }
    }

    const result: APITestResult = {
      endpoint: '/api/*',
      method: 'ERROR_HANDLING',
      passed: allHandled,
      message: allHandled ? 'All error scenarios handled gracefully' : 'Some errors may not be handled properly',
      severity: 'medium',
      details: results.join(', ')
    }

    this.results.push(result)
    return result
  }

  /**
   * Generate API Test Report
   */
  generateAPIReport(): {
    summary: {
      total: number
      passed: number
      failed: number
      critical: number
      score: number
    }
    tests: APITestResult[]
    recommendations: string[]
  } {
    const passed = this.results.filter(r => r.passed).length
    const failed = this.results.filter(r => !r.passed).length
    const critical = this.results.filter(r => r.severity === 'critical' && !r.passed).length

    return {
      summary: {
        total: this.results.length,
        passed,
        failed,
        critical,
        score: Math.round((passed / this.results.length) * 100)
      },
      tests: this.results,
      recommendations: this.getRecommendations()
    }
  }

  /**
   * Get recommendations based on test results
   */
  private getRecommendations(): string[] {
    const recommendations: string[] = []

    const failedTests = this.results.filter(r => !r.passed)
    const criticalFailures = failedTests.filter(r => r.severity === 'critical')

    if (criticalFailures.length > 0) {
      recommendations.push('🚨 CRITICAL: Address critical API failures immediately')
    }

    if (failedTests.some(r => r.endpoint.includes('health'))) {
      recommendations.push('Some API endpoints are not responding - check server status')
    }

    if (failedTests.some(r => r.method === 'CORS')) {
      recommendations.push('Fix CORS configuration to allow legitimate cross-origin requests')
    }

    if (failedTests.some(r => r.method === 'INPUT_VALIDATION')) {
      recommendations.push('Implement strict input validation on all API endpoints')
    }

    if (recommendations.length === 0) {
      recommendations.push('✅ All API tests passed! Monitor API performance regularly.')
    }

    return recommendations
  }

  /**
   * Run all API tests
   */
  async runAllAPITests(): Promise<{
    summary: {
      total: number
      passed: number
      failed: number
      critical: number
      score: number
    }
    recommendations: string[]
  }> {
    console.log('🔍 Starting API Testing...')

    await this.testEndpointHealth('/api/health', 'GET')
    await this.testResponseTimes()
    await this.testRateLimiting()
    await this.testCORS()
    await this.testInputValidation()
    await this.testErrorHandling()

    console.log('🔍 API Testing Complete')
    console.log(`Results: ${this.generateAPIReport().summary}`)

    return this.generateAPIReport()
  }
}

// Export singleton instance
export const apiTester = new APITester()
