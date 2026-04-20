import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenAI } from "https://esm.sh/@google/genai@1.3.0";
import { STRICT_LIMITER, extractClientIp, createRateLimitResponse, createRateLimitHeaders } from '../_shared/rate-limiter.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Security monitoring for AI insights endpoint
 * Logs suspicious activities and potential attacks
 */
function logSecurityEvent(
  eventType: string,
  details: Record<string, any>,
  severity: 'info' | 'warning' | 'critical' = 'info',
  ipAddress: string = 'unknown'
) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    event_type: eventType,
    severity,
    ip_address: ipAddress,
    details
  };

  console.warn(`[SECURITY] ${eventType}:`, JSON.stringify(logEntry));
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Extract client IP for rate limiting and security
    const clientIp = extractClientIp(req);

    // Check rate limit (use strict limiter for expensive AI operations)
    const limitInfo = STRICT_LIMITER.checkRateLimit(clientIp, 'minute');

    if (!limitInfo.allowed) {
      logSecurityEvent(
        'rate_limit_exceeded',
        { endpoint: 'ai-insights', limit: limitInfo.limit },
        'warning',
        clientIp
      );
      return createRateLimitResponse(limitInfo);
    }

    // Log the request for security monitoring
    logSecurityEvent(
      'ai_insights_request',
      { job_id: 'unknown' }, // Will update after parsing
      'info',
      clientIp
    );

    const { job_id, analysis_results, dataset_name } = await req.json()

    if (!job_id || !analysis_results || !dataset_name) {
      logSecurityEvent(
        'invalid_request',
        { missing_fields: ['job_id', 'analysis_results', 'dataset_name'].filter(f => !eval(f)) },
        'warning',
        clientIp
      );
      return new Response(
        JSON.stringify({ error: "Missing required fields: job_id, analysis_results, dataset_name" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate job_id format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(job_id)) {
      logSecurityEvent(
        'invalid_uuid',
        { job_id },
        'warning',
        clientIp
      );
      return new Response(
        JSON.stringify({ error: "Invalid job ID format. Must be a valid UUID." }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate dataset_name for injection attempts
    const dangerousPatterns = ['<script', 'javascript:', 'onerror=', 'onload='];
    const datasetNameLower = dataset_name.toLowerCase();
    if (dangerousPatterns.some(pattern => datasetNameLower.includes(pattern))) {
      logSecurityEvent(
        'suspicious_content',
        { field: 'dataset_name', pattern_found: true },
        'critical',
        clientIp
      );
      return new Response(
        JSON.stringify({ error: "Invalid dataset name. Suspicious content detected." }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Log successful request parsing
    logSecurityEvent(
      'ai_insights_request_valid',
      { job_id, dataset_name },
      'info',
      clientIp
    );

    // Get API key from environment
    const apiKey = Deno.env.get("GEMINI_API_KEY")
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "GEMINI_API_KEY not found in environment" }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const ai = new GoogleGenAI({ apiKey })

    // Build the prompt for EDA insights
    const prompt = buildEDAPrompt(analysis_results, dataset_name)

    // Try with retry logic for rate limiting
    let insights = "Unable to generate insights"
    let lastError = null

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        // Use gemini-flash-lite-latest model for better availability
        const response = await ai.models.generateContent({
          model: 'gemini-flash-lite-latest',
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            temperature: 0.7,
            topP: 0.95,
            topK: 40,
          }
        })

        if (!response || !response.candidates || response.candidates.length === 0) {
          throw new Error("AI returned empty response")
        }

        insights = response.text || "Unable to generate insights"
        break // Success! Exit retry loop

      } catch (error: any) {
        lastError = error
        const errorMsg = error.message || error.toString()

        // Check for rate limiting or high demand errors
        if (errorMsg.includes("503") || errorMsg.includes("high demand") || errorMsg.includes("quota")) {
          console.warn(`Attempt ${attempt + 1} failed - rate limited. Retrying in ${(attempt + 1) * 2}s...`)

          if (attempt < 2) { // Don't sleep after last attempt
            await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 2000))
            continue
          }
        }

        // For other errors, don't retry
        if (attempt === 0) {
          throw error // Only throw on first attempt for non-rate-limit errors
        }
      }
    }

    // If all retries failed, provide fallback insights
    if (insights === "Unable to generate insights" && lastError) {
      console.error("All AI generation attempts failed:", lastError)

      // Generate fallback insights based on data
      insights = generateFallbackInsights(analysis_results, dataset_name)
    }

    // Save insights to database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

    const saveResponse = await fetch(`${supabaseUrl}/rest/v1/analysis_results`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      },
      body: JSON.stringify({
        job_id: job_id,
        result_type: 'ai_insights',
        result_data: {
          narrative: insights,
          is_fallback: insights.includes("AI service temporarily unavailable")
        }
      })
    })

    if (!saveResponse.ok) {
      throw new Error(`Failed to save insights: ${await saveResponse.text()}`)
    }

    return new Response(
      JSON.stringify({
        success: true,
        insights,
        rate_limit: {
          limit: limitInfo.limit,
          remaining: limitInfo.remaining
        }
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          ...Object.fromEntries(createRateLimitHeaders(limitInfo))
        }
      }
    )

  } catch (error) {
    console.error('Error generating AI insights:', error)
    return new Response(
      JSON.stringify({
        error: "Failed to generate AI insights",
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function generateFallbackInsights(analysis_results: any, dataset_name: string): string {
  const summary = analysis_results.summary || {}
  const quality = analysis_results.data_quality || {}
  const ml_readiness = analysis_results.ml_readiness || {}

  const rows = summary.total_rows || 0
  const cols = summary.total_columns || 0
  const missing = quality.completeness?.missing_percentage || 0
  const mlScore = ml_readiness.overall_score || 0

  return `**Dataset Overview**: ${dataset_name} contains ${rows} rows and ${cols} columns. ` +
    `The dataset has been processed through automated exploratory data analysis, ` +
    `generating statistical summaries, correlation matrices, and distribution analyses.\n\n` +
    `**Data Quality**: ${missing.toFixed(1)}% missing values detected. ` +
    `ML readiness score: ${mlScore}/100. ` +
    `The analysis reveals key patterns in the data that can be explored through the visualizations above.\n\n` +
    `**Note**: AI service temporarily unavailable. Insights generated from automated analysis. ` +
    `Please retry later for AI-powered narrative insights.`
}

function buildEDAPrompt(analysis_results: any, dataset_name: string): string {
  const summary = analysis_results.summary || {}
  const statistics = analysis_results.statistics || {}
  const correlations = analysis_results.correlations || {}
  const quality = analysis_results.data_quality || {}
  const ml_readiness = analysis_results.ml_readiness || {}

  // Build dataset overview
  const overview = `Dataset: ${dataset_name}
- Rows: ${summary.total_rows || 'N/A'}
- Columns: ${summary.total_columns || 'N/A'}
- Numerical: ${summary.numerical_columns || 0}
- Categorical: ${summary.categorical_columns || 0}`

  // Build statistics summary
  const statsSummary = buildStatisticsSummary(statistics)

  // Build correlations summary
  const corrSummary = buildCorrelationsSummary(correlations)

  // Build quality summary
  const qualitySummary = buildQualitySummary(quality)

  // Build ML readiness summary
  const mlSummary = `ML Readiness Score: ${ml_readiness.overall_score || 0}/100 (${ml_readiness.readiness_level || 'unknown'})`

  return `You are an expert data scientist analyzing a dataset called "${dataset_name}".

${overview}

KEY STATISTICS:
${statsSummary}

CORRELATIONS:
${corrSummary}

DATA QUALITY:
${qualitySummary}

ML READINESS:
${mlSummary}

Based on this analysis, provide a comprehensive 2-paragraph executive summary that includes:

1. First paragraph: Dataset overview and key patterns
   - Main characteristics and structure
   - Notable patterns in the data
   - Distribution of features

2. Second paragraph: Data quality assessment and recommendations
   - Critical data quality issues
   - Potential impact on analysis
   - Specific recommendations for improvement

Keep it professional, actionable, and under 200 words total. Focus on insights that would be valuable for a data scientist or analyst working with this dataset.`
}

function buildStatisticsSummary(statistics: any): string {
  const lines: string[] = []
  const numerical = statistics.numerical || {}

  for (const [col, stats] of Object.entries(numerical).slice(0, 5)) {
    const s = stats as any
    lines.push(
      `- ${col}: mean=${s.mean?.toFixed(2) || 0}, ` +
      `std=${s.std?.toFixed(2) || 0}, ` +
      `range=[${s.min?.toFixed(2) || 0}, ${s.max?.toFixed(2) || 0}]`
    )
  }

  return lines.length > 0 ? lines.join('\n') : "No numerical statistics available"
}

function buildCorrelationsSummary(correlations: any): string {
  // Handle nested structure
  const corrList = Array.isArray(correlations) ? correlations :
                   (correlations.correlations ? correlations.correlations : [])

  if (!corrList || corrList.length === 0) {
    return "No significant correlations found"
  }

  const strongCorrelations = corrList.filter((c: any) => Math.abs(c.correlation) > 0.7)
  const lines: string[] = []

  for (const corr of strongCorrelations.slice(0, 5)) {
    lines.push(`- ${corr.col1} vs ${corr.col2}: ${corr.correlation?.toFixed(3) || 0}`)
  }

  return lines.length > 0 ? lines.join('\n') : "No strong correlations"
}

function buildQualitySummary(quality: any): string {
  const completeness = quality.completeness || {}
  const uniqueness = quality.uniqueness || {}

  return `- Missing values: ${completeness.missing_percentage?.toFixed(1) || 0}%
- Duplicate rows: ${uniqueness.duplicate_percentage?.toFixed(1) || 0}%`
}
