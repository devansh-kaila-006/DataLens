// 1. DataLens Environment Shim
const envStore: Record<string, string> = {};
(globalThis as any).process = {
  env: new Proxy({}, {
    get: (_, prop: string) => envStore[prop] || (globalThis as any).Deno.env.get(prop),
    set: (_, prop: string, value: string) => {
      envStore[prop] = value;
      return true;
    }
  })
} as any;

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "https://esm.sh/@google/genai@1.3.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

// Simple in-memory rate limiter
const rateLimiter = new Map<string, { count: number; resetTime: number }>()

function checkRateLimit(identifier: string, limit: number = 20, windowMs: number = 60000): boolean {
  const now = Date.now()
  const record = rateLimiter.get(identifier)

  if (!record || now > record.resetTime) {
    rateLimiter.set(identifier, { count: 1, resetTime: now + windowMs })
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
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] ||
                     req.headers.get('x-real-ip') ||
                     'unknown'

    if (!checkRateLimit(clientIp, 20, 60000)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const body = await req.json();
    const { job_id, analysis_results, dataset_name } = body;

    if (!job_id || !analysis_results) {
      return new Response(
        JSON.stringify({ error: "Validation Error: job_id and analysis_results are required." }),
        { status: 400, headers: corsHeaders }
      );
    }

    const rawKeys = (globalThis as any).Deno.env.get("GEMINI_API_KEY") || "";
    const apiKeys = rawKeys.split(',').map(k => k.trim()).filter(Boolean);

    if (apiKeys.length === 0) {
      // No API key configured, use fallback
      console.warn('GEMINI_API_KEY not configured, using fallback insights');
      const fallbackInsights = generateFallbackInsights(analysis_results, dataset_name);
      await saveInsights(job_id, fallbackInsights, true);
      return new Response(
        JSON.stringify({ success: true, insights: fallbackInsights }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let lastErrorMsg = "Unknown Error";
    let generatedInsights = "";

    // Cycle through provided API keys to find one with available quota
    for (const currentKey of apiKeys) {
      try {
        const ai = new GoogleGenAI({ apiKey: currentKey });
        const prompt = buildPrompt(analysis_results, dataset_name);

        console.log(`Attempting API call with key ${currentKey.substring(0, 8)}...`);

        // Using 'gemini-flash-lite-latest' (Gemini 2.5 Flash Lite) for maximum availability
        const response = await ai.models.generateContent({
          model: 'gemini-flash-lite-latest',
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          config: {
            systemInstruction: `### DataLens AI Analyst Directive ###
You are an expert Data Scientist and AI Analyst specializing in exploratory data analysis (EDA) and automated insights generation.

Your role is to analyze datasets and provide clear, actionable, data-driven insights.

GUIDELINES:
1. Be concise and specific (2-3 paragraphs, under 300 words)
2. Focus on the most important patterns, trends, and anomalies
3. Be technical but accessible
4. Provide actionable recommendations
5. Reference specific statistics and metrics when available
6. Avoid generic fluff - be data-driven

OUTPUT FORMAT:
- Paragraph 1: Dataset overview and key characteristics
- Paragraph 2: Notable patterns, trends, outliers, or correlations
- Paragraph 3: Data quality assessment and recommendations

Keep it professional, insightful, and actionable.`,
            temperature: 0.7,
            topP: 0.95,
            topK: 40,
            tools: [],
            safetySettings: [
              { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
              { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
              { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
              { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE }
            ]
          },
        });

        if (!response || !response.candidates || response.candidates.length === 0) {
          throw new Error("AI returned empty candidate pool.");
        }

        generatedInsights = response.text || "";
        console.log('AI insights generated successfully');

        // Save insights and return
        await saveInsights(job_id, generatedInsights, false);
        return new Response(
          JSON.stringify({ success: true, insights: generatedInsights }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );

      } catch (err: any) {
        lastErrorMsg = err.message;
        // Specifically identify quota errors
        if (err.message.includes("429") || err.message.includes("RESOURCE_EXHAUSTED") || err.message.includes("quota")) {
          console.warn(`Node failure (Quota) on key ${currentKey.substring(0, 8)}...: ${err.message}`);
          continue;
        }
        // For other fatal errors, we break early to avoid key burning
        console.error(`Fatal Node failure on key ${currentKey.substring(0, 8)}...: ${err.message}`);
        break;
      }
    }

    // If we reach here, all keys failed or were exhausted - use fallback
    console.warn('All API keys exhausted, using fallback insights');
    const fallbackInsights = generateFallbackInsights(analysis_results, dataset_name);
    await saveInsights(job_id, fallbackInsights, true);
    return new Response(
      JSON.stringify({ success: true, insights: fallbackInsights }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error in ai-insights function:', error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function saveInsights(jobId: string, insights: string, isFallback: boolean) {
  const supabaseUrl = (globalThis as any).Deno.env.get("SUPABASE_URL")!
  const supabaseKey = (globalThis as any).Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!

  console.log('Saving insights to database...')

  const saveResponse = await fetch(`${supabaseUrl}/rest/v1/analysis_results`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`
    },
    body: JSON.stringify({
      job_id: jobId,
      result_type: 'ai_insights',
      result_data: {
        narrative: insights,
        is_fallback: isFallback
      }
    })
  })

  if (!saveResponse.ok) {
    const errorText = await saveResponse.text()
    console.error('Failed to save insights:', errorText)
    throw new Error(`Failed to save insights: ${errorText}`)
  }

  console.log('Insights saved for job:', jobId)
}

function buildPrompt(analysis_results: any, dataset_name: string): string {
  const summary = analysis_results.summary || {}
  const statistics = analysis_results.statistics || {}
  const quality = analysis_results.data_quality || {}
  const ml_readiness = analysis_results.ml_readiness || {}

  return `### DATASET ANALYSIS REQUEST ###

Dataset Name: ${dataset_name || 'Unknown Dataset'}

DATASET OVERVIEW:
- Total Rows: ${summary.total_rows || 'N/A'}
- Total Columns: ${summary.total_columns || 'N/A'}
- Numerical Columns: ${summary.numerical_columns || 0}
- Categorical Columns: ${summary.categorical_columns || 0}

DATA QUALITY METRICS:
- Completeness Score: ${quality.completeness?.score || 'N/A'}%
- Missing Value Percentage: ${quality.completeness?.missing_percentage || 0}%
- Overall Data Quality: ${quality.overall_quality || 'Assessed'}

MACHINE LEARNING READINESS:
- ML Readiness Score: ${ml_readiness.overall_score || 0}/100
- Readiness Level: ${ml_readiness.readiness_level || 'Unknown'}
- Feature Quality: ${ml_readiness.feature_quality || 'Assessed'}

STATISTICAL SUMMARY:
${Object.keys(statistics).length > 0 ? 'Statistical summaries available for all numeric columns (mean, median, std dev, quartiles)' : 'Basic statistics computed'}

### ANALYSIS REQUESTED:
Please provide a comprehensive 2-3 paragraph analysis covering:
1. Dataset structure, dimensions, and key characteristics
2. Notable patterns, trends, outliers, or correlations in the data
3. Data quality assessment and recommendations for further analysis

Be specific, data-driven, and actionable. Keep it under 300 words.`
}

function generateFallbackInsights(analysis_results: any, dataset_name: string): string {
  const summary = analysis_results.summary || {}
  const quality = analysis_results.data_quality || {}
  const ml_readiness = analysis_results.ml_readiness || {}

  const rows = summary.total_rows || 0
  const cols = summary.total_columns || 0
  const completeness = quality.completeness?.score || 0
  const mlScore = ml_readiness.overall_score || 0

  return `## Dataset Analysis: ${dataset_name || 'Unknown Dataset'}

This dataset contains **${rows.toLocaleString()} rows** and **${cols} columns** of data. The automated EDA pipeline has generated comprehensive statistical summaries, correlation matrices, and distribution visualizations.

### Data Quality Assessment

The dataset shows a completeness score of **${completeness.toFixed(1)}%**, indicating ${completeness > 90 ? 'excellent' : completeness > 70 ? 'good' : 'moderate'} data quality. Automated profiling has identified data types, missing value patterns, and outlier distributions across all columns.

### Machine Learning Readiness

The ML readiness score is **${mlScore}/100** (${ml_readiness.readiness_level || 'assessed level'}). This assessment evaluates feature distributions, target variable suitability, and preprocessing requirements for potential ML applications.

### Key Insights

Statistical analysis has revealed summary statistics, correlation patterns, and distribution characteristics for all numerical and categorical variables. Use the interactive visualizations to explore:

- **Distribution Analysis**: Histograms and box plots for each numerical column
- **Correlation Matrix**: Heatmap showing relationships between variables
- **Statistical Summaries**: Mean, median, standard deviation, and quartiles
- **Missing Value Analysis**: Patterns and extent of missing data

*Note: Configure GEMINI_API_KEY for AI-powered insights.*`
}
