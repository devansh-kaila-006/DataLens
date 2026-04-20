/**
 * Get Analysis Results Edge Function
 * Retrieves all analysis results for a job
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const { job_id } = await req.json()

    if (!job_id) {
      return new Response(
        JSON.stringify({ error: 'Missing job_id' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get all analysis data for this job
    const { data: profileData, error: profileError } = await supabase
      .from('data_profiles')
      .select('*')
      .eq('job_id', job_id)
      .maybeSingle()

    const { data: statisticsData, error: statisticsError } = await supabase
      .from('statistical_summaries')
      .select('*')
      .eq('job_id', job_id)
      .maybeSingle()

    const { data: mlData, error: mlError } = await supabase
      .from('ml_readiness_assessments')
      .select('*')
      .eq('job_id', job_id)
      .maybeSingle()

    const { data: aiData, error: aiError } = await supabase
      .from('ai_insights')
      .select('*')
      .eq('job_id', job_id)
      .maybeSingle()

    // Combine all results
    const results = {
      profile: profileData,
      statistics: statisticsData,
      ml_readiness: mlData,
      ai_insights: aiData?.insights
    }

    return new Response(
      JSON.stringify(results),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Get analysis results function error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
