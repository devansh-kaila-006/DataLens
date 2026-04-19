"""
Insight Generator Module
Generates various types of AI-powered insights.
"""
import logging
from typing import Dict, Any, List
from gemini_client import GeminiClient

logger = logging.getLogger(__name__)


class InsightGenerator:
    """Generates AI-powered insights using Gemini."""

    def __init__(self):
        """Initialize insight generator."""
        self.gemini = GeminiClient()

    def generate_all_insights(self, analysis_results: Dict[str, Any], dataset_name: str) -> Dict[str, Any]:
        """
        Generate all types of insights for a dataset.

        Args:
            analysis_results: Complete analysis results
            dataset_name: Name of the dataset

        Returns:
            Dictionary with all generated insights
        """
        logger.info(f"Generating insights for dataset: {dataset_name}")

        insights = {}

        try:
            # Generate narrative insights
            insights['narrative'] = self.gemini.generate_insights(analysis_results, dataset_name)

            # Generate column-specific insights (limit to 5 columns)
            insights['column_insights'] = self._generate_column_insights(analysis_results)

            # Generate transformation suggestions
            insights['transformations'] = self._generate_transformation_suggestions(analysis_results)

            # Generate quality recommendations
            insights['quality_recommendations'] = self._generate_quality_recommendations(analysis_results)

            logger.info("Successfully generated all insights")
            return insights

        except Exception as e:
            logger.error(f"Error generating insights: {e}")
            raise

    def _generate_column_insights(self, analysis_results: Dict[str, Any]) -> Dict[str, str]:
        """Generate insights for individual columns."""
        column_insights = {}

        statistics = analysis_results.get('statistics', {})
        numerical_cols = statistics.get('numerical', {})

        # Limit to first 5 numerical columns
        for col, stats in list(numerical_cols.items())[:5]:
            try:
                insight = self.gemini.generate_column_insights(col, stats)
                column_insights[col] = insight
            except Exception as e:
                logger.error(f"Error generating insights for column {col}: {e}")
                column_insights[col] = f"Analysis available for {col}"

        return column_insights

    def _generate_transformation_suggestions(self, analysis_results: Dict[str, Any]) -> Dict[str, List[Dict]]:
        """Generate transformation suggestions for numerical columns."""
        transformations = {}

        statistics = analysis_results.get('statistics', {})
        numerical_cols = statistics.get('numerical', {})

        # Limit to first 5 numerical columns
        for col, stats in list(numerical_cols.items())[:5]:
            try:
                suggestions = self.gemini.generate_transformation_suggestions(col, stats)
                if suggestions:
                    transformations[col] = suggestions
            except Exception as e:
                logger.error(f"Error generating transformations for column {col}: {e}")

        return transformations

    def _generate_quality_recommendations(self, analysis_results: Dict[str, Any]) -> List[str]:
        """Generate data quality improvement recommendations."""
        recommendations = []

        quality = analysis_results.get('data_quality', {})
        completeness = quality.get('completeness', {})
        missing_pct = completeness.get('missing_percentage', 0)

        if missing_pct > 20:
            recommendations.append(
                f"Critical: {missing_pct:.1f}% of data is missing. "
                "Consider imputation strategies or removing affected columns."
            )
        elif missing_pct > 10:
            recommendations.append(
                f"Warning: {missing_pct:.1f}% of data is missing. "
                "Review and handle missing values appropriately."
            )

        duplicates = quality.get('uniqueness', {}).get('duplicate_percentage', 0)
        if duplicates > 5:
            recommendations.append(
                f"{duplicates:.1f}% duplicate rows found. "
                "Review and remove true duplicates to improve analysis quality."
            )

        # Check for outliers
        outliers = analysis_results.get('outliers', {})
        total_outliers = sum(
            len(stats.get('iqr', {}).get('indices', []))
            for stats in outliers.values()
        )

        if total_outliers > 10:
            recommendations.append(
                f"{total_outliers} outlier values detected. "
                "Investigate and decide on treatment strategy (capping, removal, or transformation)."
            )

        # Check correlations
        correlations_data = analysis_results.get('correlations', [])
        if isinstance(correlations_data, dict) and 'correlations' in correlations_data:
            correlations = correlations_data['correlations']
        else:
            correlations = correlations_data if isinstance(correlations_data, list) else []

        high_corr = [c for c in correlations if abs(c.get('correlation', 0)) > 0.9]

        if len(high_corr) > 3:
            recommendations.append(
                f"{len(high_corr)} highly correlated feature pairs found. "
                "Consider feature selection to reduce multicollinearity."
            )

        if not recommendations:
            recommendations.append("Data quality is generally good. No major issues detected.")

        return recommendations