/**
 * Supabase Edge Function: Gemini Insights Generator
 * Handles AI narrative generation for EDA reports
 * Keeps Gemini API key secure on server-side
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { GoogleGenerativeAI } from 'npm:@google/generative-ai@0.21.0'

// Initialize Gemini AI with environment variable
const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!)
const model = genAI.getGenerativeModel({
  model: Deno.env.get('GEMINI_MODEL') || 'gemini-2.5-pro'
})

// Rate limiting (simple in-memory for demo)
const rateLimiter = new Map()
const RATE_LIMIT = 100 // requests per hour per user
const RATE_WINDOW = 60 * 60 * 1000 // 1 hour in milliseconds

function checkRateLimit(userId: string): boolean {
  const now = Date.now()
  const userRequests = rateLimiter.get(userId) || []

  // Remove old requests outside the time window
  const validRequests = userRequests.filter((time: number) => now - time < RATE_WINDOW)

  if (validRequests.length >= RATE_LIMIT) {
    return false // Rate limit exceeded
  }

  validRequests.push(now)
  rateLimiter.set(userId, validRequests)
  return true // Within rate limit
}

serve(async (req) => {
  // Handle CORS preflight
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
    const body = await req.json()
    const {
      analysisResult,
      datasetName,
      userId
    } = body

    // Rate limiting check
    if (userId && !checkRateLimit(userId)) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Rate limit exceeded. Please try again later.',
        retryAfter: 3600
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Validate input
    if (!analysisResult || !datasetName) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing required parameters: analysisResult and datasetName'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Construct the prompt for Gemini
    const prompt = `You are an expert data scientist analyzing a dataset called "${datasetName}".

Based on the following statistical analysis, provide a 2-paragraph executive summary:

Dataset Overview:
- Total Rows: ${analysisResult.summary.totalRows?.toLocaleString() || 'N/A'}
- Total Columns: ${analysisResult.summary.totalColumns || 'N/A'}
- Numerical Columns: ${Object.keys(analysisResult.statistics?.numerical || {}).length}
- Categorical Columns: ${Object.keys(analysisResult.statistics?.categorical || {}).length}

Key Statistics:
${Object.entries(analysisResult.statistics?.numerical || {}).slice(0, 5).map(([col, stats]: any[]) =>
  `- ${col}: mean=${(stats as any).mean?.toFixed(2) || 'N/A'}, std=${(stats as any).std?.toFixed(2) || 'N/A'}, range=[${(stats as any).min || 'N/A'}, ${(stats as any).max || 'N/A'}]`
).join('\n')}

Correlations:
${(analysisResult.correlations || []).slice(0, 5).map((c: any) =>
  `- ${c.col1} vs ${c.col2}: ${c.correlation?.toFixed(3) || 'N/A'}`
).join('\n')}

Data Quality:
- Missing Values: ${Object.values(analysisResult.summary?.missingValues || {}).reduce((a: number, b: number) => a + b, 0)}
- Missing Percentage: ${((Object.values(analysisResult.summary?.missingValues || {}).reduce((a: number, b: number) => a + b, 0) / (analysisResult.summary?.totalRows * analysisResult.summary?.totalColumns)) * 100).toFixed(1)}%

Provide:
1. A concise overview of the dataset's characteristics and key patterns
2. Critical data quality observations and their potential impact
3. Brief mention of the most interesting relationships found

Keep it professional, actionable, and under 200 words total.`

    // Generate insights using Gemini
    const result = await model.generateContent(prompt)
    const response = await result.response

    return new Response(JSON.stringify({
      success: true,
      insights: response.text(),
      model: Deno.env.get('GEMINI_MODEL') || 'gemini-pro',
      timestamp: new Date().toISOString()
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })

  } catch (error) {
    console.error('Gemini insights error:', error)

    return new Response(JSON.stringify({
      success: false,
      error: 'Failed to generate insights',
      details: error.message
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})