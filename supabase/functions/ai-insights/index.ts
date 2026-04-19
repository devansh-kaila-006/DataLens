import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenAI } from "https://esm.sh/@google/genai@1.3.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { job_id, analysis_results, dataset_name } = await req.json()

    if (!job_id || !analysis_results || !dataset_name) {
      return new Response(
        JSON.stringify({ error: "Missing required fields: job_id, analysis_results, dataset_name" }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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

    // Use gemini-flash model for better availability
    const response = await ai.models.generateContent({
      model: 'gemini-1.5-flash',
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

    const insights = response.text || "Unable to generate insights"

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
        result_data: { narrative: insights }
      })
    })

    if (!saveResponse.ok) {
      throw new Error(`Failed to save insights: ${await saveResponse.text()}`)
    }

    return new Response(
      JSON.stringify({ success: true, insights }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
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
