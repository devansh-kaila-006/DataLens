/**
 * Supabase Edge Function: Gemini Transformation Suggestions
 * Provides data transformation recommendations for improving data quality
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
    const { columnName, stats } = await req.json()

    if (!columnName || !stats) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required parameters: columnName and stats'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const suggestions = []

    // Check for potential skewness (if range is much larger than std)
    if (stats.std && stats.mean && (stats.max - stats.min) > 10 * stats.std) {
      suggestions.push({
        column: columnName,
        transformation: 'Log Transformation',
        reason: 'Reduces right-skew and compresses large values',
        code: `Math.log(${columnName} + 1)`
      })
    }

    // Check for different scales
    if (stats.std && stats.mean && stats.std / stats.mean > 0.5) {
      suggestions.push({
        column: columnName,
        transformation: 'Standardization (Z-score)',
        reason: 'Scales data to have mean=0, std=1 for better model convergence',
        code: `(${columnName} - ${stats.mean.toFixed(2)}) / ${stats.std.toFixed(2)}`
      })
    }

    // Check for highly variable data
    if (stats.std && stats.mean && stats.std > 2 * stats.mean) {
      suggestions.push({
        column: columnName,
        transformation: 'Robust Scaling',
        reason: 'Handles outliers better than standardization',
        code: `RobustScaler(${columnName})`
      })
    }

    // Check for large range
    if (stats.min < 0 && stats.max > 0 && (stats.max - stats.min) > 1000) {
      suggestions.push({
        column: columnName,
        transformation: 'Min-Max Normalization',
        reason: 'Scales data to [0, 1] range',
        code: `(${columnName} - ${stats.min}) / (${stats.max} - ${stats.min})`
      })
    }

    return new Response(JSON.stringify({
      success: true,
      suggestions,
      column: columnName,
      timestamp: new Date().toISOString()
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })

  } catch (error) {
    console.error('Transformation suggestions error:', error)

    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to generate transformation suggestions',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})
