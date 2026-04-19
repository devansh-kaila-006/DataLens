/**
 * Supabase Edge Functions Client
 * Securely calls Edge Functions instead of direct API calls
 */

import { supabase } from './supabase'

export interface EdgeFunctionResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  details?: string
  [key: string]: any
}

/**
 * Call a Supabase Edge Function securely
 */
export async function callEdgeFunction<T = any>(
  functionName: string,
  requestBody: any
): Promise<EdgeFunctionResponse<T>> {
  try {
    console.log(`Calling Edge Function: ${functionName}`)

    // Get the current session to pass auth token
    const { data: { session } } = await supabase.auth.getSession()

    const { data: responseData, error } = await supabase.functions.invoke(functionName, {
      body: requestBody,
      headers: session ? {
        Authorization: `Bearer ${session.access_token}`
      } : {}
    })

    if (error) {
      console.error(`Edge function ${functionName} error:`, error)
      throw error
    }

    console.log(`Edge function ${functionName} response:`, responseData)

    return responseData as EdgeFunctionResponse<T>
  } catch (error) {
    console.error(`Edge function ${functionName} failed:`, error)
    throw error
  }
}

/**
 * Generate AI insights through Edge Function
 */
export async function getAIInsights(
  analysisResult: any,
  datasetName: string
): Promise<string> {
  try {
    const response = await callEdgeFunction<{ insights: string }>('gemini-insights', {
      analysisResult,
      datasetName,
      userId: (await supabase.auth.getUser()).data.user?.id
    })

    if (response.success && response.insights) {
      return response.insights
    } else {
      throw new Error(response.error || 'Failed to generate insights')
    }
  } catch (error) {
    console.warn('Edge function insights error, using fallback:', error)
    // Will be handled by fallback in gemini-client.ts
    throw error
  }
}

/**
 * Get data quality assessment through Edge Function
 */
export async function getDataQualityFlags(
  analysisResult: any
): Promise<any[]> {
  try {
    const response = await callEdgeFunction<{ issues: any[] }>('gemini-quality', {
      analysisResult,
      userId: (await supabase.auth.getUser()).data.user?.id
    })

    if (response.success && response.issues) {
      return response.issues
    } else {
      throw new Error(response.error || 'Failed to assess quality')
    }
  } catch (error) {
    console.warn('Edge function quality error, using fallback:', error)
    // Will be handled by fallback in gemini-client.ts
    throw error
  }
}

/**
 * Get ML recommendations through Edge Function
 */
export async function getMLRecommendations(
  analysisResult: any,
  targetVariable?: string
): Promise<any[]> {
  try {
    const response = await callEdgeFunction<{ recommendations: any[] }>('gemini-recommendations', {
      analysisResult,
      targetVariable,
      userId: (await supabase.auth.getUser()).data.user?.id
    })

    if (response.success && response.recommendations) {
      return response.recommendations
    } else {
      throw new Error(response.error || 'Failed to get recommendations')
    }
  } catch (error) {
    console.warn('Edge function recommendations error, using fallback:', error)
    // Will be handled by fallback in gemini-client.ts
    throw error
  }
}

/**
 * Get transformation suggestions through Edge Function
 */
export async function getTransformationSuggestions(
  columnName: string,
  stats: any
): Promise<any[]> {
  try {
    const response = await callEdgeFunction<{ suggestions: any[] }>('gemini-transformations', {
      columnName,
      stats,
      userId: (await supabase.auth.getUser()).data.user?.id
    })

    if (response.success && response.suggestions) {
      return response.suggestions
    } else {
      throw new Error(response.error || 'Failed to get suggestions')
    }
  } catch (error) {
    console.warn('Edge function transformations error, using fallback:', error)
    // Will be handled by fallback in gemini-client.ts
    throw error
  }
}

/**
 * Check if Edge Functions are available
 */
export async function checkEdgeFunctionsAvailable(): Promise<boolean> {
  try {
    await callEdgeFunction('gemini-insights', {
      analysisResult: { summary: { totalRows: 1, totalColumns: 1 } },
      datasetName: 'test'
    })

    // If we get any response (success or error), functions are available
    return true
  } catch (error) {
    console.warn('Edge functions not available:', error)
    return false
  }
}