/**
 * Supabase Edge Function: Gemini ML Recommendations
 * Provides ML model recommendations based on dataset characteristics
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { GoogleGenerativeAI } from 'npm:@google/generative-ai@0.21.0'

const genAI = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!)
const model = genAI.getGenerativeModel({
  model: Deno.env.get('GEMINI_MODEL') || 'gemini-2.5-pro'
})

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      }
    })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { analysisResult, targetVariable } = await req.json()

    if (!analysisResult) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Missing analysisResult parameter'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    const numericalCols = Object.keys(analysisResult.statistics?.numerical || {})
    const categoricalCols = Object.keys(analysisResult.statistics?.categorical || {})
    const totalCols = analysisResult.summary?.totalColumns || 0
    const totalRows = analysisResult.summary?.totalRows || 0

    let problemType = 'unknown'
    if (targetVariable) {
      if (analysisResult.summary?.columnTypes?.[targetVariable] === 'numerical') {
        problemType = 'regression'
      } else {
        problemType = 'classification'
      }
    }

    // Construct prompt for Gemini
    const prompt = `As an ML expert, recommend the top 3 models for this dataset:

Dataset Characteristics:
- Rows: ${totalRows?.toLocaleString() || 'N/A'}
- Columns: ${totalCols} (${numericalCols.length} numerical, ${categoricalCols.length} categorical)
- Problem Type: ${problemType || 'unsupervised'}
- Target Variable: ${targetVariable || 'None (unsupervised)'}

Data Quality:
- Missing Values: ${((Object.values(analysisResult.summary?.missingValues || {}).reduce((a: number, b: number) => a + b, 0) / (totalRows * totalCols)) * 100).toFixed(1)}%
- Strong Correlations: ${(analysisResult.correlations || []).filter((c: any) => Math.abs(c.correlation) > 0.7).length}

Recommend 3 specific ML models with:
1. Model name
2. Problem type it solves
3. Rationale for this dataset
4. Required preprocessing steps
5. Expected performance considerations
6. Important considerations

Format as JSON array if possible, otherwise plain text.`

    const result = await model.generateContent(prompt)
    const response = await result.response

    // Try to parse as JSON first
    let recommendations = []

    try {
      const parsed = JSON.parse(response.text())
      recommendations = parsed.recommendations || []
    } catch {
      // If JSON parsing fails, generate rule-based recommendations
      recommendations = generateFallbackRecommendations(analysisResult, targetVariable)
    }

    return new Response(JSON.stringify({
      success: true,
      recommendations,
      datasetCharacteristics: {
        rows: totalRows,
        columns: totalCols,
        numericalCols: numericalCols.length,
        categoricalCols: categoricalCols.length,
        problemType
      },
      timestamp: new Date().toISOString()
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })

  } catch (error) {
    console.error('ML recommendations error:', error)

    // Return fallback recommendations
    const fallbackRecs = generateFallbackRecommendations(analysisResult, targetVariable)

    return new Response(JSON.stringify({
      success: true,
      recommendations: fallbackRecs,
      fallback: true,
      timestamp: new Date().toISOString()
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })
  }
})

function generateFallbackRecommendations(analysisResult: any, targetVariable?: string): any[] {
  const recommendations = []
  const numericalCols = Object.keys(analysisResult.statistics?.numerical || {})
  const categoricalCols = Object.keys(analysisResult.statistics?.categorical || {})

  if (targetVariable) {
    const targetType = analysisResult.summary?.columnTypes?.[targetVariable]

    if (targetType === 'numerical') {
      recommendations.push({
        model: 'Random Forest Regressor',
        problemType: 'regression',
        rationale: 'Handles non-linear relationships and mixed data types well',
        preprocessing: ['Handle missing values', 'Encode categorical variables'],
        expectedPerformance: 'Strong baseline with good interpretability',
        considerations: ['May require hyperparameter tuning', 'Feature importance available']
      })

      recommendations.push({
        model: 'Gradient Boosting Regressor',
        problemType: 'regression',
        rationale: 'Excellent performance on tabular regression tasks',
        preprocessing: ['Handle missing values', 'Feature scaling optional'],
        expectedPerformance: 'State-of-the-art with proper tuning',
        considerations: ['Longer training time', 'Requires careful hyperparameter tuning']
      })
    } else {
      recommendations.push({
        model: 'Random Forest Classifier',
        problemType: 'classification',
        rationale: 'Robust performer with built-in feature importance',
        preprocessing: ['Encode categorical variables', 'Handle missing values'],
        expectedPerformance: 'Strong baseline, interpretable',
        considerations: ['May overfit with many trees', 'Memory intensive']
      })

      recommendations.push({
        model: 'Gradient Boosting (XGBoost)',
        problemType: 'classification',
        rationale: 'Top performer for classification on tabular data',
        preprocessing: ['Encode categoricals', 'Handle missing values'],
        expectedPerformance: 'Excellent with proper tuning',
        considerations: ['Requires hyperparameter optimization', 'Training time longer']
      })
    }
  } else {
    // Unsupervised recommendations
    recommendations.push({
      model: 'K-Means Clustering',
      problemType: 'clustering',
      rationale: 'Simple and effective for finding groups in data',
      preprocessing: ['Feature scaling', 'Handle categorical variables'],
      expectedPerformance: 'Good baseline, requires determining optimal k',
      considerations: ['Assumes spherical clusters', 'Sensitive to outliers', 'Requires feature scaling']
    })
  }

  return recommendations
}
