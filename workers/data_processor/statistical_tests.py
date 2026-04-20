"""
Statistical Tests Module

Comprehensive statistical testing suite including:
- Hypothesis tests (t-tests, ANOVA, chi-square, non-parametric tests)
- Correlation analysis (Pearson, Spearman, Kendall)
- Regression analysis (simple and multiple)
- Effect size calculations
- Power analysis
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Any, Optional
import logging

logger = logging.getLogger(__name__)

try:
    from scipy import stats
    from scipy.stats import pearsonr, spearmanr, kendalltau
    SCIPY_AVAILABLE = True
except ImportError:
    logger.warning("scipy not available - statistical testing will be limited")
    SCIPY_AVAILABLE = False

try:
    from sklearn.linear_model import LinearRegression, LogisticRegression
    SKLEARN_AVAILABLE = True
except ImportError:
    logger.warning("scikit-learn not available - regression analysis will be limited")
    SKLEARN_AVAILABLE = False

try:
    import statsmodels.api as sm
    from statsmodels.stats.power import ttest_power
    STATSMODELS_AVAILABLE = True
except ImportError:
    logger.warning("statsmodels not available - advanced statistical tests will be limited")
    STATSMODELS_AVAILABLE = False


class StatisticalTests:
    """Comprehensive statistical testing suite including hypothesis tests, correlations, and regression"""

    def __init__(self, alpha: float = 0.05, min_sample_size: int = 20):
        """
        Initialize Statistical Tests

        Args:
            alpha: Significance level for hypothesis tests (default: 0.05)
            min_sample_size: Minimum sample size for most tests
        """
        self.alpha = alpha
        self.min_sample_size = min_sample_size

    def run_all_tests(
        self,
        df: pd.DataFrame,
        column_types: Dict[str, str]
    ) -> Dict[str, Any]:
        """
        Run comprehensive statistical testing suite

        Args:
            df: Input dataframe
            column_types: Dict mapping column names to types ('numerical' or 'categorical')

        Returns:
            dict: Complete statistical testing results
        """
        if not SCIPY_AVAILABLE:
            return {'error': 'scipy library is required for statistical testing'}

        try:
            numerical_cols = [k for k, v in column_types.items() if v == 'numerical']
            categorical_cols = [k for k, v in column_types.items() if v == 'categorical']

            logger.info(f"📊 Running statistical tests on {len(numerical_cols)} numerical, {len(categorical_cols)} categorical columns")

            # Check assumptions
            assumptions = self._check_assumptions(df, numerical_cols)

            # Run hypothesis tests
            hypothesis_tests = {}

            if len(numerical_cols) >= 1:
                hypothesis_tests['one_sample_t'] = self._one_sample_t_tests(df, numerical_cols)

            if len(numerical_cols) >= 2:
                hypothesis_tests['two_sample_t'] = self._two_sample_t_tests(df, numerical_cols)
                hypothesis_tests['paired_t'] = self._paired_t_tests(df, numerical_cols)

            if len(numerical_cols) >= 3:
                hypothesis_tests['anova'] = self._anova_tests(df, numerical_cols)

            if len(categorical_cols) >= 2:
                hypothesis_tests['chi_square'] = self._chi_square_tests(df, categorical_cols)

            if len(numerical_cols) >= 2:
                hypothesis_tests['mann_whitney'] = self._mann_whitney_tests(df, numerical_cols)

            if len(numerical_cols) >= 3:
                hypothesis_tests['kruskal_wallis'] = self._kruskal_wallis_tests(df, numerical_cols)

            # Correlation analysis
            correlation_analysis = self._correlation_analysis(df, numerical_cols)

            # Regression analysis
            regression_analysis = self._regression_analysis(df, numerical_cols)

            # Effect sizes
            effect_sizes = self._calculate_effect_sizes(df, numerical_cols)

            # Power analysis
            power_analysis = self._power_analysis(df, numerical_cols)

            return {
                'assumption_checks': assumptions,
                'hypothesis_tests': hypothesis_tests,
                'correlation_analysis': correlation_analysis,
                'regression_analysis': regression_analysis,
                'effect_sizes': effect_sizes,
                'power_analysis': power_analysis
            }

        except Exception as e:
            logger.error(f"❌ Statistical testing failed: {e}")
            return {'error': str(e)}

    def _check_assumptions(self, df: pd.DataFrame, numerical_cols: List[str]) -> Dict[str, Any]:
        """Check statistical assumptions for parametric tests"""
        assumptions = {
            'normality': {},
            'homogeneity_of_variance': {}
        }

        # Normality tests
        for col in numerical_cols:
            data = df[col].dropna()
            if len(data) >= self.min_sample_size:
                try:
                    shapiro_stat, shapiro_p = stats.shapiro(data[:5000])  # Limit for performance
                    assumptions['normality'][col] = {
                        'shapiro_wilk': {
                            'statistic': float(shapiro_stat),
                            'p_value': float(shapiro_p),
                            'is_normal': shapiro_p > self.alpha
                        }
                    }
                except Exception as e:
                    logger.warning(f"⚠️ Normality test failed for {col}: {e}")

        # Homogeneity of variance (Levene's test)
        if len(numerical_cols) >= 2:
            try:
                samples = [df[col].dropna()[:5000] for col in numerical_cols[:3]]
                samples = [s for s in samples if len(s) >= self.min_sample_size]

                if len(samples) >= 2:
                    levene_stat, levene_p = stats.levene(*samples)
                    assumptions['homogeneity_of_variance'] = {
                        'levene_test': {
                            'statistic': float(levene_stat),
                            'p_value': float(levene_p),
                            'has_homogeneity': levene_p > self.alpha
                        }
                    }
            except Exception as e:
                logger.warning(f"⚠️ Levene's test failed: {e}")

        return assumptions

    def _one_sample_t_tests(self, df: pd.DataFrame, numerical_cols: List[str]) -> Dict[str, Any]:
        """One-sample t-tests against zero"""
        results = {}

        for col in numerical_cols:
            data = df[col].dropna()
            if len(data) >= self.min_sample_size:
                try:
                    t_stat, p_value = stats.ttest_1samp(data, 0)
                    results[col] = {
                        't_statistic': float(t_stat),
                        'p_value': float(p_value),
                        'is_significant': p_value < self.alpha,
                        'mean': float(data.mean()),
                        'std': float(data.std())
                    }
                except Exception as e:
                    logger.warning(f"⚠️ One-sample t-test failed for {col}: {e}")

        return results

    def _two_sample_t_tests(self, df: pd.DataFrame, numerical_cols: List[str]) -> Dict[str, Any]:
        """Independent two-sample t-tests"""
        results = {}

        for i, col1 in enumerate(numerical_cols):
            for col2 in numerical_cols[i+1:]:
                data1 = df[col1].dropna()
                data2 = df[col2].dropna()

                if len(data1) >= self.min_sample_size and len(data2) >= self.min_sample_size:
                    try:
                        t_stat, p_value = stats.ttest_ind(data1, data2)
                        cohens_d = self._calculate_cohens_d(data1, data2)

                        test_name = f'{col1}_vs_{col2}'
                        results[test_name] = {
                            't_statistic': float(t_stat),
                            'p_value': float(p_value),
                            'is_significant': p_value < self.alpha,
                            'cohens_d': float(cohens_d),
                            'interpretation': self._interpret_cohens_d(cohens_d)
                        }
                    except Exception as e:
                        logger.warning(f"⚠️ Two-sample t-test failed for {col1} vs {col2}: {e}")

        return results

    def _paired_t_tests(self, df: pd.DataFrame, numerical_cols: List[str]) -> Dict[str, Any]:
        """Paired t-tests (treats columns as paired observations)"""
        results = {}

        for i, col1 in enumerate(numerical_cols):
            for col2 in numerical_cols[i+1:]:
                try:
                    # Align data
                    paired_data = df[[col1, col2]].dropna()

                    if len(paired_data) >= self.min_sample_size:
                        t_stat, p_value = stats.ttest_rel(paired_data[col1], paired_data[col2])

                        test_name = f'{col1}_vs_{col2}'
                        results[test_name] = {
                            't_statistic': float(t_stat),
                            'p_value': float(p_value),
                            'is_significant': p_value < self.alpha
                        }
                except Exception as e:
                    logger.warning(f"⚠️ Paired t-test failed for {col1} vs {col2}: {e}")

        return results

    def _anova_tests(self, df: pd.DataFrame, numerical_cols: List[str]) -> Dict[str, Any]:
        """One-way ANOVA tests"""
        results = {}

        for i, col1 in enumerate(numerical_cols):
            for col2 in numerical_cols[i+1:]:
                for col3 in numerical_cols[i+2:]:
                    data1 = df[col1].dropna()
                    data2 = df[col2].dropna()
                    data3 = df[col3].dropna()

                    if all(len(d) >= self.min_sample_size for d in [data1, data2, data3]):
                        try:
                            f_stat, p_value = stats.f_oneway(data1, data2, data3)
                            eta_squared = self._calculate_eta_squared([data1, data2, data3])

                            test_name = f'{col1}_{col2}_{col3}'
                            results[test_name] = {
                                'f_statistic': float(f_stat),
                                'p_value': float(p_value),
                                'is_significant': p_value < self.alpha,
                                'eta_squared': float(eta_squared)
                            }
                        except Exception as e:
                            logger.warning(f"⚠️ ANOVA failed for {col1}, {col2}, {col3}: {e}")

        return results

    def _chi_square_tests(self, df: pd.DataFrame, categorical_cols: List[str]) -> Dict[str, Any]:
        """Chi-square test of independence"""
        results = {}

        for i, col1 in enumerate(categorical_cols):
            for col2 in categorical_cols[i+1:]:
                try:
                    contingency_table = pd.crosstab(df[col1], df[col2])

                    if contingency_table.size > 0 and contingency_table.sum().sum() >= 5:
                        chi2, p_value, dof, expected = stats.chi2_contingency(contingency_table)

                        test_name = f'{col1}_vs_{col2}'
                        results[test_name] = {
                            'chi2_statistic': float(chi2),
                            'p_value': float(p_value),
                            'degrees_of_freedom': int(dof),
                            'is_significant': p_value < self.alpha
                        }
                except Exception as e:
                    logger.warning(f"⚠️ Chi-square test failed for {col1} vs {col2}: {e}")

        return results

    def _mann_whitney_tests(self, df: pd.DataFrame, numerical_cols: List[str]) -> Dict[str, Any]:
        """Mann-Whitney U tests (non-parametric alternative to t-test)"""
        results = {}

        for i, col1 in enumerate(numerical_cols):
            for col2 in numerical_cols[i+1:]:
                data1 = df[col1].dropna()
                data2 = df[col2].dropna()

                if len(data1) >= self.min_sample_size and len(data2) >= self.min_sample_size:
                    try:
                        u_stat, p_value = stats.mannwhitneyu(data1, data2, alternative='two-sided')

                        test_name = f'{col1}_vs_{col2}'
                        results[test_name] = {
                            'u_statistic': float(u_stat),
                            'p_value': float(p_value),
                            'is_significant': p_value < self.alpha
                        }
                    except Exception as e:
                        logger.warning(f"⚠️ Mann-Whitney test failed for {col1} vs {col2}: {e}")

        return results

    def _kruskal_wallis_tests(self, df: pd.DataFrame, numerical_cols: List[str]) -> Dict[str, Any]:
        """Kruskal-Wallis tests (non-parametric alternative to ANOVA)"""
        results = {}

        for i, col1 in enumerate(numerical_cols):
            for col2 in numerical_cols[i+1:]:
                for col3 in numerical_cols[i+2:]:
                    data1 = df[col1].dropna()
                    data2 = df[col2].dropna()
                    data3 = df[col3].dropna()

                    if all(len(d) >= self.min_sample_size for d in [data1, data2, data3]):
                        try:
                            h_stat, p_value = stats.kruskal(data1, data2, data3)

                            test_name = f'{col1}_{col2}_{col3}'
                            results[test_name] = {
                                'h_statistic': float(h_stat),
                                'p_value': float(p_value),
                                'is_significant': p_value < self.alpha
                            }
                        except Exception as e:
                            logger.warning(f"⚠️ Kruskal-Wallis test failed: {e}")

        return results

    def _correlation_analysis(self, df: pd.DataFrame, numerical_cols: List[str]) -> Dict[str, Any]:
        """Compute correlations using multiple methods"""
        results = {
            'pearson': [],
            'spearman': [],
            'kendall': []
        }

        for i, col1 in enumerate(numerical_cols):
            for col2 in numerical_cols[i+1:]:
                data1 = df[col1].dropna()
                data2 = df[col2].dropna()

                # Align data
                aligned_data = pd.DataFrame({col1: data1, col2: data2}).dropna()

                if len(aligned_data) >= self.min_sample_size:
                    # Pearson correlation
                    try:
                        pearson_r, pearson_p = pearsonr(aligned_data[col1], aligned_data[col2])
                        results['pearson'].append({
                            'column1': col1,
                            'column2': col2,
                            'correlation': float(pearson_r),
                            'p_value': float(pearson_p),
                            'is_significant': pearson_p < self.alpha
                        })
                    except Exception as e:
                        logger.warning(f"⚠️ Pearson correlation failed for {col1} vs {col2}: {e}")

                    # Spearman correlation
                    try:
                        spearman_r, spearman_p = spearmanr(aligned_data[col1], aligned_data[col2])
                        results['spearman'].append({
                            'column1': col1,
                            'column2': col2,
                            'correlation': float(spearman_r),
                            'p_value': float(spearman_p),
                            'is_significant': spearman_p < self.alpha
                        })
                    except Exception as e:
                        logger.warning(f"⚠️ Spearman correlation failed for {col1} vs {col2}: {e}")

                    # Kendall's tau
                    try:
                        kendall_tau, kendall_p = kendalltau(aligned_data[col1], aligned_data[col2])
                        results['kendall'].append({
                            'column1': col1,
                            'column2': col2,
                            'correlation': float(kendall_tau),
                            'p_value': float(kendall_p),
                            'is_significant': kendall_p < self.alpha
                        })
                    except Exception as e:
                        logger.warning(f"⚠️ Kendall correlation failed for {col1} vs {col2}: {e}")

        return results

    def _regression_analysis(self, df: pd.DataFrame, numerical_cols: List[str]) -> Dict[str, Any]:
        """Perform regression analysis"""
        results = {
            'simple_regression': [],
            'multiple_regression': {}
        }

        if not SKLEARN_AVAILABLE:
            return results

        # Simple linear regression (pairs)
        for i, col1 in enumerate(numerical_cols):
            for col2 in numerical_cols[i+1:]:
                try:
                    X = df[[col1]].dropna()
                    y = df[col2].dropna()

                    # Align
                    aligned_data = pd.concat([X, y], axis=1).dropna()

                    if len(aligned_data) >= self.min_sample_size:
                        X_aligned = aligned_data[[col1]].values
                        y_aligned = aligned_data[col2].values

                        model = LinearRegression()
                        model.fit(X_aligned, y_aligned)

                        y_pred = model.predict(X_aligned)
                        r_squared = model.score(X_aligned, y_aligned)
                        rmse = np.sqrt(((y_aligned - y_pred) ** 2).mean())

                        results['simple_regression'].append({
                            'dependent': col2,
                            'independent': col1,
                            'coefficients': {
                                'intercept': float(model.intercept_),
                                'slope': float(model.coef_[0])
                            },
                            'model_fit': {
                                'r_squared': float(r_squared),
                                'rmse': float(rmse)
                            }
                        })
                except Exception as e:
                    logger.warning(f"⚠️ Simple regression failed for {col1} vs {col2}: {e}")

        # Multiple regression (if enough columns and statsmodels available)
        if len(numerical_cols) >= 3 and STATSMODELS_AVAILABLE:
            try:
                # Use first column as target, rest as predictors
                target_col = numerical_cols[0]
                predictor_cols = numerical_cols[1:]

                X = df[predictor_cols].dropna()
                y = df[target_col].dropna()

                aligned_data = pd.concat([X, y], axis=1).dropna()

                if len(aligned_data) >= self.min_sample_size:
                    X_aligned = aligned_data[predictor_cols].values
                    y_aligned = aligned_data[target_col].values

                    X_with_const = sm.add_constant(X_aligned)
                    model = sm.OLS(y_aligned, X_with_const).fit()

                    results['multiple_regression'] = {
                        'dependent': target_col,
                        'independent': predictor_cols,
                        'coefficients': {
                            'intercept': float(model.params[0]),
                            **{f'beta_{i}': float(model.params[i+1]) for i in range(len(predictor_cols))}
                        },
                        'model_fit': {
                            'r_squared': float(model.rsquared),
                            'adj_r_squared': float(model.rsquared_adj),
                            'f_statistic': float(model.fvalue),
                            'p_value': float(model.f_pvalue)
                        }
                    }
            except Exception as e:
                logger.warning(f"⚠️ Multiple regression failed: {e}")

        return results

    def _calculate_effect_sizes(self, df: pd.DataFrame, numerical_cols: List[str]) -> Dict[str, Any]:
        """Calculate effect sizes"""
        results = {}

        for i, col1 in enumerate(numerical_cols):
            for col2 in numerical_cols[i+1:]:
                data1 = df[col1].dropna()
                data2 = df[col2].dropna()

                if len(data1) >= self.min_sample_size and len(data2) >= self.min_sample_size:
                    try:
                        cohens_d = self._calculate_cohens_d(data1, data2)

                        test_name = f'{col1}_vs_{col2}'
                        results[test_name] = {
                            'cohens_d': float(cohens_d),
                            'interpretation': self._interpret_cohens_d(cohens_d)
                        }
                    except Exception as e:
                        logger.warning(f"⚠️ Effect size calculation failed for {col1} vs {col2}: {e}")

        return results

    def _calculate_cohens_d(self, group1: pd.Series, group2: pd.Series) -> float:
        """Calculate Cohen's d effect size"""
        n1, n2 = len(group1), len(group2)
        var1, var2 = group1.var(), group2.var()

        # Pooled standard deviation
        pooled_std = np.sqrt(((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2))

        # Cohen's d
        cohens_d = (group1.mean() - group2.mean()) / (pooled_std + 1e-8)

        return cohens_d

    def _interpret_cohens_d(self, d: float) -> str:
        """Interpret Cohen's d effect size"""
        abs_d = abs(d)
        if abs_d < 0.2:
            return 'negligible'
        elif abs_d < 0.5:
            return 'small'
        elif abs_d < 0.8:
            return 'medium'
        else:
            return 'large'

    def _calculate_eta_squared(self, groups: List[pd.Series]) -> float:
        """Calculate eta-squared for ANOVA"""
        try:
            # Combine all groups
            all_data = np.concatenate(groups)

            # Overall mean
            grand_mean = np.mean(all_data)

            # Between-group sum of squares
            ss_between = sum(len(group) * (np.mean(group) - grand_mean) ** 2 for group in groups)

            # Total sum of squares
            ss_total = sum((x - grand_mean) ** 2 for x in all_data)

            # Eta-squared
            eta_squared = ss_between / (ss_total + 1e-8)

            return eta_squared
        except Exception as e:
            logger.warning(f"⚠️ Eta-squared calculation failed: {e}")
            return 0.0

    def _power_analysis(self, df: pd.DataFrame, numerical_cols: List[str]) -> Dict[str, Any]:
        """Statistical power analysis"""
        results = {}

        if not STATSMODELS_AVAILABLE:
            return results

        for col in numerical_cols:
            data = df[col].dropna()
            n = len(data)

            if n >= self.min_sample_size:
                try:
                    # Calculate effect size (Cohen's d vs 0)
                    effect_size = abs(data.mean()) / (data.std() + 1e-8)

                    # Calculate power for two-tailed t-test
                    power = ttest_power(effect_size, n, alpha=self.alpha, alternative='two-sided')

                    results[col] = {
                        'sample_size': n,
                        'effect_size': float(effect_size),
                        'achieved_power': float(power),
                        'adequate_power': power >= 0.8
                    }
                except Exception as e:
                    logger.warning(f"⚠️ Power analysis failed for {col}: {e}")

        return results
