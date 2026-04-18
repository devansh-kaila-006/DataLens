/**
 * Performance Monitoring Utilities
 * Real-time performance monitoring and metrics collection
 */

export interface PerformanceMetrics {
  // Navigation timing
  pageLoadTime: number
  domContentLoaded: number
  firstContentfulPaint: number
  largestContentfulPaint: number

  // Resource timing
  totalResources: number
  totalResourceSize: number
  slowResources: number

  // Memory usage
  memoryUsed: number
  memoryTotal: number
  memoryLimit: number

  // Network timing
  requestCount: number
  averageRequestTime: number
  failedRequests: number

  // Custom metrics
  interactionLatency: number[]
  scriptExecutionTime: number
}

export class PerformanceMonitor {
  private metrics: PerformanceMetrics
  private observers: PerformanceObserver[] = []

  constructor() {
    this.metrics = this.initializeMetrics()
    this.setupObservers()
  }

  private initializeMetrics(): PerformanceMetrics {
    return {
      pageLoadTime: 0,
      domContentLoaded: 0,
      firstContentfulPaint: 0,
      largestContentfulPaint: 0,
      totalResources: 0,
      totalResourceSize: 0,
      slowResources: 0,
      memoryUsed: 0,
      memoryTotal: 0,
      memoryLimit: 0,
      requestCount: 0,
      averageRequestTime: 0,
      failedRequests: 0,
      interactionLatency: [],
      scriptExecutionTime: 0
    }
  }

  /**
   * Setup performance observers
   */
  private setupObservers(): void {
    if (typeof window === 'undefined' || !window.PerformanceObserver) return

    try {
      // Observe paint timing
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            this.metrics.firstContentfulPaint = entry.startTime
          }
        }
      })
      paintObserver.observe({ entryTypes: ['paint'] })
      this.observers.push(paintObserver)

      // Observe largest contentful paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const lastEntry = entries[entries.length - 1]
        this.metrics.largestContentfulPaint = lastEntry.startTime
      })
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] })
      this.observers.push(lcpObserver)

      // Observe layout shift
      const layoutShiftObserver = new PerformanceObserver(() => {
        // Could track cumulative layout shift here
      })
      layoutShiftObserver.observe({ entryTypes: ['layout-shift'] })
      this.observers.push(layoutShiftObserver)

    } catch (error) {
      console.warn('Performance observer setup failed:', error)
    }
  }

  /**
   * Start monitoring
   */
  startMonitoring(): void {
    // Monitor page load timing
    if (typeof window !== 'undefined' && window.performance) {
      window.addEventListener('load', () => {
        this.collectPageLoadMetrics()
      })
    }

    // Monitor memory (Chrome only)
    if (typeof window !== 'undefined' && (performance as any).memory) {
      setInterval(() => {
        this.collectMemoryMetrics()
      }, 5000)
    }
  }

  /**
   * Collect page load metrics
   */
  private collectPageLoadMetrics(): void {
    if (typeof window === 'undefined' || !window.performance) return

    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming

    if (navigation) {
      this.metrics.pageLoadTime = navigation.loadEventEnd - navigation.fetchStart
      this.metrics.domContentLoaded = navigation.domContentLoadedEventEnd - navigation.fetchStart
    }

    this.collectResourceMetrics()
  }

  /**
   * Collect resource metrics
   */
  private collectResourceMetrics(): void {
    if (typeof window === 'undefined' || !window.performance) return

    const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[]

    this.metrics.totalResources = resources.length

    let totalSize = 0
    let slowCount = 0

    for (const resource of resources) {
      // Estimate size (transferSize is not always available)
      const size = resource.transferSize || 0
      totalSize += size

      // Count slow resources (>1 second)
      if (resource.duration > 1000) {
        slowCount++
      }
    }

    this.metrics.totalResourceSize = totalSize
    this.metrics.slowResources = slowCount
  }

  /**
   * Collect memory metrics
   */
  private collectMemoryMetrics(): void {
    if (typeof window === 'undefined' || !(performance as any).memory) return

    const memory = (performance as any).memory

    this.metrics.memoryUsed = memory.usedJSHeapSize
    this.metrics.memoryTotal = memory.totalJSHeapSize
    this.metrics.memoryLimit = memory.jsHeapSizeLimit
  }

  /**
   * Measure interaction latency
   */
  measureInteraction(_label: string): () => void {
    const start = performance.now()

    return () => {
      const duration = performance.now() - start
      this.metrics.interactionLatency.push(duration as never)

      // Keep only last 50 interactions
      if (this.metrics.interactionLatency.length > 50) {
        this.metrics.interactionLatency.shift()
      }
    }
  }

  /**
   * Measure script execution time
   */
  measureScriptTime(fn: () => void): number {
    const start = performance.now()
    fn()
    const duration = performance.now() - start
    this.metrics.scriptExecutionTime += duration
    return duration
  }

  /**
   * Get current metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }

  /**
   * Get performance score
   */
  getPerformanceScore(): {
    overall: number
    speed: number
    efficiency: number
    reliability: number
    details: string[]
  } {
    const details: string[] = []
    let score = 100

    // Page load time (0-30 points)
    if (this.metrics.pageLoadTime > 5000) {
      score -= 30
      details.push('Page load time is very slow (>5s)')
    } else if (this.metrics.pageLoadTime > 3000) {
      score -= 20
      details.push('Page load time is slow (>3s)')
    } else if (this.metrics.pageLoadTime > 1500) {
      score -= 10
      details.push('Page load time could be improved (>1.5s)')
    }

    // First contentful paint (0-20 points)
    if (this.metrics.firstContentfulPaint > 3000) {
      score -= 20
      details.push('First contentful paint is slow (>3s)')
    } else if (this.metrics.firstContentfulPaint > 1800) {
      score -= 10
      details.push('First contentful paint could be improved (>1.8s)')
    }

    // Memory usage (0-20 points)
    if (this.metrics.memoryLimit > 0) {
      const memoryUsagePercent = (this.metrics.memoryUsed / this.metrics.memoryLimit) * 100
      if (memoryUsagePercent > 80) {
        score -= 20
        details.push('Memory usage is high (>80%)')
      } else if (memoryUsagePercent > 60) {
        score -= 10
        details.push('Memory usage is moderate (>60%)')
      }
    }

    // Slow resources (0-15 points)
    if (this.metrics.slowResources > 10) {
      score -= 15
      details.push('Many slow resources detected')
    } else if (this.metrics.slowResources > 5) {
      score -= 8
      details.push('Some slow resources detected')
    }

    // Resource size (0-15 points)
    const resourceSizeMB = this.metrics.totalResourceSize / 1024 / 1024
    if (resourceSizeMB > 10) {
      score -= 15
      details.push('Total page size is large (>10MB)')
    } else if (resourceSizeMB > 5) {
      score -= 8
      details.push('Total page size could be optimized (>5MB)')
    }

    if (details.length === 0) {
      details.push('Excellent performance! All metrics are within optimal ranges.')
    }

    return {
      overall: Math.max(0, score),
      speed: this.calculateSpeedScore(),
      efficiency: this.calculateEfficiencyScore(),
      reliability: this.calculateReliabilityScore(),
      details
    }
  }

  private calculateSpeedScore(): number {
    const loadTimeScore = Math.max(0, 100 - (this.metrics.pageLoadTime / 5000) * 100)
    const fcpScore = Math.max(0, 100 - (this.metrics.firstContentfulPaint / 3000) * 100)
    return Math.round((loadTimeScore + fcpScore) / 2)
  }

  private calculateEfficiencyScore(): number {
    if (this.metrics.memoryLimit === 0) return 100

    const memoryUsagePercent = (this.metrics.memoryUsed / this.metrics.memoryLimit) * 100
    return Math.max(0, Math.round(100 - memoryUsagePercent))
  }

  private calculateReliabilityScore(): number {
    const resourceScore = Math.max(0, 100 - (this.metrics.slowResources / 10) * 100)

    const interactionLatency = this.metrics.interactionLatency
    if (interactionLatency.length === 0) return resourceScore

    const avgLatency = interactionLatency.reduce((sum: number, i: number) => sum + i, 0) / interactionLatency.length
    const latencyScore = Math.max(0, 100 - (avgLatency / 200) * 100)

    return Math.round((resourceScore + latencyScore) / 2)
  }

  /**
   * Generate performance report
   */
  generateReport(): {
    timestamp: number
    metrics: PerformanceMetrics
    score: any
    recommendations: string[]
  } {
    const score = this.getPerformanceScore()

    return {
      timestamp: Date.now(),
      metrics: this.getMetrics(),
      score,
      recommendations: this.generateRecommendations(score)
    }
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(score: any): string[] {
    const recommendations: string[] = []

    if (score.overall < 70) {
      recommendations.push('🔴 Critical: Performance needs immediate attention')
    } else if (score.overall < 85) {
      recommendations.push('🟡 Warning: Some performance issues detected')
    } else {
      recommendations.push('✅ Excellent performance! Keep monitoring.')
    }

    if (this.metrics.pageLoadTime > 3000) {
      recommendations.push('Optimize page load time: lazy load resources, reduce bundle size')
    }

    if (this.metrics.firstContentfulPaint > 1800) {
      recommendations.push('Improve first paint: inline critical CSS, reduce render-blocking resources')
    }

    if (this.metrics.slowResources > 5) {
      recommendations.push('Optimize slow resources: use CDNs, compress images, enable caching')
    }

    const resourceSizeMB = this.metrics.totalResourceSize / 1024 / 1024
    if (resourceSizeMB > 5) {
      recommendations.push('Reduce page size: optimize images, minify code, use compression')
    }

    if (this.metrics.memoryLimit > 0) {
      const memoryUsagePercent = (this.metrics.memoryUsed / this.metrics.memoryLimit) * 100
      if (memoryUsagePercent > 70) {
        recommendations.push('Reduce memory usage: check for memory leaks, optimize data structures')
      }
    }

    return recommendations
  }

  /**
   * Stop monitoring and cleanup
   */
  stopMonitoring(): void {
    for (const observer of this.observers) {
      observer.disconnect()
    }
    this.observers = []
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor()
