import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.0'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info, x-supabase-auth'
      }
    })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const requestBody = await req.json()
    console.log('Received request body:', JSON.stringify(requestBody))

    const { file_name, file_size, file_path, user_id } = requestBody

    console.log('Parsed values:', {
      file_name,
      file_size,
      file_path,
      user_id,
      fileNameType: typeof file_name,
      filePathType: typeof file_path
    })

    // Validate required fields
    if (!file_name || !file_path) {
      console.error('Missing required fields:', { file_name, file_path })
      return new Response(JSON.stringify({
        error: 'Missing required fields',
        received: { file_name, file_path, file_size, user_id }
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info, x-supabase-auth'
        }
      })
    }

    // Create Supabase client with service role key (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Insert job with service role privileges using correct schema
    const { data, error } = await supabase
      .from('analysis_jobs')
      .insert({
        user_id: user_id || null,
        file_name,
        file_size: file_size || 0,
        file_path,
        status: 'pending',
        upload_timestamp: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating job:', error)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info, x-supabase-auth'
        }
      })
    }

    return new Response(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info, x-supabase-auth'
      }
    })
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info, x-supabase-auth'
      }
    })
  }
})