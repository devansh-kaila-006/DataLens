/**
 * Gemini AI Client for DataLens
 * Provides AI-powered insights and recommendations for EDA
 */

import { GoogleGenerativeAI } from '@google/generative-ai'
import type { AnalysisResult } from './data-processor'

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY || '')
const model = genAI.getGenerativeModel({ model: 'gemini-pro' })

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
 * Generate comprehensive narrative insights using Gemini AI
 */
export async function generateNarrativeInsights(
  analysisResult: AnalysisResult,
  datasetName: string
): Promise<string> {
  try {
    const prompt = `You are an expert data scientist analyzing a dataset called "${datasetName}".

Based on the following statistical analysis, provide a 2-paragraph executive summary:

Dataset Overview:
- Total Rows: ${analysisResult.summary.totalRows.toLocaleString()}
- Total Columns: ${analysisResult.summary.totalColumns}
- Numerical Columns: ${Object.keys(analysisResult.statistics.numerical).length}
- Categorical Columns: ${Object.keys(analysisResult.statistics.categorical).length}

Key Statistics:
${Object.entries(analysisResult.statistics.numerical).slice(0, 5).map(([col, stats]) =>
  `- ${col}: mean=${stats.mean.toFixed(2)}, std=${stats.std.toFixed(2)}, range=[${stats.min}, ${stats.max}]`
).join('\n')}

Correlations:
${analysisResult.correlations.slice(0, 5).map(c =>
  `- ${c.col1} vs ${c.col2}: ${c.correlation.toFixed(3)}`
).join('\n')}

Data Quality:
- Missing Values: ${Object.values(analysisResult.summary.missingValues).reduce((a, b) => a + b, 0)}
- Missing Percentage: ${((Object.values(analysisResult.summary.missingValues).reduce((a, b) => a + b, 0) / (analysisResult.summary.totalRows * analysisResult.summary.totalColumns)) * 100).toFixed(1)}%

Provide:
1. A concise overview of the dataset's characteristics and key patterns
2. Critical data quality observations and their potential impact
3. Brief mention of the most interesting relationships found

Keep it professional, actionable, and under 200 words total.`

    const result = await model.generateContent(prompt)
    const response = await result.response
    return response.text()
  } catch (error) {
    console.warn('Gemini API error, using fallback:', error)
    return generateFallbackNarrative(analysisResult)
  }
}

/**
 * Generate transformation suggestions using Gemini AI
 */
export async function suggestTransformations(
  columnName: string,
  stats: any,
  analysisResult: AnalysisResult
): Promise<TransformationSuggestion[]> {
  try {
    const prompt = `As a data scientist, recommend data transformations for column "${columnName}" with these statistics:

- Mean: ${stats.mean?.toFixed(2) || 'N/A'}
- Median: ${stats.median?.toFixed(2) || 'N/A'}
- Std Dev: ${stats.std?.toFixed(2) || 'N/A'}
- Min: ${stats.min || 'N/A'}
- Max: ${stats.max || 'N/A'}
- Missing Values: ${analysisResult.summary.missingValues[columnName] || 0}

Recommend specific transformations to improve normality and ML model performance.
Provide 2-3 suggestions in JSON format:
{
  "transformations": [
    {
      "transformation": "log transform",
      "reason": "reduces right skew",
      "code": "np.log(column)"
    }
  ]
}

Focus on practical, commonly-used transformations.`

    const result = await model.generateContent(prompt)
    const response = await result.response

    // Try to parse JSON response
    try {
      const parsed = JSON.parse(response.text())
      return parsed.transformations || []
    } catch {
      // If JSON parsing fails, extract suggestions textually
      return parseTextualSuggestions(response.text(), columnName)
    }
  } catch (error) {
    console.warn('Gemini transformation suggestion error:', error)
    return generateFallbackTransformations(columnName, stats)
  }
}

/**
 * Detect data quality issues using Gemini AI
 */
export async function detectDataQualityIssues(
  analysisResult: AnalysisResult
): Promise<DataQualityFlag[]> {
  try {
    const issues: DataQualityFlag[] = []

    // Check for high missing values
    Object.entries(analysisResult.summary.missingValues).forEach(([col, missing]) => {
      const missingPercent = (missing / analysisResult.summary.totalRows) * 100
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
    analysisResult.correlations.forEach(corr => {
      if (Math.abs(corr.correlation) > 0.95) {
        issues.push({
          severity: 'high',
          category: 'correlation',
          message: `Very high correlation (${corr.correlation.toFixed(3)}) between "${corr.col1}" and "${corr.col2}"`,
          recommendation: `Consider removing one variable to avoid multicollinearity`
        })
      } else if (Math.abs(corr.correlation) > 0.85) {
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
    })

    return issues
  } catch (error) {
    console.warn('Data quality detection error:', error)
    return []
  }
}

/**
 * Recommend ML models using Gemini AI
 */
export async function recommendMLModels(
  analysisResult: AnalysisResult,
  targetVariable?: string
): Promise<MLRecommendation[]> {
  try {
    const numericalCols = Object.keys(analysisResult.statistics.numerical)
    const categoricalCols = Object.keys(analysisResult.statistics.categorical)
    const totalCols = analysisResult.summary.totalColumns
    const totalRows = analysisResult.summary.totalRows

    let problemType = 'unknown'
    if (targetVariable) {
      if (analysisResult.summary.columnTypes[targetVariable] === 'numerical') {
        problemType = 'regression'
      } else {
        problemType = 'classification'
      }
    }

    const prompt = `As an ML expert, recommend the top 3 models for this dataset:

Dataset Characteristics:
- Rows: ${totalRows.toLocaleString()}
- Columns: ${totalCols} (${numericalCols.length} numerical, ${categoricalCols.length} categorical)
- Problem Type: ${problemType || 'unsupervised'}
- Target Variable: ${targetVariable || 'None (unsupervised)'}

Data Quality:
- Missing Values: ${((Object.values(analysisResult.summary.missingValues).reduce((a, b) => a + b, 0) / (totalRows * totalCols)) * 100).toFixed(1)}%
- Strong Correlations: ${analysisResult.correlations.filter(c => Math.abs(c.correlation) > 0.7).length}

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

    // Try to parse structured response
    try {
      const parsed = JSON.parse(response.text())
      return parsed.recommendations || []
    } catch {
      // Parse textual response
      return parseTextualRecommendations(response.text())
    }
  } catch (error) {
    console.warn('ML recommendation error:', error)
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

function parseTextualSuggestions(text: string, columnName: string): TransformationSuggestion[] {
  const suggestions: TransformationSuggestion[] = []
  const lines = text.split('\n').filter(line => line.trim())

  lines.forEach(line => {
    if (line.toLowerCase().includes('log') || line.toLowerCase().includes('transform')) {
      suggestions.push({
        column: columnName,
        transformation: 'Log Transformation',
        reason: 'Based on AI analysis',
        code: `Math.log(${columnName} + 1)`
      })
    }
  })

  return suggestions
}

function parseTextualRecommendations(text: string): MLRecommendation[] {
  const recommendations: MLRecommendation[] = []

  // Simple text parsing for common model names
  if (text.toLowerCase().includes('random forest') || text.toLowerCase().includes('forest')) {
    recommendations.push({
      model: 'Random Forest',
      problemType: 'classification',
      rationale: 'Robust to outliers and non-linear relationships',
      preprocessing: ['Handle missing values', 'Encode categorical variables'],
      expectedPerformance: 'Good baseline model, interpretable feature importance',
      considerations: ['May overfit with many features', 'Requires tuning of hyperparameters']
    })
  }

  if (text.toLowerCase().includes('linear regression') || text.toLowerCase().includes('regression')) {
    recommendations.push({
      model: 'Linear Regression',
      problemType: 'regression',
      rationale: 'Simple, interpretable baseline for regression problems',
      preprocessing: ['Handle missing values', 'Scale numerical features', 'Encode categoricals'],
      expectedPerformance: 'Good for linear relationships, may underfit complex patterns',
      considerations: ['Assumes linearity', 'Sensitive to outliers', 'Requires feature scaling']
    })
  }

  if (text.toLowerCase().includes('gradient boosting') || text.toLowerCase().includes('xgboost')) {
    recommendations.push({
      model: 'Gradient Boosting (XGBoost)',
      problemType: 'classification',
      rationale: 'State-of-the-art performance for tabular data',
      preprocessing: ['Handle missing values', 'Encode categorical variables'],
      expectedPerformance: 'Excellent performance with proper tuning',
      considerations: ['Requires careful tuning', 'Can overfit on small datasets', 'Longer training time']
    })
  }

  return recommendations
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