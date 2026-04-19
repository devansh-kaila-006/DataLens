/**
 * Backend API Integration
 * Handles communication with Railway workers for data processing, AI insights, and report generation
 */

import { supabase } from './supabase'

export interface AnalysisJob {
  id: string
  user_id?: string
  file_name: string
  file_size: number
  file_path: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  error_message?: string
  upload_timestamp: string
  processing_started_at?: string
  processing_completed_at?: string
  row_count?: number
  column_count?: number
}

export interface ProcessingResult {
  success: boolean
  message: string
  job_id: string
}

/**
 * Create a new analysis job in the database using Edge Function
 */
export async function createAnalysisJob(
  fileName: string,
  fileSize: number,
  filePath: string,
  userId?: string
): Promise<AnalysisJob> {
  try {
    const { data, error } = await supabase.functions.invoke('create-job', {
      body: {
        file_name: fileName,
        file_size: fileSize,
        file_path: filePath,
        user_id: userId
      }
    })

    if (error) throw error
    return data as AnalysisJob
  } catch (error) {
    console.error('Error creating analysis job:', error)
    throw error
  }
}

/**
 * Trigger data processing for a job
 */
export async function triggerDataProcessing(jobId: string): Promise<ProcessingResult> {
  try {
    const response = await fetch(`${import.meta.env.VITE_RAILWAY_DATA_PROCESSOR_URL}/process`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        job_id: jobId
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return {
      success: true,
      message: data.message || 'Processing started',
      job_id: jobId
    }
  } catch (error) {
    console.error('Error triggering data processing:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to trigger processing',
      job_id: jobId
    }
  }
}

/**
 * Trigger AI insights generation for a job
 */
export async function triggerAIInsights(jobId: string): Promise<ProcessingResult> {
  try {
    const response = await fetch(`${import.meta.env.VITE_RAILWAY_AI_INSIGHTS_URL}/generate-insights`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        job_id: jobId
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return {
      success: true,
      message: data.message || 'Insight generation started',
      job_id: jobId
    }
  } catch (error) {
    console.error('Error triggering AI insights:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to trigger insights',
      job_id: jobId
    }
  }
}

/**
 * Trigger report generation for a job
 */
export async function triggerReportGeneration(
  jobId: string,
  format: 'pdf' | 'html' | 'json' = 'pdf'
): Promise<ProcessingResult> {
  try {
    const response = await fetch(`${import.meta.env.VITE_RAILWAY_REPORT_GENERATOR_URL}/generate-report`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        job_id: jobId,
        format: format
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return {
      success: true,
      message: data.message || 'Report generation started',
      job_id: jobId
    }
  } catch (error) {
    console.error('Error triggering report generation:', error)
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to trigger report generation',
      job_id: jobId
    }
  }
}

/**
 * Get job status and details
 */
export async function getJobStatus(jobId: string): Promise<AnalysisJob | null> {
  try {
    const { data, error } = await supabase
      .from('analysis_jobs')
      .select('*')
      .eq('id', jobId)
      .single()

    if (error) {
      // Handle demo mode or missing jobs gracefully
      console.log('Job not found (expected for demo mode):', error.message)
      return null
    }
    return data
  } catch (error) {
    console.log('Job status check failed (expected for demo mode):', error)
    return null
  }
}

/**
 * Get all analysis results for a job
 */
export async function getAnalysisResults(jobId: string): Promise<Record<string, any>> {
  try {
    const { data, error } = await supabase
      .from('analysis_results')
      .select('*')
      .eq('job_id', jobId)

    if (error) throw error

    // Compile results into a dictionary
    const results: Record<string, any> = {}
    for (const result of data || []) {
      results[result.result_type] = result.result_data
    }

    return results
  } catch (error) {
    console.error('Error getting analysis results:', error)
    return {}
  }
}

/**
 * Poll job status until completion (or timeout)
 */
export async function pollJobStatus(
  jobId: string,
  maxAttempts: number = 60,
  intervalMs: number = 2000
): Promise<AnalysisJob> {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const job = await getJobStatus(jobId)

    if (!job) {
      throw new Error('Job not found')
    }

    if (job.status === 'completed' || job.status === 'failed') {
      return job
    }

    // Wait before next poll
    await new Promise(resolve => setTimeout(resolve, intervalMs))
  }

  throw new Error('Job processing timeout')
}

/**
 * Complete workflow: Upload → Process → Analyze → Generate Report
 */
export async function completeAnalysisWorkflow(
  file: File,
  userId?: string
): Promise<{ jobId: string; results: Record<string, any> }> {
  try {
    console.log('Starting complete analysis workflow for:', file.name)

    // Step 1: Upload file to Supabase Storage using Edge Function
    console.log('Step 1: Uploading file to storage...')
    console.log('Using Edge Function for secure upload...')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('user_id', userId || '')

    const edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/upload-file`
    console.log('Edge Function URL:', edgeFunctionUrl)

    const uploadResponse = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
      },
      body: formData
    })

    if (!uploadResponse.ok) {
      const error = await uploadResponse.json()
      throw new Error(`File upload failed: ${error.error}`)
    }

    const uploadData = await uploadResponse.json()
    const filePath = uploadData.path
    console.log('File uploaded successfully to:', filePath)

    // Step 2: Create analysis job
    console.log('Step 2: Creating analysis job...')
    console.log('Creating job with:', {
      fileName: file.name,
      fileSize: file.size,
      filePath: filePath,
      userId: userId || 'guest'
    })

    const job = await createAnalysisJob(file.name, file.size, filePath, userId)
    console.log('Job created:', job.id)

    // Step 3: Trigger data processing
    console.log('Step 3: Triggering data processing...')
    const processResult = await triggerDataProcessing(job.id)
    if (!processResult.success) {
      throw new Error(`Data processing failed: ${processResult.message}`)
    }
    console.log('Data processing triggered')

    // Step 4: Wait for processing to complete
    console.log('Step 4: Waiting for processing to complete...')
    const completedJob = await pollJobStatus(job.id, 60, 3000) // 3 minutes max, 3 second intervals

    if (completedJob.status === 'failed') {
      throw new Error(completedJob.error_message || 'Processing failed')
    }

    console.log('Processing completed successfully')

    // Step 5: Trigger AI insights (optional, doesn't block)
    console.log('Step 5: Triggering AI insights...')
    triggerAIInsights(job.id).catch(err => {
      console.warn('AI insights generation failed (non-critical):', err)
    })

    // Step 6: Get all results
    console.log('Step 6: Fetching analysis results...')
    const results = await getAnalysisResults(job.id)

    console.log('Analysis workflow complete!')
    return {
      jobId: job.id,
      results
    }
  } catch (error) {
    console.error('Analysis workflow error:', error)
    throw error
  }
}

/**
 * Subscribe to job status updates in real-time
 */
export function subscribeToJobStatus(
  jobId: string,
  callback: (job: AnalysisJob) => void
): () => void {
  const channel = supabase
    .channel(`job_status_${jobId}`)
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'analysis_jobs',
        filter: `id=eq.${jobId}`
      },
      (payload) => {
        callback(payload.new as AnalysisJob)
      }
    )
    .subscribe()

  // Return unsubscribe function
  return () => {
    supabase.removeChannel(channel)
  }
}