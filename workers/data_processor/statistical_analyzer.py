"""
Statistical Analyzer Module
Handles comprehensive statistical analysis of datasets.
"""
import logging
import pandas as pd
import numpy as np
from scipy import stats
from typing import Dict, Any, List
import plotly.graph_objects as go
import plotly.express as px
import json

logger = logging.getLogger(__name__)


class StatisticalAnalyzer:
    """Performs comprehensive statistical analysis."""

    def __init__(self):
        """Initialize statistical analyzer."""
        self.analysis_results = {}

    def analyze_dataset(self, df: pd.DataFrame, column_types: Dict[str, str]) -> Dict[str, Any]:
        """
        Perform complete statistical analysis.

        Args:
            df: Input DataFrame
            column_types: Dictionary of column types

        Returns:
            Dictionary with all analysis results
        """
        logger.info("Starting comprehensive statistical analysis")

        results = {
            'statistics': {
                'numerical': self._analyze_numerical_columns(df, column_types),
                'categorical': self._analyze_categorical_columns(df, column_types)
            },
            'correlations': self._compute_correlations(df, column_types),
            'distributions': self._analyze_distributions(df, column_types),
            'outliers': self._detect_outliers(df, column_types),
            'data_quality': self._assess_data_quality(df, column_types)
        }

        logger.info("Statistical analysis complete")
        return results

    def _analyze_numerical_columns(self, df: pd.DataFrame, column_types: Dict[str, str]) -> Dict[str, Dict]:
        """
        Analyze numerical columns.

        Args:
            df: Input DataFrame
            column_types: Column type mappings

        Returns:
            Dictionary with numerical statistics per column
        """
        numerical_stats = {}
        numerical_cols = [col for col, dtype in column_types.items() if dtype == 'numerical']

        logger.info(f"Analyzing {len(numerical_cols)} numerical columns")

        for col in numerical_cols:
            try:
                data = df[col].dropna()

                if len(data) == 0:
                    continue

                # Basic statistics
                stats_dict = {
                    'count': len(data),
                    'mean': float(data.mean()),
                    'median': float(data.median()),
                    'std': float(data.std()),
                    'min': float(data.min()),
                    'max': float(data.max()),
                    'quartiles': [
                        float(data.quantile(0.25)),
                        float(data.quantile(0.50)),
                        float(data.quantile(0.75))
                    ],
                    'skewness': float(stats.skew(data)),
                    'kurtosis': float(stats.kurtosis(data)),
                    'missing_count': int(df[col].isnull().sum())
                }

                # Additional statistics
                stats_dict['range'] = stats_dict['max'] - stats_dict['min']
                stats_dict['coefficient_of_variation'] = (
                    stats_dict['std'] / stats_dict['mean'] if stats_dict['mean'] != 0 else 0
                )

                # Outliers detection
                Q1, Q3 = stats_dict['quartiles'][0], stats_dict['quartiles'][2]
                IQR = Q3 - Q1
                lower_bound = Q1 - 1.5 * IQR
                upper_bound = Q3 + 1.5 * IQR

                outliers = data[(data < lower_bound) | (data > upper_bound)]
                stats_dict['outliers'] = {
                    'count': len(outliers),
                    'percentage': (len(outliers) / len(data)) * 100,
                    'values': outliers.head(20).tolist()  # Limit to 20
                }

                numerical_stats[col] = stats_dict

            except Exception as e:
                logger.error(f"Error analyzing numerical column {col}: {e}")
                continue

        return numerical_stats

    def _analyze_categorical_columns(self, df: pd.DataFrame, column_types: Dict[str, str]) -> Dict[str, Dict]:
        """
        Analyze categorical columns.

        Args:
            df: Input DataFrame
            column_types: Column type mappings

        Returns:
            Dictionary with categorical statistics per column
        """
        categorical_stats = {}
        categorical_cols = [col for col, dtype in column_types.items() if dtype == 'categorical']

        logger.info(f"Analyzing {len(categorical_cols)} categorical columns")

        for col in categorical_cols:
            try:
                data = df[col].dropna()

                if len(data) == 0:
                    continue

                value_counts = data.value_counts()

                stats_dict = {
                    'unique_count': len(value_counts),
                    'most_common': value_counts.head(10).to_dict(),
                    'missing_count': int(df[col].isnull().sum()),
                    'cardinality_ratio': len(value_counts) / len(data)
                }

                # Class imbalance detection
                if len(value_counts) > 1:
                    max_count = value_counts.max()
                    min_count = value_counts.min()
                    stats_dict['imbalance_ratio'] = max_count / min_count if min_count > 0 else float('inf')

                categorical_stats[col] = stats_dict

            except Exception as e:
                logger.error(f"Error analyzing categorical column {col}: {e}")
                continue

        return categorical_stats

    def _compute_correlations(self, df: pd.DataFrame, column_types: Dict[str, str]) -> List[Dict[str, Any]]:
        """
        Compute correlations between numerical columns.

        Args:
            df: Input DataFrame
            column_types: Column type mappings

        Returns:
            List of correlation pairs
        """
        try:
            numerical_cols = [col for col, dtype in column_types.items() if dtype == 'numerical']

            if len(numerical_cols) < 2:
                return []

            # Compute correlation matrix
            corr_matrix = df[numerical_cols].corr()

            # Convert to list of pairs
            correlations = []
            for i, col1 in enumerate(numerical_cols):
                for col2 in numerical_cols[i+1:]:
                    corr_value = corr_matrix.loc[col1, col2]
                    if not np.isnan(corr_value):
                        correlations.append({
                            'col1': col1,
                            'col2': col2,
                            'correlation': round(float(corr_value), 3),
                            'abs_correlation': round(abs(float(corr_value)), 3)
                        })

            # Sort by absolute correlation
            correlations.sort(key=lambda x: x['abs_correlation'], reverse=True)

            logger.info(f"Computed {len(correlations)} correlation pairs")
            return correlations

        except Exception as e:
            logger.error(f"Error computing correlations: {e}")
            return []

    def _analyze_distributions(self, df: pd.DataFrame, column_types: Dict[str, str]) -> Dict[str, Dict]:
        """
        Analyze distributions of numerical columns.

        Args:
            df: Input DataFrame
            column_types: Column type mappings

        Returns:
            Dictionary with distribution analysis
        """
        distributions = {}
        numerical_cols = [col for col, dtype in column_types.items() if dtype == 'numerical']

        for col in numerical_cols:
            try:
                data = df[col].dropna()

                if len(data) < 3:
                    continue

                # Normality test
                _, p_value = stats.normaltest(data)
                is_normal = p_value > 0.05

                distributions[col] = {
                    'is_normal': is_normal,
                    'normality_p_value': float(p_value),
                    'histogram_data': self._create_histogram_data(data)
                }

            except Exception as e:
                logger.error(f"Error analyzing distribution for {col}: {e}")
                continue

        return distributions

    def _create_histogram_data(self, data: pd.Series) -> Dict[str, Any]:
        """
        Create histogram data for visualization.

        Args:
            data: Series data

        Returns:
            Dictionary with histogram bins and counts
        """
        hist, bins = np.histogram(data, bins='auto')

        return {
            'bins': bins.tolist(),
            'counts': hist.tolist(),
            'bin_edges': bins.tolist()
        }

    def _detect_outliers(self, df: pd.DataFrame, column_types: Dict[str, str]) -> Dict[str, List[Dict]]:
        """
        Detect outliers using multiple methods.

        Args:
            df: Input DataFrame
            column_types: Column type mappings

        Returns:
            Dictionary with outliers per column
        """
        outliers = {}
        numerical_cols = [col for col, dtype in column_types.items() if dtype == 'numerical']

        for col in numerical_cols:
            try:
                data = df[col].dropna()

                if len(data) < 4:
                    continue

                # IQR method
                Q1 = data.quantile(0.25)
                Q3 = data.quantile(0.75)
                IQR = Q3 - Q1

                iqr_outliers = data[(data < Q1 - 1.5 * IQR) | (data > Q3 + 1.5 * IQR)]

                # Z-score method
                z_scores = np.abs(stats.zscore(data))
                zscore_outliers = data[z_scores > 3]

                outliers[col] = {
                    'iqr': {
                        'count': len(iqr_outliers),
                        'indices': iqr_outliers.index.tolist()[:20]  # Limit to 20
                    },
                    'zscore': {
                        'count': len(zscore_outliers),
                        'indices': zscore_outliers.index.tolist()[:20]
                    }
                }

            except Exception as e:
                logger.error(f"Error detecting outliers in {col}: {e}")
                continue

        return outliers

    def _assess_data_quality(self, df: pd.DataFrame, column_types: Dict[str, str]) -> Dict[str, Any]:
        """
        Assess overall data quality.

        Args:
            df: Input DataFrame
            column_types: Column type mappings

        Returns:
            Dictionary with quality metrics
        """
        total_cells = len(df) * len(df.columns)
        missing_cells = df.isnull().sum().sum()

        quality = {
            'completeness': {
                'total_cells': total_cells,
                'missing_cells': int(missing_cells),
                'missing_percentage': (missing_cells / total_cells * 100) if total_cells > 0 else 0
            },
            'uniqueness': {
                'duplicate_rows': int(df.duplicated().sum()),
                'duplicate_percentage': (df.duplicated().sum() / len(df) * 100)
            },
            'consistency': {
                'constant_columns': [
                    col for col in df.columns
                    if df[col].nunique() <= 1
                ],
                'high_cardinality_columns': [
                    col for col, dtype in column_types.items()
                    if dtype == 'categorical' and df[col].nunique() > len(df) * 0.8
                ]
            }
        }

        return quality