/**
 * AI Insights Edge Function with Rate Limiting
 * Generates AI-powered insights using Gemini API
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

// Simple rate limiter (in-memory for this Edge Function instance)
const rateLimiter = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(identifier: string): boolean {
  const now = Date.now()
  const limit = 20 // requests per minute
  const window = 60000 // 1 minute

  const record = rateLimiter.get(identifier)

  if (!record || now > record.resetTime) {
    rateLimiter.set(identifier, { count: 1, resetTime: now + window })
    return true
  }

  if (record.count >= limit) {
    return false
  }

  record.count++
  return true
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    // Extract client IP for rate limiting
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] ||
                     req.headers.get('x-real-ip') ||
                     'unknown'

    // Check rate limit
    if (!checkRateLimit(clientIp)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { 
          status: 429,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': '60'
          }
        }
      )
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { job_id, analysis_results, dataset_name } = await req.json()

    if (!job_id || !analysis_results) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate AI insights using Gemini
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')
    
    if (!geminiApiKey) {
      console.warn('GEMINI_API_KEY not configured, using rule-based insights')
      const fallbackInsights = generateFallbackInsights(analysis_results, dataset_name)
      
      // Save to database
      await supabase
        .from('ai_insights')
        .upsert({ job_id, insights: fallbackInsights })

      return new Response(
        JSON.stringify({ success: true, insights: fallbackInsights }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    try {
      const prompt = buildPrompt(analysis_results, dataset_name)
      
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 2048
            }
          })
        }
      )

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`)
      }

      const data = await response.json()
      const insights = data.candidates?.[0]?.content?.parts?.[0]?.text || 
                      generateFallbackInsights(analysis_results, dataset_name)

      // Save to database
      await supabase
        .from('ai_insights')
        .upsert({ job_id, insights })

      console.log('AI insights generated for job:', job_id)

      return new Response(
        JSON.stringify({ success: true, insights }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } catch (geminiError) {
      console.error('Gemini API error:', geminiError)
      
      // Fallback to rule-based insights
      const fallbackInsights = generateFallbackInsights(analysis_results, dataset_name)
      
      await supabase
        .from('ai_insights')
        .upsert({ job_id, insights: fallbackInsights })

      return new Response(
        JSON.stringify({ success: true, insights: fallbackInsights }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

  } catch (error) {
    console.error('AI insights function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function buildPrompt(analysis_results: any, dataset_name: string): string {
  return `Analyze this dataset and provide key insights:

Dataset: ${dataset_name}
Rows: ${analysis_results.statistics?.row_count || 'N/A'}
Columns: ${analysis_results.statistics?.column_count || 'N/A'}

Key Statistics: ${JSON.stringify(analysis_results.statistics?.column_stats || {})}

Provide a comprehensive analysis including:
1. Overview of the dataset
2. Key patterns and trends
3. Notable outliers or anomalies
4. Data quality observations
5. Potential insights for decision-making

Keep the analysis concise but informative (2-3 paragraphs).`
}

function generateFallbackInsights(analysis_results: any, dataset_name: string): string {
  const stats = analysis_results.statistics
  const rowCount = stats?.row_count || 0
  const colCount = stats?.column_count || 0

  return `## Dataset Analysis: ${dataset_name}

This dataset contains ${rowCount} rows and ${colCount} columns of data. 

### Key Observations:

The dataset has been processed through our automated analysis pipeline. Basic statistical summaries have been generated for all numeric columns, including measures of central tendency (mean, median) and dispersion (standard deviation, quartiles).

### Data Quality:

Basic data quality checks have been performed. For more detailed insights, ensure your data has complete coverage and consistent formatting.

### Recommendations:

- Review the statistical summaries for each column
- Check for any missing values or outliers
- Consider additional domain-specific analysis based on your use case

*Note: This is a rule-based summary. Configure GEMINI_API_KEY for AI-powered insights.*`
}
