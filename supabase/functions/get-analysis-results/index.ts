/**
 * Get Analysis Results Edge Function
 * Fetches results from the analysis_results table
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
}

serve(async (req) => {
  // Handle CORS preflight
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
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing environment variables')
    }

    const { job_id } = await req.json()

    if (!job_id) {
      return new Response(
        JSON.stringify({ error: 'job_id is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Fetching results for job:', job_id)

    // Fetch all results for this job from analysis_results table
    const { data: results, error } = await supabase
      .from('analysis_results')
      .select('*')
      .eq('job_id', job_id)

    if (error) {
      console.error('Error fetching results:', error)
      throw new Error(`Failed to fetch results: ${error.message}`)
    }

    // Compile results into a dictionary
    const compiledResults: Record<string, any> = {}

    for (const result of results || []) {
      const resultType = result.result_type
      const resultData = result.result_data

      // Special handling for ai_insights
      if (resultType === 'ai_insights') {
        // Return as object with narrative property for frontend
        compiledResults.ai_insights = {
          narrative: resultData?.narrative || resultData?.insights || resultData || null,
          is_fallback: resultData?.is_fallback || false
        }
      } else {
        compiledResults[resultType] = resultData
      }
    }

    console.log('Results compiled:', {
      totalResults: results?.length || 0,
      types: Object.keys(compiledResults),
      hasAIInsights: !!compiledResults.ai_insights
    })

    return new Response(
      JSON.stringify(compiledResults),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error fetching results:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
