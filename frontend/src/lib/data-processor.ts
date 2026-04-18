/**
 * Data Processing & EDA Utilities
 * Real exploratory data analysis functionality
 */

import { supabase } from './supabase'

export interface DataRow {
  [key: string]: string | number | boolean | null
}

export interface AnalysisResult {
  summary: {
    totalRows: number
    totalColumns: number
    columnNames: string[]
    columnTypes: Record<string, string>
    missingValues: Record<string, number>
  }
  statistics: {
    numerical: Record<string, {
      mean: number
      median: number
      std: number
      min: number
      max: number
      quartiles: [number, number, number]
    }>
    categorical: Record<string, {
      unique: number
      mostCommon: string
      counts: Record<string, number>
    }>
  }
  correlations: Array<{
    col1: string
    col2: string
    correlation: number
  }>
  insights: string[]
}

/**
 * Process CSV data and perform EDA
 * Supports both authenticated (Supabase) and demo (localStorage) modes
 */
export async function processDataset(datasetId: string): Promise<AnalysisResult> {
  try {
    // Check if this is a demo/local dataset
    if (datasetId.startsWith('demo-') || datasetId.startsWith('local-')) {
      return processDemoDataset(datasetId)
    }

    // Fetch dataset from database
    const { data: dataset, error } = await supabase
      .from('datasets')
      .select('*')
      .eq('id', datasetId)
      .single()

    if (error || !dataset) {
      throw new Error('Dataset not found')
    }

    // Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('datasets')
      .download(dataset.storage_path)

    if (downloadError || !fileData) {
      throw new Error('Failed to download dataset')
    }

    // Parse CSV data
    const csvText = await fileData.text()
    const data = parseCSV(csvText)

    // Perform EDA
    const analysisResult = performEDA(data)

    return analysisResult

  } catch (error) {
    console.error('Error processing dataset:', error)
    throw error
  }
}

/**
 * Process demo dataset from localStorage
 */
export async function processDemoDataset(datasetId: string): Promise<AnalysisResult> {
  try {
    console.log('Processing demo dataset:', datasetId)

    // Get file content from localStorage
    const csvContent = localStorage.getItem(`demo-file-${datasetId}`)
    if (!csvContent) {
      console.error('Demo file not found in localStorage')
      throw new Error('Demo file not found')
    }

    console.log('CSV content length:', csvContent.length)

    // Parse CSV data
    const data = parseCSV(csvContent)
    console.log('Parsed data rows:', data.length)

    // Perform EDA
    const analysisResult = performEDA(data)
    console.log('EDA completed')

    return analysisResult

  } catch (error) {
    console.error('Error processing demo dataset:', error)
    throw error
  }
}

/**
 * Parse CSV text into data array
 * Enhanced to handle quoted values and better error handling
 */
function parseCSV(csvText: string): DataRow[] {
  // Normalize line endings and remove empty lines
  const lines = csvText
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .trim()
    .split('\n')
    .filter(line => line.trim().length > 0)

  if (lines.length < 2) {
    throw new Error('CSV file must contain at least a header row and one data row')
  }

  // Parse headers (handle quoted values)
  const headers = parseCSVLine(lines[0])

  console.log('Parsed headers:', headers)

  const data: DataRow[] = []

  for (let i = 1; i < lines.length; i++) {
    try {
      const values = parseCSVLine(lines[i])
      const row: DataRow = {}

      headers.forEach((header, index) => {
        const value = values[index]

        // Handle missing values
        if (value === undefined || value === '') {
          row[header] = null
        } else if (value === 'null' || value === 'NA' || value === 'N/A' || value === 'NaN') {
          row[header] = null
        } else if (!isNaN(Number(value))) {
          row[header] = Number(value)
        } else if (value === 'true' || value === 'false') {
          row[header] = value === 'true'
        } else {
          row[header] = value
        }
      })

      data.push(row)
    } catch (error) {
      console.warn(`Skipping invalid row ${i + 1}:`, error)
    }
  }

  console.log('Successfully parsed', data.length, 'rows')
  return data
}

/**
 * Parse a single CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]

    if (char === '"') {
      inQuotes = !inQuotes
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim())
      current = ''
    } else {
      current += char
    }
  }

  // Add the last value
  values.push(current.trim())

  return values
}

/**
 * Perform Exploratory Data Analysis
 */
function performEDA(data: DataRow[]): AnalysisResult {
  if (data.length === 0) {
    throw new Error('No data to analyze')
  }

  const columnNames = Object.keys(data[0])
  const totalRows = data.length
  const totalColumns = columnNames.length

  // Determine column types and missing values
  const columnTypes: Record<string, string> = {}
  const missingValues: Record<string, number> = {}

  columnNames.forEach(col => {
    let nullCount = 0
    let numberCount = 0
    let stringCount = 0
    let booleanCount = 0

    data.forEach(row => {
      const value = row[col]
      if (value === null || value === undefined) {
        nullCount++
      } else if (typeof value === 'number') {
        numberCount++
      } else if (typeof value === 'boolean') {
        booleanCount++
      } else if (typeof value === 'string') {
        stringCount++
      }
    })

    missingValues[col] = nullCount

    // Determine column type
    if (nullCount === totalRows) {
      columnTypes[col] = 'empty'
    } else if (numberCount > stringCount && numberCount > booleanCount) {
      columnTypes[col] = 'numerical'
    } else if (booleanCount > numberCount && booleanCount > stringCount) {
      columnTypes[col] = 'boolean'
    } else {
      columnTypes[col] = 'categorical'
    }
  })

  // Calculate statistics for numerical columns
  const numerical: Record<string, any> = {}
  const categorical: Record<string, any> = {}

  columnNames.forEach(col => {
    if (columnTypes[col] === 'numerical') {
      const values = data.map(row => row[col] as number).filter(v => v !== null)
      if (values.length > 0) {
        values.sort((a, b) => a - b)
        const mean = values.reduce((sum, v) => sum + v, 0) / values.length
        const median = values[Math.floor(values.length / 2)]
        const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length
        const std = Math.sqrt(variance)

        numerical[col] = {
          mean: Math.round(mean * 1000) / 1000,
          median: Math.round(median * 1000) / 1000,
          std: Math.round(std * 1000) / 1000,
          min: Math.min(...values),
          max: Math.max(...values),
          quartiles: [
            values[Math.floor(values.length * 0.25)],
            values[Math.floor(values.length * 0.5)],
            values[Math.floor(values.length * 0.75)]
          ]
        }
      }
    } else if (columnTypes[col] === 'categorical') {
      const values = data.map(row => row[col] as string).filter(v => v !== null)
      const counts: Record<string, number> = {}

      values.forEach(v => {
        counts[v] = (counts[v] || 0) + 1
      })

      const sortedCounts = Object.entries(counts).sort((a, b) => b[1] - a[1])
      const mostCommon = sortedCounts[0]?.[0] || 'N/A'

      categorical[col] = {
        unique: Object.keys(counts).length,
        mostCommon,
        counts
      }
    }
  })

  // Calculate correlations between numerical columns
  const numericalCols = columnNames.filter(col => columnTypes[col] === 'numerical')
  const correlations: any[] = []

  for (let i = 0; i < numericalCols.length; i++) {
    for (let j = i + 1; j < numericalCols.length; j++) {
      const col1 = numericalCols[i]
      const col2 = numericalCols[j]

      const correlation = calculateCorrelation(
        data.map(row => row[col1] as number),
        data.map(row => row[col2] as number)
      )

      if (!isNaN(correlation)) {
        correlations.push({
          col1,
          col2,
          correlation: Math.round(correlation * 1000) / 1000
        })
      }
    }
  }

  // Generate insights
  const insights: string[] = []

  // Data quality insights
  const totalMissing = Object.values(missingValues).reduce((sum, val) => sum + val, 0)
  const missingPercentage = (totalMissing / (totalRows * totalColumns)) * 100

  if (missingPercentage > 20) {
    insights.push(`⚠️ High missing data: ${missingPercentage.toFixed(1)}% of values are missing`)
  } else if (missingPercentage > 0) {
    insights.push(`✅ Good data quality: Only ${missingPercentage.toFixed(1)}% missing values`)
  } else {
    insights.push(`🎉 Perfect data quality: No missing values`)
  }

  // Column insights
  const numericalColCount = numericalCols.length
  const categoricalColCount = totalColumns - numericalColCount

  insights.push(`📊 Dataset has ${numericalColCount} numerical and ${categoricalColCount} categorical columns`)

  // Correlation insights
  const strongCorrelations = correlations.filter(c => Math.abs(c.correlation) > 0.7)
  if (strongCorrelations.length > 0) {
    insights.push(`🔗 Found ${strongCorrelations.length} strong correlations between variables`)
  }

  // Statistics insights
  Object.entries(numerical).forEach(([col, stats]: [string, any]) => {
    if (stats.std > 2 * stats.mean) {
      insights.push(`📈 ${col}: High variance detected (std: ${stats.std.toFixed(2)}, mean: ${stats.mean.toFixed(2)})`)
    }
  })

  return {
    summary: {
      totalRows,
      totalColumns,
      columnNames,
      columnTypes,
      missingValues
    },
    statistics: {
      numerical,
      categorical
    },
    correlations,
    insights
  }
}

/**
 * Calculate Pearson correlation coefficient
 */
function calculateCorrelation(x: number[], y: number[]): number {
  const n = x.length
  if (n !== y.length || n === 0) return NaN

  const meanX = x.reduce((sum, val) => sum + val, 0) / n
  const meanY = y.reduce((sum, val) => sum + val, 0) / n

  let numerator = 0
  let sumXSquared = 0
  let sumYSquared = 0

  for (let i = 0; i < n; i++) {
    const xDiff = x[i] - meanX
    const yDiff = y[i] - meanY
    numerator += xDiff * yDiff
    sumXSquared += xDiff * xDiff
    sumYSquared += yDiff * yDiff
  }

  const denominator = Math.sqrt(sumXSquared * sumYSquared)

  return denominator === 0 ? NaN : numerator / denominator
}

/**
 * Generate export data
 */
export function generateExportData(analysisResult: AnalysisResult, datasetName: string): string {
  const report = {
    title: `DataLens Analysis Report - ${datasetName}`,
    generatedAt: new Date().toISOString(),
    summary: analysisResult.summary,
    statistics: analysisResult.statistics,
    correlations: analysisResult.correlations,
    insights: analysisResult.insights
  }

  return JSON.stringify(report, null, 2)
}

/**
 * Generate CSV export for statistics
 */
export function generateStatsCSV(analysisResult: AnalysisResult): string {
  let csv = 'Metric,Column,Value\n'

  // Numerical statistics
  Object.entries(analysisResult.statistics.numerical).forEach(([col, stats]: [string, any]) => {
    csv += `Mean,${col},${stats.mean}\n`
    csv += `Median,${col},${stats.median}\n`
    csv += `Std Dev,${col},${stats.std}\n`
    csv += `Min,${col},${stats.min}\n`
    csv += `Max,${col},${stats.max}\n`
  })

  return csv
}
