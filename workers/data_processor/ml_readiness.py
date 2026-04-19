"""
ML Readiness Module
Assesses dataset readiness for machine learning and provides recommendations.
"""
import logging
import pandas as pd
from typing import Dict, Any, List

logger = logging.getLogger(__name__)


class MLReadinessAssessor:
    """Assesses ML readiness and provides recommendations."""

    def __init__(self):
        """Initialize ML readiness assessor."""
        self.recommendations = []

    def assess_ml_readiness(self, analysis_results: Dict[str, Any], target_variable: str = None) -> Dict[str, Any]:
        """
        Assess ML readiness of dataset.

        Args:
            analysis_results: Complete analysis results
            target_variable: Optional target variable name

        Returns:
            Dictionary with ML readiness assessment
        """
        logger.info("Assessing ML readiness")

        assessment = {
            'overall_score': 0,
            'readiness_level': 'unknown',
            'issues': [],
            'recommendations': [],
            'suggested_preprocessing': [],
            'model_recommendations': []
        }

        # Assess data quality
        quality_score = self._assess_quality(analysis_results)
        assessment['overall_score'] += quality_score * 0.3

        # Assess feature quality
        feature_score = self._assess_features(analysis_results)
        assessment['overall_score'] += feature_score * 0.4

        # Assess sample size
        sample_score = self._assess_sample_size(analysis_results)
        assessment['overall_score'] += sample_score * 0.3

        # Determine readiness level
        assessment['overall_score'] = round(assessment['overall_score'], 2)
        assessment['readiness_level'] = self._get_readiness_level(assessment['overall_score'])

        # Generate recommendations
        assessment['recommendations'] = self._generate_recommendations(analysis_results)
        assessment['suggested_preprocessing'] = self._suggest_preprocessing(analysis_results)

        # Generate model recommendations
        if target_variable:
            assessment['model_recommendations'] = self._recommend_models(
                analysis_results, target_variable
            )

        logger.info(f"ML readiness assessment complete: {assessment['readiness_level']}")
        return assessment

    def _assess_quality(self, analysis_results: Dict[str, Any]) -> float:
        """
        Assess data quality score (0-100).

        Args:
            analysis_results: Analysis results

        Returns:
            Quality score
        """
        score = 100.0
        issues = []

        # Check missing values
        quality = analysis_results.get('data_quality', {})
        completeness = quality.get('completeness', {})
        missing_pct = completeness.get('missing_percentage', 0)

        if missing_pct > 20:
            score -= 30
            issues.append(f"High missing values: {missing_pct:.1f}%")
        elif missing_pct > 10:
            score -= 15
            issues.append(f"Moderate missing values: {missing_pct:.1f}%")
        elif missing_pct > 5:
            score -= 5

        # Check duplicates
        uniqueness = quality.get('uniqueness', {})
        duplicate_pct = uniqueness.get('duplicate_percentage', 0)

        if duplicate_pct > 10:
            score -= 20
            issues.append(f"High duplicate rate: {duplicate_pct:.1f}%")
        elif duplicate_pct > 5:
            score -= 10

        # Check constant columns
        consistency = quality.get('consistency', {})
        constant_cols = consistency.get('constant_columns', [])

        if constant_cols:
            score -= len(constant_cols) * 5
            issues.append(f"{len(constant_cols)} constant columns found")

        return max(0, score)

    def _assess_features(self, analysis_results: Dict[str, Any]) -> float:
        """
        Assess feature quality score (0-100).

        Args:
            analysis_results: Analysis results

        Returns:
            Feature quality score
        """
        score = 100.0

        statistics = analysis_results.get('statistics', {})
        numerical_cols = statistics.get('numerical', {})
        categorical_cols = statistics.get('categorical', {})

        # Check feature count
        total_features = len(numerical_cols) + len(categorical_cols)

        if total_features < 3:
            score -= 30
        elif total_features < 5:
            score -= 15

        # Check for high correlations (multicollinearity)
        correlations = analysis_results.get('correlations', [])
        high_corr = [c for c in correlations if abs(c.get('correlation', 0)) > 0.9]

        if high_corr:
            score -= min(20, len(high_corr) * 5)

        # Check categorical cardinality
        for col, stats in categorical_cols.items():
            cardinality_ratio = stats.get('cardinality_ratio', 0)
            if cardinality_ratio > 0.9:
                score -= 10

        return max(0, score)

    def _assess_sample_size(self, analysis_results: Dict[str, Any]) -> float:
        """
        Assess sample size adequacy (0-100).

        Args:
            analysis_results: Analysis results

        Returns:
            Sample size score
        """
        # This is a simplified assessment
        # In practice, you'd get row count from profile
        # For now, assume adequate sample size
        return 80.0

    def _get_readiness_level(self, score: float) -> str:
        """
        Get readiness level from score.

        Args:
            score: Overall score

        Returns:
            Readiness level string
        """
        if score >= 80:
            return 'high'
        elif score >= 60:
            return 'moderate'
        elif score >= 40:
            return 'low'
        else:
            return 'very_low'

    def _generate_recommendations(self, analysis_results: Dict[str, Any]) -> List[str]:
        """
        Generate improvement recommendations.

        Args:
            analysis_results: Analysis results

        Returns:
            List of recommendations
        """
        recommendations = []

        # Missing values
        quality = analysis_results.get('data_quality', {})
        missing_pct = quality.get('completeness', {}).get('missing_percentage', 0)

        if missing_pct > 10:
            recommendations.append(
                f"Handle missing values ({missing_pct:.1f}%): "
                "consider imputation or removal"
            )

        # Duplicates
        duplicate_pct = quality.get('uniqueness', {}).get('duplicate_percentage', 0)
        if duplicate_pct > 5:
            recommendations.append(
                f"Remove duplicate rows ({duplicate_pct:.1f}% of data)"
            )

        # Outliers
        outliers = analysis_results.get('outliers', {})
        total_outliers = sum(
            len(stats.get('iqr', {}).get('indices', []))
            for stats in outliers.values()
        )

        if total_outliers > 0:
            recommendations.append(
                f"Investigate {total_outliers} outlier values "
                "and decide on treatment strategy"
            )

        # Multicollinearity
        correlations = analysis_results.get('correlations', [])
        high_corr = [c for c in correlations if abs(c.get('correlation', 0)) > 0.9]

        if high_corr:
            recommendations.append(
                f"Address multicollinearity: {len(high_corr)} "
                "highly correlated feature pairs found"
            )

        return recommendations

    def _suggest_preprocessing(self, analysis_results: Dict[str, Any]) -> List[Dict[str, str]]:
        """
        Suggest preprocessing steps.

        Args:
            analysis_results: Analysis results

        Returns:
            List of preprocessing suggestions
        """
        preprocessing = []

        statistics = analysis_results.get('statistics', {})

        # Numerical features
        for col, stats in statistics.get('numerical', {}).items():
            # Check skewness
            skewness = stats.get('skewness', 0)

            if abs(skewness) > 1:
                preprocessing.append({
                    'column': col,
                    'step': 'transform',
                    'reason': f'High skewness ({skewness:.2f})',
                    'suggestion': 'Log or Box-Cox transformation'
                })

            # Check scale
            std = stats.get('std', 0)
            mean = stats.get('mean', 0)

            if mean != 0 and (std / abs(mean)) > 0.5:
                preprocessing.append({
                    'column': col,
                    'step': 'scale',
                    'reason': 'High variance relative to mean',
                    'suggestion': 'Standardization or normalization'
                })

        # Categorical features
        for col, stats in statistics.get('categorical', {}).items():
            unique_count = stats.get('unique_count', 0)

            if unique_count > 50:
                preprocessing.append({
                    'column': col,
                    'step': 'encode',
                    'reason': f'High cardinality ({unique_count} unique values)',
                    'suggestion': 'Target encoding or embedding'
                })
            else:
                preprocessing.append({
                    'column': col,
                    'step': 'encode',
                    'reason': 'Categorical variable',
                    'suggestion': 'One-hot encoding'
                })

        return preprocessing

    def _recommend_models(self, analysis_results: Dict[str, Any], target_variable: str) -> List[Dict[str, Any]]:
        """
        Recommend ML models based on data characteristics.

        Args:
            analysis_results: Analysis results
            target_variable: Target variable name

        Returns:
            List of model recommendations
        """
        recommendations = []
        statistics = analysis_results.get('statistics', {})

        # Determine if classification or regression
        target_stats = statistics.get('numerical', {}).get(target_variable) or \
                      statistics.get('categorical', {}).get(target_variable)

        if not target_stats:
            return []

        # Problem type
        is_classification = target_variable in statistics.get('categorical', {})

        if is_classification:
            # Classification recommendations
            recommendations.append({
                'model': 'Random Forest Classifier',
                'priority': 'high',
                'reason': 'Robust to outliers, handles mixed data types',
                'preprocessing': ['Encode categoricals', 'Handle missing values'],
                'considerations': ['May overfit with many trees', 'Feature importance available']
            })

            recommendations.append({
                'model': 'Gradient Boosting (XGBoost/LightGBM)',
                'priority': 'high',
                'reason': 'State-of-the-art performance for tabular data',
                'preprocessing': ['Encode categoricals', 'Handle missing values'],
                'considerations': ['Requires hyperparameter tuning', 'Longer training time']
            })

            # Check class imbalance
            if target_stats.get('imbalance_ratio', 1) > 2:
                recommendations.append({
                    'model': 'Balanced Random Forest or XGBoost with scale_pos_weight',
                    'priority': 'medium',
                    'reason': 'Handles class imbalance',
                    'preprocessing': ['Encode categoricals', 'Use class weights'],
                    'considerations': ['Requires careful tuning', 'May sacrifice majority class performance']
                })

        else:
            # Regression recommendations
            recommendations.append({
                'model': 'Random Forest Regressor',
                'priority': 'high',
                'reason': 'Handles non-linear relationships, robust to outliers',
                'preprocessing': ['Encode categoricals', 'Handle missing values'],
                'considerations': ['May overfit', 'Less interpretable than linear models']
            })

            recommendations.append({
                'model': 'Gradient Boosting Regressor',
                'priority': 'high',
                'reason': 'Excellent performance on tabular regression',
                'preprocessing': ['Handle missing values', 'Feature scaling optional'],
                'considerations': ['Requires tuning', 'Sensitive to outliers']
            })

            # Check for linear relationships
            correlations = analysis_results.get('correlations', [])
            strong_correlations = [c for c in correlations if abs(c.get('correlation', 0)) > 0.7]

            if len(strong_correlations) > 0:
                recommendations.append({
                    'model': 'Linear Regression with regularization',
                    'priority': 'medium',
                    'reason': 'Strong correlations suggest potential linear relationships',
                    'preprocessing': ['Handle missing values', 'Scale features', 'Encode categoricals'],
                    'considerations': ['Assumes linearity', 'Sensitive to outliers', 'Check multicollinearity']
                })

        return recommendations