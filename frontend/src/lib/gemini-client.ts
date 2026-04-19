/**
 * Gemini AI Client for DataLens
 * Provides AI-powered insights and recommendations for EDA
 * SECURE: Uses Supabase Edge Functions to keep API keys server-side
 */

import type { AnalysisResult } from './data-processor'
import {
  getAIInsights,
  getDataQualityFlags,
  getMLRecommendations,
  getTransformationSuggestions,
  checkEdgeFunctionsAvailable
} from './supabase-edge-functions'

export interface TransformationSuggestion {
  column: string
  transformation: string
  reason: string
  code?: string
}

export interface DataQualityFlag {
  severity: 'low' | 'medium' | 'high' | 'critical'
  category: 'missing_values' | 'outliers' | 'inconsistency' | 'correlation' | 'distribution'
  message: string
  recommendation: string
}

export interface MLRecommendation {
  model: string
  problemType: 'classification' | 'regression' | 'clustering' | 'dimensionality_reduction'
  rationale: string
  preprocessing: string[]
  expectedPerformance: string
  considerations: string[]
}

export interface PatternInsight {
  pattern: string
  description: string
  confidence: number
  implications: string[]
}

/**
 * Generate comprehensive narrative insights using Gemini AI (via Edge Functions)
 */
export async function generateNarrativeInsights(
  analysisResult: AnalysisResult,
  datasetName: string
): Promise<string> {
  try {
    // Check if Edge Functions are available first
    const edgeFunctionsAvailable = await checkEdgeFunctionsAvailable()

    if (edgeFunctionsAvailable) {
      return await getAIInsights(analysisResult, datasetName)
    } else {
      // Fall back to rule-based insights
      console.log('Edge functions not available, using fallback insights')
      return generateFallbackNarrative(analysisResult)
    }
  } catch (error) {
    console.warn('AI insights generation error, using fallback:', error)
    return generateFallbackNarrative(analysisResult)
  }
}

/**
 * Generate transformation suggestions using Gemini AI (via Edge Functions)
 */
export async function suggestTransformations(
  columnName: string,
  stats: any,
  _analysisResult?: AnalysisResult
): Promise<TransformationSuggestion[]> {
  try {
    // Check if Edge Functions are available first
    const edgeFunctionsAvailable = await checkEdgeFunctionsAvailable()

    if (edgeFunctionsAvailable) {
      return await getTransformationSuggestions(columnName, stats)
    } else {
      // Fall back to rule-based transformations
      console.log('Edge functions not available, using fallback transformation suggestions')
      return generateFallbackTransformations(columnName, stats)
    }
  } catch (error) {
    console.warn('Transformation suggestion error, using fallback:', error)
    return generateFallbackTransformations(columnName, stats)
  }
}

/**
 * Detect data quality issues using Gemini AI (via Edge Functions)
 */
export async function detectDataQualityIssues(
  analysisResult: AnalysisResult
): Promise<DataQualityFlag[]> {
  try {
    // Check if Edge Functions are available first
    const edgeFunctionsAvailable = await checkEdgeFunctionsAvailable()

    if (edgeFunctionsAvailable) {
      return await getDataQualityFlags(analysisResult)
    } else {
      // Fall back to rule-based quality detection
      console.log('Edge functions not available, using fallback quality detection')
      return generateFallbackQualityFlags(analysisResult)
    }
  } catch (error) {
    console.warn('Quality assessment error, using fallback:', error)
    return generateFallbackQualityFlags(analysisResult)
  }
}

/**
 * Recommend ML models using Gemini AI (via Edge Functions)
 */
export async function recommendMLModels(
  analysisResult: AnalysisResult,
  targetVariable?: string
): Promise<MLRecommendation[]> {
  try {
    // Check if Edge Functions are available first
    const edgeFunctionsAvailable = await checkEdgeFunctionsAvailable()

    if (edgeFunctionsAvailable) {
      return await getMLRecommendations(analysisResult, targetVariable)
    } else {
      // Fall back to rule-based recommendations
      console.log('Edge functions not available, using fallback ML recommendations')
      return generateFallbackRecommendations(analysisResult, targetVariable)
    }
  } catch (error) {
    console.warn('ML recommendation error, using fallback:', error)
    return generateFallbackRecommendations(analysisResult, targetVariable)
  }
}

/**
 * Generate pattern insights from correlations
 */
export function detectPatterns(analysisResult: AnalysisResult): PatternInsight[] {
  const patterns: PatternInsight[] = []

  // Detect strong correlations
  const strongCorrelations = analysisResult.correlations.filter(c => Math.abs(c.correlation) > 0.7)
  if (strongCorrelations.length > 5) {
    patterns.push({
      pattern: 'Highly Correlated Features',
      description: `Found ${strongCorrelations.length} strong correlations between variables`,
      confidence: 0.9,
      implications: [
        'Consider feature selection to reduce dimensionality',
        'Monitor for multicollinearity in linear models',
        'Some features may be redundant'
      ]
    })
  }

  // Detect data quality issues
  const totalMissing = Object.values(analysisResult.summary.missingValues).reduce((a, b) => a + b, 0)
  const missingPercent = (totalMissing / (analysisResult.summary.totalRows * analysisResult.summary.totalColumns)) * 100

  if (missingPercent > 20) {
    patterns.push({
      pattern: 'Significant Missing Data',
      description: `${missingPercent.toFixed(1)}% of data is missing`,
      confidence: 1.0,
      implications: [
        'Imputation or removal strategies needed',
        'May impact model performance',
        'Consider missing data mechanisms'
      ]
    })
  }

  // Detect numerical vs categorical balance
  const numericalCount = Object.keys(analysisResult.statistics.numerical).length
  const categoricalCount = Object.keys(analysisResult.statistics.categorical).length

  if (numericalCount > categoricalCount * 3) {
    patterns.push({
      pattern: 'Numerical Feature Dominance',
      description: `Dataset has ${numericalCount} numerical vs ${categoricalCount} categorical features`,
      confidence: 0.8,
      implications: [
        'Well-suited for regression and neural networks',
        'Consider dimensionality reduction (PCA)',
        'Feature scaling will be important'
      ]
    })
  }

  return patterns
}

// Helper functions for fallback when Gemini API is unavailable

function generateFallbackNarrative(analysisResult: AnalysisResult): string {
  const insights = []

  insights.push(`This dataset contains ${analysisResult.summary.totalRows.toLocaleString()} rows and ${analysisResult.summary.totalColumns} columns, with a mix of numerical and categorical features.`)

  const totalMissing = Object.values(analysisResult.summary.missingValues).reduce((a, b) => a + b, 0)
  const missingPercent = (totalMissing / (analysisResult.summary.totalRows * analysisResult.summary.totalColumns)) * 100

  if (missingPercent > 20) {
    insights.push(`Data quality concerns exist with ${missingPercent.toFixed(1)}% missing values that should be addressed.`)
  } else if (missingPercent > 0) {
    insights.push(`Data quality is good with only ${missingPercent.toFixed(1)}% missing values.`)
  }

  const strongCorrelations = analysisResult.correlations.filter(c => Math.abs(c.correlation) > 0.7)
  if (strongCorrelations.length > 0) {
    insights.push(`Found ${strongCorrelations.length} strong correlations between variables that warrant further investigation.`)
  }

  return insights.join(' ')
}

function generateFallbackTransformations(columnName: string, stats: any): TransformationSuggestion[] {
  const suggestions: TransformationSuggestion[] = []

  // Check for potential skewness (if range is much larger than std)
  if (stats.std && stats.mean && (stats.max - stats.min) > 10 * stats.std) {
    suggestions.push({
      column: columnName,
      transformation: 'Log Transformation',
      reason: 'Reduces right-skew and compresses large values',
      code: `Math.log(${columnName} + 1)`
    })
  }

  // Check for different scales
  if (stats.std && stats.mean && stats.std / stats.mean > 0.5) {
    suggestions.push({
      column: columnName,
      transformation: 'Standardization (Z-score)',
      reason: 'Scales data to have mean=0, std=1 for better model convergence',
      code: `(${columnName} - ${stats.mean.toFixed(2)}) / ${stats.std.toFixed(2)}`
    })
  }

  return suggestions
}

function generateFallbackRecommendations(analysisResult: AnalysisResult, targetVariable?: string): MLRecommendation[] {
  const recommendations: MLRecommendation[] = []

  if (targetVariable) {
    const targetType = analysisResult.summary.columnTypes[targetVariable]

    if (targetType === 'numerical') {
      // Regression recommendations
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
      // Classification recommendations
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

function generateFallbackQualityFlags(analysisResult: AnalysisResult): DataQualityFlag[] {
  const issues: DataQualityFlag[] = []
  const totalRows = analysisResult.summary.totalRows

  // Check for high missing values
  Object.entries(analysisResult.summary.missingValues).forEach(([col, missing]) => {
    const missingPercent = (missing / totalRows) * 100

    if (missingPercent > 30) {
      issues.push({
        severity: 'critical',
        category: 'missing_values',
        message: `"${col}" has ${missingPercent.toFixed(1)}% missing values`,
        recommendation: `Consider imputation (median/mode) or removing this column`
      })
    } else if (missingPercent > 15) {
      issues.push({
        severity: 'high',
        category: 'missing_values',
        message: `"${col}" has ${missingPercent.toFixed(1)}% missing values`,
        recommendation: `Apply imputation strategies or remove affected rows`
      })
    } else if (missingPercent > 5) {
      issues.push({
        severity: 'medium',
        category: 'missing_values',
        message: `"${col}" has ${missingPercent.toFixed(1)}% missing values`,
        recommendation: `Monitor impact on analysis, consider imputation`
      })
    }
  })

  // Check for high correlations
  const highCorrelations = analysisResult.correlations.filter(c => Math.abs(c.correlation) > 0.95)
  highCorrelations.forEach(corr => {
    issues.push({
      severity: 'high',
      category: 'correlation',
      message: `Very high correlation (${corr.correlation.toFixed(3)}) between "${corr.col1}" and "${corr.col2}"`,
      recommendation: `Consider removing one variable to avoid multicollinearity`
    })
  })

  const veryHighCorrelations = analysisResult.correlations.filter(c => Math.abs(c.correlation) > 0.85)
  veryHighCorrelations.forEach(corr => {
    // Skip if already added as high correlation
    if (Math.abs(corr.correlation) <= 0.95) {
      issues.push({
        severity: 'medium',
        category: 'correlation',
        message: `High correlation (${corr.correlation.toFixed(3)}) between "${corr.col1}" and "${corr.col2}"`,
        recommendation: `Monitor for multicollinearity in models`
      })
    }
  })

  // Check for extreme outliers in numerical data
  Object.entries(analysisResult.statistics.numerical).forEach(([col, stats]) => {
    if (stats.quartiles && stats.outliers) {
      const iqr = stats.quartiles[2] - stats.quartiles[0]
      const outlierThreshold = stats.quartiles[2] + (3 * iqr)

      if (stats.max > outlierThreshold) {
        issues.push({
          severity: 'medium',
          category: 'outliers',
          message: `"${col}" contains potential outliers (max: ${stats.max})`,
          recommendation: `Consider capping or transforming extreme values`
        })
      }
    }
  })

  return issues
}