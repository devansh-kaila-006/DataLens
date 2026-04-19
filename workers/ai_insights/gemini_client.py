"""
Gemini AI Client Module
Handles integration with Google Gemini API for generating insights.
"""
import os
import logging
from typing import Dict, Any, List
import google.generativeai as genai
from google.api_core.exceptions import GoogleAPIError

logger = logging.getLogger(__name__)


class GeminiClient:
    """Client for Google Gemini API."""

    def __init__(self):
        """Initialize Gemini client."""
        api_key = os.getenv('GEMINI_API_KEY')
        model_name = os.getenv('GEMINI_MODEL', 'gemini-1.5-flash')

        if not api_key:
            raise ValueError("GEMINI_API_KEY must be set in environment variables")

        genai.configure(api_key=api_key)
        self.model = genai.GenerativeModel(model_name)
        logger.info(f"Gemini client initialized with model: {model_name}")

    def generate_insights(self, analysis_data: Dict[str, Any], dataset_name: str) -> str:
        """
        Generate comprehensive AI insights from analysis results.

        Args:
            analysis_data: Complete analysis results
            dataset_name: Name of the dataset

        Returns:
            Generated insights text

        Raises:
            Exception: If API call fails
        """
        try:
            prompt = self._build_insight_prompt(analysis_data, dataset_name)

            logger.info("Sending request to Gemini API")
            response = self.model.generate_content(prompt)
            insights = response.text

            logger.info("Successfully generated insights")
            return insights

        except GoogleAPIError as e:
            logger.error(f"Gemini API error: {e}")
            raise Exception(f"Gemini API error: {str(e)}")
        except Exception as e:
            logger.error(f"Error generating insights: {e}")
            raise

    def _build_insight_prompt(self, analysis_data: Dict[str, Any], dataset_name: str) -> str:
        """
        Build comprehensive prompt for insight generation.

        Args:
            analysis_data: Analysis results
            dataset_name: Dataset name

        Returns:
            Prompt string
        """
        summary = analysis_data.get('summary', {})
        statistics = analysis_data.get('statistics', {})

        # Handle nested correlations structure
        correlations_data = analysis_data.get('correlations', [])
        if isinstance(correlations_data, dict) and 'correlations' in correlations_data:
            correlations = correlations_data['correlations']
        else:
            correlations = correlations_data if isinstance(correlations_data, list) else []

        quality = analysis_data.get('data_quality', {})
        ml_readiness = analysis_data.get('ml_readiness', {})

        # Build dataset overview
        overview = f"""Dataset: {dataset_name}
- Rows: {summary.get('total_rows', 'N/A'):,}
- Columns: {summary.get('total_columns', 'N/A')}
- Numerical: {summary.get('numerical_columns', 0)}
- Categorical: {summary.get('categorical_columns', 0)}"""

        # Build statistics summary
        stats_summary = self._build_statistics_summary(statistics)

        # Build correlations summary
        corr_summary = self._build_correlations_summary(correlations)

        # Build quality summary
        quality_summary = self._build_quality_summary(quality)

        # Build ML readiness summary
        ml_summary = self._build_ml_readiness_summary(ml_readiness)

        # Construct full prompt
        prompt = f"""You are an expert data scientist analyzing a dataset called "{dataset_name}".

{overview}

KEY STATISTICS:
{stats_summary}

CORRELATIONS:
{corr_summary}

DATA QUALITY:
{quality_summary}

ML READINESS:
{ml_summary}

Based on this analysis, provide a comprehensive 2-paragraph executive summary that includes:

1. First paragraph: Dataset overview and key patterns
   - Main characteristics and structure
   - Notable patterns in the data
   - Distribution of features

2. Second paragraph: Data quality assessment and recommendations
   - Critical data quality issues
   - Potential impact on analysis
   - Specific recommendations for improvement

Keep it professional, actionable, and under 200 words total. Focus on insights that would be valuable for a data scientist or analyst working with this dataset."""

        return prompt

    def _build_statistics_summary(self, statistics: Dict[str, Any]) -> str:
        """Build statistics summary for prompt."""
        lines = []

        numerical = statistics.get('numerical', {})
        for col, stats in list(numerical.items())[:5]:  # Limit to 5 columns
            lines.append(
                f"- {col}: mean={stats.get('mean', 0):.2f}, "
                f"std={stats.get('std', 0):.2f}, "
                f"range=[{stats.get('min', 0):.2f}, {stats.get('max', 0):.2f}]"
            )

        return "\n".join(lines) if lines else "No numerical statistics available"

    def _build_correlations_summary(self, correlations: List[Dict]) -> str:
        """Build correlations summary for prompt."""
        if not correlations:
            return "No significant correlations found"

        strong_correlations = [c for c in correlations if abs(c.get('correlation', 0)) > 0.7]
        lines = []

        for corr in strong_correlations[:5]:  # Limit to 5
            lines.append(
                f"- {corr.get('col1')} vs {corr.get('col2')}: "
                f"{corr.get('correlation', 0):.3f}"
            )

        return "\n".join(lines) if lines else "No strong correlations"

    def _build_quality_summary(self, quality: Dict[str, Any]) -> str:
        """Build data quality summary for prompt."""
        completeness = quality.get('completeness', {})
        uniqueness = quality.get('uniqueness', {})

        lines = [
            f"- Missing values: {completeness.get('missing_percentage', 0):.1f}%",
            f"- Duplicate rows: {uniqueness.get('duplicate_percentage', 0):.1f}%"
        ]

        return "\n".join(lines)

    def _build_ml_readiness_summary(self, ml_readiness: Dict[str, Any]) -> str:
        """Build ML readiness summary for prompt."""
        score = ml_readiness.get('overall_score', 0)
        level = ml_readiness.get('readiness_level', 'unknown')

        return f"ML Readiness Score: {score}/100 ({level})"

    def generate_column_insights(self, column_name: str, stats: Dict[str, Any]) -> str:
        """
        Generate insights for a specific column.

        Args:
            column_name: Column name
            stats: Column statistics

        Returns:
            Generated insights
        """
        try:
            prompt = f"""As a data scientist, provide a brief analysis of column "{column_name}" with these statistics:

Mean: {stats.get('mean', 'N/A')}
Median: {stats.get('median', 'N/A')}
Std Dev: {stats.get('std', 'N/A')}
Min: {stats.get('min', 'N/A')}
Max: {stats.get('max', 'N/A')}
Skewness: {stats.get('skewness', 'N/A')}

Provide 2-3 sentences about the distribution characteristics and any concerns."""

            response = self.model.generate_content(prompt)
            return response.text

        except Exception as e:
            logger.error(f"Error generating column insights: {e}")
            return "Unable to generate insights for this column"

    def generate_transformation_suggestions(self, column_name: str, stats: Dict[str, Any]) -> List[Dict[str, str]]:
        """
        Suggest data transformations for a column.

        Args:
            column_name: Column name
            stats: Column statistics

        Returns:
            List of transformation suggestions
        """
        try:
            prompt = f"""As a data scientist, recommend data transformations for column "{column_name}" with these statistics:

Mean: {stats.get('mean', 'N/A')}
Median: {stats.get('median', 'N/A')}
Std Dev: {stats.get('std', 'N/A')}
Min: {stats.get('min', 'N/A')}
Max: {stats.get('max', 'N/A')}
Skewness: {stats.get('skewness', 'N/A')}

Recommend 2-3 specific transformations to improve normality and ML model performance.
Format as JSON array:
[
  {{
    "transformation": "name",
    "reason": "why",
    "code": "example code"
  }}
]"""

            response = self.model.generate_content(prompt)

            # Try to parse JSON response
            import json
            try:
                suggestions = json.loads(response.text)
                return suggestions
            except:
                # Fallback to text parsing
                return self._parse_transformation_text(response.text, column_name)

        except Exception as e:
            logger.error(f"Error generating transformation suggestions: {e}")
            return []

    def _parse_transformation_text(self, text: str, column_name: str) -> List[Dict[str, str]]:
        """Parse transformation suggestions from text."""
        suggestions = []

        # Check for skewness and suggest log transform
        if 'log' in text.lower() or 'skew' in text.lower():
            suggestions.append({
                'transformation': 'Log Transformation',
                'reason': 'Reduces right-skew',
                'code': f'np.log({column_name} + 1)'
            })

        # Check for standardization
        if 'standard' in text.lower() or 'scale' in text.lower():
            suggestions.append({
                'transformation': 'Standardization',
                'reason': 'Scales to mean=0, std=1',
                'code': f'({column_name} - {column_name}.mean()) / {column_name}.std()'
            })

        return suggestions