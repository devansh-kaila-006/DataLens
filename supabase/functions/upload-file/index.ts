import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.0'
import { STANDARD_LIMITER, extractClientIp, createRateLimitResponse, createRateLimitHeaders } from '../_shared/rate-limiter.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

/**
 * Security monitoring for file upload endpoint
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
    // Extract client IP for rate limiting and security
    const clientIp = extractClientIp(req);

    // Check rate limit (use standard limiter for file uploads)
    const limitInfo = STANDARD_LIMITER.checkRateLimit(clientIp, 'minute');

    if (!limitInfo.allowed) {
      logSecurityEvent(
        'rate_limit_exceeded',
        { endpoint: 'upload-file', limit: limitInfo.limit },
        'warning',
        clientIp
      );
      return createRateLimitResponse(limitInfo);
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const userId = formData.get('user_id') as string | null
    const path = formData.get('path') as string

    if (!file) {
      logSecurityEvent(
        'file_upload_no_file',
        { user_id: userId },
        'warning',
        clientIp
      );
      return new Response(JSON.stringify({ error: 'No file provided' }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info, x-supabase-auth'
        }
      })
    }

    // Validate file size (max 50MB)
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
    if (file.size > MAX_FILE_SIZE) {
      logSecurityEvent(
        'file_upload_too_large',
        { file_size: file.size, max_size: MAX_FILE_SIZE },
        'warning',
        clientIp
      );
      return new Response(JSON.stringify({
        error: `File size exceeds ${MAX_FILE_SIZE / (1024 * 1024)}MB limit`
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info, x-supabase-auth'
        }
      })
    }

    // Validate file type
    const allowedExtensions = ['csv', 'xlsx', 'xls'];
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    if (!fileExt || !allowedExtensions.includes(fileExt)) {
      logSecurityEvent(
        'file_upload_invalid_type',
        { file_name: file.name, file_extension: fileExt },
        'warning',
        clientIp
      );
      return new Response(JSON.stringify({
        error: `Invalid file type. Allowed types: ${allowedExtensions.join(', ')}`
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info, x-supabase-auth'
        }
      })
    }

    // Validate filename for path traversal attempts
    const dangerousPatterns = ['../', '..\\', '~/', 'etc/passwd', 'windows/system32'];
    const fileNameLower = file.name.toLowerCase();
    if (dangerousPatterns.some(pattern => fileNameLower.includes(pattern))) {
      logSecurityEvent(
        'suspicious_filename',
        { file_name: file.name },
        'critical',
        clientIp
      );
      return new Response(JSON.stringify({
        error: 'Invalid file name. Suspicious characters detected.'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info, x-supabase-auth'
        }
      })
    }

    // Log successful file upload start
    logSecurityEvent(
      'file_upload_start',
      {
        file_name: file.name,
        file_size: file.size,
        file_type: fileExt,
        user_id: userId || 'guest'
      },
      'info',
      clientIp
    );

    // Create Supabase client with service role key (bypasses RLS)
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Generate file path
    const fileExt = file.name.split('.').pop()
    const fileName = userId ? `${userId}/${Date.now()}.${fileExt}` : `guest/${Date.now()}.${fileExt}`

    // Determine proper MIME type
    const mimeTypes: Record<string, string> = {
      'csv': 'text/csv',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'xls': 'application/vnd.ms-excel',
      'json': 'application/json',
      'txt': 'text/plain'
    }

    const contentType = mimeTypes[fileExt] || 'text/csv'

    // Convert file to array buffer and upload
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)

    // Upload file to storage with proper MIME type
    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(fileName, uint8Array, {
        contentType: contentType,
        upsert: false
      })

    if (error) {
      console.error('Storage upload error:', error)
      logSecurityEvent(
        'file_upload_error',
        { error: error.message, file_name: file.name },
        'error',
        clientIp
      );
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info, x-supabase-auth'
        }
      })
    }

    // Log successful upload
    logSecurityEvent(
      'file_upload_success',
      {
        file_name: file.name,
        file_size: file.size,
        path: data.path,
        user_id: userId || 'guest'
      },
      'info',
      clientIp
    );

    return new Response(JSON.stringify({
      path: fileName,
      fullPath: data.path,
      rate_limit: {
        limit: limitInfo.limit,
        remaining: limitInfo.remaining
      }
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info, x-supabase-auth',
        ...Object.fromEntries(createRateLimitHeaders(limitInfo))
      }
    })
  } catch (error) {
    console.error('Error:', error)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info, x-supabase-auth',
        ...Object.fromEntries(createRateLimitHeaders(limitInfo))
      }
    })
  }
})