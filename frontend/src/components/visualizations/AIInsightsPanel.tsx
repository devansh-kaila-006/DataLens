/**
 * v2 AI Insights Panel Component - Light theme, clean design
 * Compact, interactive display of AI-powered insights with progressive disclosure
 */

import { useState } from 'react'
import { AlertTriangleIcon, ZapIcon } from '../ui/Icon'

interface ConfidenceMetrics {
  overall_confidence: number
  data_quality_score: number
  completeness: number
}

interface InsightMetadata {
  model_used: string
  detail_level: string
  domain: string
  generation_time_ms: number
  is_fallback: boolean
}

interface AIInsights {
  // New structured format (from backend)
  executive_summary?: string
  key_findings?: string[]
  recommendations?: string[]
  confidence_metrics?: ConfidenceMetrics
  metadata?: InsightMetadata

  // Legacy format (for backward compatibility)
  narrative?: string
  quality_recommendations?: string[]
  column_insights?: Record<string, string>
}

interface AIInsightsPanelProps {
  insights: AIInsights
}

interface SectionConfig {
  id: keyof AIInsights
  title: string
  icon: React.ReactNode
  defaultExpanded: boolean
}

// Custom SVG icons (replacing emoji)
const DocumentIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
)

const SearchIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
)

const LightbulbIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
)

// Chevron icons as simple SVG components
const ChevronDownIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 9l6 6 6-6" />
  </svg>
)

const ChevronRightIcon = ({ className }: { className?: string }) => (
  <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7" />
  </svg>
)

export default function AIInsightsPanel({ insights }: AIInsightsPanelProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    summary: true,
    findings: false,
    recommendations: false
  })

  // Transform legacy format to new format for backward compatibility
  const normalizedInsights: AIInsights = {
    executive_summary: insights.executive_summary || insights.narrative || '',
    key_findings: insights.key_findings,
    recommendations: insights.recommendations || insights.quality_recommendations,
    confidence_metrics: insights.confidence_metrics,
    metadata: insights.metadata || {
      model_used: 'gemini-flash-lite-latest',
      detail_level: 'standard',
      domain: 'general',
      generation_time_ms: 0,
      is_fallback: false
    }
  }

  const sections: SectionConfig[] = [
    {
      id: 'executive_summary' as keyof AIInsights,
      title: 'Executive Summary',
      icon: <DocumentIcon className="w-4 h-4 text-indigo-600" />,
      defaultExpanded: true
    },
    {
      id: 'key_findings' as keyof AIInsights,
      title: 'Key Findings',
      icon: <SearchIcon className="w-4 h-4 text-indigo-600" />,
      defaultExpanded: false
    },
    {
      id: 'recommendations' as keyof AIInsights,
      title: 'Recommendations',
      icon: <LightbulbIcon className="w-4 h-4 text-indigo-600" />,
      defaultExpanded: false
    }
  ]

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId]
    }))
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-indigo-600'
    if (confidence >= 60) return 'text-warning-600'
    return 'text-error-600'
  }

  const getModelBadgeColor = (model: string) => {
    if (model.includes('pro')) return 'bg-indigo-50 text-indigo-700 border-indigo-100'
    if (model.includes('flash')) return 'bg-info-50 text-info-700 border-info-200'
    return 'bg-gray-100 text-gray-700 border-gray-200'
  }

  const getModelLabel = (model: string) => {
    if (model.includes('pro')) return 'Gemini Pro'
    if (model.includes('flash-lite')) return 'Flash Lite'
    if (model.includes('flash')) return 'Flash'
    return 'AI Model'
  }

  return (
    <div className="card overflow-hidden shadow-sm">
      {/* Header with confidence and model badges */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ZapIcon className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-semibold text-gray-900">AI-Powered Insights</h3>
          </div>

          <div className="flex items-center gap-2">
            {/* Model Badge */}
            {normalizedInsights.metadata && (
              <span className={`px-2 py-1 rounded-md text-xs font-medium border ${getModelBadgeColor(normalizedInsights.metadata.model_used)}`}>
                {getModelLabel(normalizedInsights.metadata.model_used)}
              </span>
            )}

            {/* Fallback Badge */}
            {normalizedInsights.metadata?.is_fallback && (
              <span className="px-2 py-1 rounded-md text-xs font-medium bg-warning-50 text-warning-700 border border-warning-200 flex items-center gap-1">
                <AlertTriangleIcon className="w-3 h-3" />
                Rule-Based
              </span>
            )}
          </div>
        </div>

        {/* Confidence Score */}
        {normalizedInsights.confidence_metrics && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Confidence:</span>
            <span className={`text-sm font-semibold ${getConfidenceColor(normalizedInsights.confidence_metrics.overall_confidence)}`}>
              {normalizedInsights.confidence_metrics.overall_confidence.toFixed(0)}%
            </span>
          </div>
        )}
      </div>

      {/* Collapsible Content */}
      <div className="p-4 space-y-2">
        {sections.map((section) => {
          const content = normalizedInsights[section.id]
          const hasContent = content && (
            typeof content === 'string' ? content.trim() : Array.isArray(content) && content.length > 0
          )

          if (!hasContent) return null

          const isExpanded = expandedSections[section.id]

          return (
            <div key={section.id} className="border border-gray-200 rounded-md overflow-hidden">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center gap-2">
                  {section.icon}
                  <span className="text-sm font-medium text-gray-700">{section.title}</span>
                  {Array.isArray(content) && (
                    <span className="px-2 py-0.5 rounded text-xs bg-gray-200 text-gray-600">
                      {content.length}
                    </span>
                  )}
                </div>
                {isExpanded ? (
                  <ChevronDownIcon className="w-4 h-4 text-gray-500" />
                ) : (
                  <ChevronRightIcon className="w-4 h-4 text-gray-500" />
                )}
              </button>

              {isExpanded && (
                <div className="p-4 bg-white animate-slide-down">
                  {typeof content === 'string' ? (
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                      {content}
                    </p>
                  ) : Array.isArray(content) ? (
                    <ul className="space-y-2">
                      {content.map((item: string, index: number) => (
                        <li key={index} className="text-sm text-gray-700 flex gap-2">
                          <span className="text-indigo-600 mt-0.5">•</span>
                          <span className="flex-1">{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer with metadata */}
      {normalizedInsights.metadata && (
        <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              {normalizedInsights.metadata.detail_level} detail
              {normalizedInsights.metadata.domain !== 'general' && ` • ${normalizedInsights.metadata.domain}`}
            </span>
            <span>
              {normalizedInsights.metadata.generation_time_ms}ms
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
