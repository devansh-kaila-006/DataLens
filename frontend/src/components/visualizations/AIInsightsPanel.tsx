/**
 * AI Insights Panel Component
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
  icon: string
  defaultExpanded: boolean
}

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
      icon: '📋',
      defaultExpanded: true
    },
    {
      id: 'key_findings' as keyof AIInsights,
      title: 'Key Findings',
      icon: '🔍',
      defaultExpanded: false
    },
    {
      id: 'recommendations' as keyof AIInsights,
      title: 'Recommendations',
      icon: '💡',
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
    if (confidence >= 80) return 'text-emerald-400'
    if (confidence >= 60) return 'text-yellow-400'
    return 'text-rose-400'
  }

  const getModelBadgeColor = (model: string) => {
    if (model.includes('pro')) return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    if (model.includes('flash')) return 'bg-blue-500/20 text-blue-400 border-blue-500/30'
    return 'bg-slate-500/20 text-slate-400 border-slate-500/30'
  }

  const getModelLabel = (model: string) => {
    if (model.includes('pro')) return 'Gemini Pro'
    if (model.includes('flash-lite')) return 'Flash Lite'
    if (model.includes('flash')) return 'Flash'
    return 'AI Model'
  }

  return (
    <div className="card-premium overflow-hidden">
      {/* Header with confidence and model badges */}
      <div className="p-4 border-b border-slate-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ZapIcon className="w-5 h-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">AI-Powered Insights</h3>
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
              <span className="px-2 py-1 rounded-md text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 flex items-center gap-1">
                <AlertTriangleIcon className="w-3 h-3" />
                Rule-Based
              </span>
            )}
          </div>
        </div>

        {/* Confidence Score */}
        {normalizedInsights.confidence_metrics && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">Confidence:</span>
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
            <div key={section.id} className="border border-slate-700 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleSection(section.id)}
                className="w-full px-4 py-3 flex items-center justify-between bg-slate-800/50 hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg">{section.icon}</span>
                  <span className="text-sm font-medium text-slate-200">{section.title}</span>
                  {Array.isArray(content) && (
                    <span className="px-2 py-0.5 rounded text-xs bg-slate-700 text-slate-400">
                      {content.length}
                    </span>
                  )}
                </div>
                {isExpanded ? (
                  <ChevronDownIcon className="w-4 h-4 text-slate-400" />
                ) : (
                  <ChevronRightIcon className="w-4 h-4 text-slate-400" />
                )}
              </button>

              {isExpanded && (
                <div className="p-4 bg-slate-900/30 animate-slide-down">
                  {typeof content === 'string' ? (
                    <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-line">
                      {content}
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {content.map((item, index) => (
                        <li key={index} className="text-sm text-slate-300 flex gap-2">
                          <span className="text-blue-400 mt-0.5">•</span>
                          <span className="flex-1">{item}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Footer with metadata */}
      {normalizedInsights.metadata && (
        <div className="px-4 py-2 bg-slate-800/30 border-t border-slate-700">
          <div className="flex items-center justify-between text-xs text-slate-500">
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
