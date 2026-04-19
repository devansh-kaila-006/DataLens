/**
 * Supabase Edge Function: Gemini Quality Assessment
 * Detects data quality issues and provides recommendations
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { analysisResult, userId } = await req.json()

    if (!analysisResult) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing analysisResult parameter'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const issues: any[] = []
    const totalRows = analysisResult.summary?.totalRows || 0
    const totalCols = analysisResult.summary?.totalColumns || 0

    // Check for high missing values
    Object.entries(analysisResult.summary?.missingValues || {}).forEach(([col, missing]: [string, number]) => {
      const missingPercent = (missing / totalRows) * 100

      if (missingPercent > 30) {
        issues.push({
          severity: 'critical',
          category: 'missing_values',
          message: `"${col}" has ${missingPercent.toFixed(1)}% missing values`,
          recommendation: `Consider imputation (median/mode) or removing this column`
        })
      } else if (missingPercent > 15) {
        issues.push({
          severity: 'high',
          category: 'missing_values',
          message: `"${col}" has ${missingPercent.toFixed(1)}% missing values`,
          recommendation: `Apply imputation strategies or remove affected rows`
        })
      } else if (missingPercent > 5) {
        issues.push({
          severity: 'medium',
          category: 'missing_values',
          message: `"${col}" has ${missingPercent.toFixed(1)}% missing values`,
          recommendation: `Monitor impact on analysis, consider imputation`
        })
      }
    })

    // Check for high correlations
    const highCorrelations = (analysisResult.correlations || []).filter((c: any) => Math.abs(c.correlation) > 0.95)
    highCorrelations.forEach((corr: any) => {
      issues.push({
        severity: 'high',
        category: 'correlation',
        message: `Very high correlation (${corr.correlation.toFixed(3)}) between "${corr.col1}" and "${corr.col2}"`,
        recommendation: `Consider removing one variable to avoid multicollinearity`
      })
    })

    const veryHighCorrelations = (analysisResult.correlations || []).filter((c: any) => Math.abs(c.correlation) > 0.85)
    veryHighCorrelations.forEach((corr: any) => {
      // Skip if already added as high correlation
      if (Math.abs(corr.correlation) <= 0.95) {
        issues.push({
          severity: 'medium',
          category: 'correlation',
          message: `High correlation (${corr.correlation.toFixed(3)}) between "${corr.col1}" and "${corr.col2}"`,
          recommendation: `Monitor for multicollinearity in models`
        })
      }
    })

    // Check for extreme outliers in numerical data
    Object.entries(analysisResult.statistics?.numerical || {}).forEach(([col, stats]: [string, any]) => {
      if (stats.quartiles && stats.outliers) {
        const iqr = stats.quartiles[2] - stats.quartiles[0]
        const outlierThreshold = stats.quartiles[2] + (3 * iqr)

        if (stats.max > outlierThreshold) {
          issues.push({
            severity: 'medium',
            category: 'outliers',
            message: `"${col}" contains potential outliers (max: ${stats.max})`,
            recommendation: `Consider capping or transforming extreme values`
          })
        }
      }
    })

    return new Response(JSON.stringify({
      success: true,
      issues,
      totalIssues: issues.length,
      criticalIssues: issues.filter((i: any) => i.severity === 'critical').length,
      timestamp: new Date().toISOString()
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })

  } catch (error) {
    console.error('Quality assessment error:', error)

    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to assess data quality',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
