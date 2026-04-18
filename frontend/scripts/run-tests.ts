/**
 * DataLens Comprehensive Testing Suite
 * Standalone testing script for development environment
 */

import { securityTester } from '../src/lib/security-tests'
import { apiTester } from '../src/lib/api-tests'
import { authTestRunner } from '../src/lib/auth-test-fixtures'
import { e2eTester } from '../src/lib/e2e-tests'
import { performanceMonitor } from '../src/lib/performance-monitor'

// Test result interfaces
interface TestResults {
  category: string
  summary: {
    total: number
    passed: number
    failed: number
    score: number
  }
  duration: number
  recommendations: string[]
}

class ComprehensiveTestRunner {
  private results: TestResults[] = []

  /**
   * Run all test categories
   */
  async runAllTests(): Promise<void> {
    console.log('🚀 Starting DataLens Comprehensive Testing Suite...\n')

    const startTime = Date.now()

    // 1. Security Tests
    console.log('🔒 Running Security Tests...')
    const securityStart = Date.now()
    const securityResults = await securityTester.runAllSecurityTests()
    this.results.push({
      category: 'Security',
      summary: securityResults.summary,
      duration: Date.now() - securityStart,
      recommendations: securityResults.recommendations
    })
    console.log(`✓ Security Tests Complete: ${securityResults.summary.passed}/${securityResults.summary.total} passed\n`)

    // 2. API Tests
    console.log('🔍 Running API Tests...')
    const apiStart = Date.now()
    const apiResults = await apiTester.runAllAPITests()
    this.results.push({
      category: 'API',
      summary: apiResults.summary,
      duration: Date.now() - apiStart,
      recommendations: apiResults.recommendations
    })
    console.log(`✓ API Tests Complete: ${apiResults.summary.passed}/${apiResults.summary.total} passed\n`)

    // 3. Authentication Tests
    console.log('🔐 Running Authentication Tests...')
    const authStart = Date.now()
    const authResults = await authTestRunner.runAuthTests()
    this.results.push({
      category: 'Authentication',
      summary: authResults.summary,
      duration: Date.now() - authStart,
      recommendations: authResults.recommendations
    })
    console.log(`✓ Authentication Tests Complete: ${authResults.summary.passed}/${authResults.summary.total} passed\n`)

    // 4. E2E Tests
    console.log('🧭 Running End-to-End Tests...')
    const e2eStart = Date.now()
    const e2eResults = await e2eTester.runAllE2ETests()
    this.results.push({
      category: 'E2E',
      summary: e2eResults.summary,
      duration: Date.now() - e2eStart,
      recommendations: e2eResults.recommendations
    })
    console.log(`✓ E2E Tests Complete: ${e2eResults.summary.passed}/${e2eResults.summary.total} passed\n`)

    // 5. Performance Monitoring
    console.log('📊 Running Performance Analysis...')
    performanceMonitor.startMonitoring()
    await new Promise(resolve => setTimeout(resolve, 2000)) // Collect metrics
    const perfReport = performanceMonitor.generateReport()
    console.log(`✓ Performance Analysis Complete: Score ${perfReport.score.overall}/100\n`)

    const totalDuration = Date.now() - startTime

    // Generate final report
    this.generateFinalReport(totalDuration)
  }

  /**
   * Generate comprehensive test report
   */
  private generateFinalReport(totalDuration: number): void {
    console.log('\n' + '='.repeat(80))
    console.log('📋 DATALENS COMPREHENSIVE TEST REPORT')
    console.log('='.repeat(80) + '\n')

    const totalTests = this.results.reduce((sum, r) => sum + r.summary.total, 0)
    const totalPassed = this.results.reduce((sum, r) => sum + r.summary.passed, 0)
    const totalFailed = this.results.reduce((sum, r) => sum + r.summary.failed, 0)
    const overallScore = Math.round((totalPassed / totalTests) * 100)

    // Overall Summary
    console.log('🎯 OVERALL SUMMARY')
    console.log('─'.repeat(80))
    console.log(`Total Tests Run:    ${totalTests}`)
    console.log(`Passed:             ${totalPassed} ✅`)
    console.log(`Failed:             ${totalFailed} ❌`)
    console.log(`Success Rate:       ${overallScore}%`)
    console.log(`Total Duration:     ${(totalDuration / 1000).toFixed(2)}s`)
    console.log('')

    // Category Breakdown
    console.log('📊 CATEGORY BREAKDOWN')
    console.log('─'.repeat(80))
    this.results.forEach(result => {
      const status = result.summary.score >= 80 ? '✅' : result.summary.score >= 60 ? '⚠️' : '❌'
      const duration = (result.duration / 1000).toFixed(2)
      console.log(`${status} ${result.category.padEnd(15)} ${result.summary.passed}/${result.summary.total} passed (${result.summary.score}%) - ${duration}s`)
    })
    console.log('')

    // Failed Tests Detail
    const failedTests = this.results.filter(r => r.summary.failed > 0)
    if (failedTests.length > 0) {
      console.log('❌ FAILED TESTS DETAILS')
      console.log('─'.repeat(80))
      failedTests.forEach(result => {
        console.log(`\n${result.category} (${result.summary.failed} failed):`)
        if (result.summary.failed > 0) {
          console.log('  Recommendations:')
          result.recommendations.slice(0, 3).forEach(rec => {
            console.log(`    • ${rec}`)
          })
        }
      })
      console.log('')
    }

    // Performance Summary
    console.log('⚡ PERFORMANCE METRICS')
    console.log('─'.repeat(80))
    console.log(`Overall Score:      ${performanceMonitor.getPerformanceScore().overall}/100`)
    console.log(`Speed Score:        ${performanceMonitor.getPerformanceScore().speed}/100`)
    console.log(`Efficiency Score:   ${performanceMonitor.getPerformanceScore().efficiency}/100`)
    console.log(`Reliability Score:  ${performanceMonitor.getPerformanceScore().reliability}/100`)
    console.log('')

    // Recommendations
    console.log('💡 RECOMMENDATIONS')
    console.log('─'.repeat(80))
    const allRecommendations = this.results.flatMap(r => r.recommendations)
    const uniqueRecommendations = [...new Set(allRecommendations)]
    uniqueRecommendations.slice(0, 10).forEach((rec, i) => {
      console.log(`${i + 1}. ${rec}`)
    })
    console.log('')

    // Final Verdict
    console.log('='.repeat(80))
    const verdict = overallScore >= 90 ? '🎉 EXCELLENT' :
                   overallScore >= 75 ? '✅ GOOD' :
                   overallScore >= 60 ? '⚠️ NEEDS IMPROVEMENT' :
                   '❌ CRITICAL ISSUES'

    console.log(`FINAL VERDICT: ${verdict}`)
    console.log(`Overall Score: ${overallScore}/100`)
    console.log(`Tests Passed: ${totalPassed}/${totalTests}`)

    if (overallScore >= 90) {
      console.log('\n🚀 Ready for production deployment!')
    } else if (overallScore >= 75) {
      console.log('\n⚠️ Review recommendations before production deployment')
    } else {
      console.log('\n🛠️ Critical issues must be addressed before production')
    }

    console.log('='.repeat(80) + '\n')
  }
}

// Run tests if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const runner = new ComprehensiveTestRunner()
  runner.runAllTests().catch(console.error)
}

export { ComprehensiveTestRunner }
