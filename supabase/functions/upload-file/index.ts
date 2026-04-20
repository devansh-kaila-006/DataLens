/**
 * Upload File Edge Function - Simplified version
 * Handles secure file uploads to Supabase Storage
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

// CORS headers
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
      console.error('Missing environment variables')
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Parse form data
    const formData = await req.formData()
    const file = formData.get('file') as File
    const userId = formData.get('user_id') as string || 'guest'

    if (!file) {
      console.error('No file provided')
      return new Response(
        JSON.stringify({ error: 'No file provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate file size (50MB max)
    const MAX_FILE_SIZE = 50 * 1024 * 1024
    if (file.size > MAX_FILE_SIZE) {
      console.error('File too large:', file.size)
      return new Response(
        JSON.stringify({ error: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate file type
    const allowedTypes = ['text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
    const allowedExtensions = ['csv', 'xlsx', 'xls']
    const fileExt = file.name.split('.').pop()?.toLowerCase()

    if (!fileExt || !allowedExtensions.includes(fileExt)) {
      console.error('Invalid file type:', fileExt)
      return new Response(
        JSON.stringify({ error: `Invalid file type. Allowed: ${allowedExtensions.join(', ')}` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Sanitize filename
    const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
    const timestamp = Date.now()
    const fileName = `${userId}_${timestamp}_${sanitizedName}`

    console.log('Uploading file:', fileName)

    // Convert file to bytes
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    // Upload to storage bucket 'uploads'
    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(fileName, uint8Array, {
        contentType: file.type || 'text/csv',
        upsert: false
      })

    if (error) {
      console.error('Upload error:', error)
      return new Response(
        JSON.stringify({
          error: 'Failed to upload file',
          details: error.message
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('uploads')
      .getPublicUrl(fileName)

    console.log('Upload successful:', fileName)

    return new Response(
      JSON.stringify({
        success: true,
        path: fileName,
        url: urlData.publicUrl,
        size: file.size,
        type: file.type
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        details: error.message
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
