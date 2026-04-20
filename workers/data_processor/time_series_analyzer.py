"""
Time Series Analyzer Module

Comprehensive time series analysis including:
- Trend detection (linear, polynomial, Mann-Kendall)
- Seasonality analysis
- Stationarity testing (ADF, KPSS)
- Time series decomposition (STL)
- Autocorrelation (ACF, PACF)
- Rolling statistics
- Forecasting (ARIMA, exponential smoothing, moving average)
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Tuple, Any, Optional
import logging

logger = logging.getLogger(__name__)

try:
    from statsmodels.tsa.seasonal import STL
    from statsmodels.tsa.stattools import adfuller, kpss, acf, pacf
    from statsmodels.tsa.arima.model import ARIMA
    from statsmodels.tsa.holtwinters import ExponentialSmoothing
    from scipy import stats
    STATSMODELS_AVAILABLE = True
except ImportError:
    logger.warning("statsmodels or scipy not available - time series analysis will be limited")
    STATSMODELS_AVAILABLE = False

try:
    from pymannkendall import original_test
    PM_AVAILABLE = True
except ImportError:
    logger.warning("pymannkendall not available - Mann-Kendall test will not be available")
    PM_AVAILABLE = False


class TimeSeriesAnalyzer:
    """Comprehensive time series analysis including trends, seasonality, stationarity, and forecasting"""

    def __init__(self, min_periods: int = 10):
        """
        Initialize Time Series Analyzer

        Args:
            min_periods: Minimum number of observations required for analysis
        """
        self.min_periods = min_periods

    def analyze_time_series(
        self,
        df: pd.DataFrame,
        time_col: str,
        value_cols: List[str]
    ) -> Dict[str, Any]:
        """
        Perform comprehensive time series analysis on multiple columns

        Args:
            df: Input dataframe
            time_col: Name of the time/date column
            value_cols: List of numerical columns to analyze

        Returns:
            dict: Complete time series analysis results including:
                - metadata (time range, frequency, regularity)
                - trend analysis (linear, polynomial, Mann-Kendall)
                - stationarity tests (ADF, KPSS)
                - seasonal decomposition (STL)
                - autocorrelation (ACF, PACF)
                - rolling statistics
        """
        if not STATSMODELS_AVAILABLE:
            return self._fallback_response(df, time_col, value_cols)

        try:
            # Prepare time series data
            ts_df = self._prepare_time_series(df, time_col, value_cols)

            # Extract metadata
            metadata = self._extract_metadata(ts_df, time_col)

            # Analyze each column
            analysis = {}
            for col in value_cols:
                if col in ts_df.columns and pd.api.types.is_numeric_dtype(ts_df[col]):
                    series = ts_df[col].dropna()

                    if len(series) >= self.min_periods:
                        try:
                            analysis[col] = {
                                'trend_analysis': self._analyze_trend(series),
                                'stationarity': self._test_stationarity(series),
                                'seasonality': self._analyze_seasonality(series, metadata.get('inferred_frequency')),
                                'decomposition': self._decompose_time_series(series, metadata.get('inferred_frequency')),
                                'autocorrelation': self._compute_autocorrelation(series),
                                'rolling_statistics': self._compute_rolling_stats(series)
                            }
                            logger.info(f"✅ Time series analysis complete for {col}")
                        except Exception as e:
                            logger.warning(f"⚠️ Failed to analyze {col}: {e}")
                            analysis[col] = {'error': str(e)}

            return {
                'metadata': metadata,
                'analysis': analysis
            }

        except Exception as e:
            logger.error(f"❌ Time series analysis failed: {e}")
            return {'error': str(e)}

    def forecast_time_series(
        self,
        series: pd.Series,
        method: str = 'arima',
        forecast_periods: int = 12
    ) -> Dict[str, Any]:
        """
        Generate forecasts using specified method

        Args:
            series: Time series data
            method: 'arima', 'exponential_smoothing', 'moving_average'
            forecast_periods: Number of periods to forecast

        Returns:
            dict: Forecast with confidence intervals and accuracy metrics
        """
        if not STATSMODELS_AVAILABLE:
            return {'error': 'statsmodels not available'}

        try:
            series = series.dropna()

            if method == 'arima':
                return self._forecast_arima(series, forecast_periods)
            elif method == 'exponential_smoothing':
                return self._forecast_exponential_smoothing(series, forecast_periods)
            elif method == 'moving_average':
                return self._forecast_moving_average(series, forecast_periods)
            else:
                return {'error': f'Unknown forecasting method: {method}'}

        except Exception as e:
            logger.error(f"❌ Forecast failed for {method}: {e}")
            return {'error': str(e)}

    def _prepare_time_series(
        self,
        df: pd.DataFrame,
        time_col: str,
        value_cols: List[str]
    ) -> pd.DataFrame:
        """Prepare time series data with proper datetime index"""
        try:
            ts_df = df[[time_col] + value_cols].copy()

            # Convert to datetime
            ts_df[time_col] = pd.to_datetime(ts_df[time_col], errors='coerce')

            # Set as index
            ts_df = ts_df.set_index(time_col)

            # Sort by time
            ts_df = ts_df.sort_index()

            return ts_df
        except Exception as e:
            logger.error(f"❌ Failed to prepare time series: {e}")
            raise

    def _extract_metadata(self, ts_df: pd.DataFrame, time_col: str) -> Dict[str, Any]:
        """Extract time series metadata"""
        try:
            freq = pd.infer_freq(ts_df.index)
            is_regular = freq is not None

            return {
                'time_column': time_col,
                'start_date': ts_df.index.min().isoformat() if len(ts_df) > 0 else None,
                'end_date': ts_df.index.max().isoformat() if len(ts_df) > 0 else None,
                'inferred_frequency': freq,
                'is_regular': is_regular,
                'n_observations': len(ts_df)
            }
        except Exception as e:
            logger.warning(f"⚠️ Failed to extract metadata: {e}")
            return {
                'time_column': time_col,
                'inferred_frequency': None,
                'is_regular': False,
                'n_observations': len(ts_df)
            }

    def _analyze_trend(self, series: pd.Series) -> Dict[str, Any]:
        """Analyze trend using linear regression and Mann-Kendall test"""
        try:
            x = np.arange(len(series))
            y = series.values

            # Linear trend
            slope, intercept, r_value, p_value, std_err = stats.linregress(x, y)

            result = {
                'linear': {
                    'slope': float(slope),
                    'intercept': float(intercept),
                    'r_squared': float(r_value ** 2),
                    'p_value': float(p_value),
                    'is_significant': p_value < 0.05
                }
            }

            # Mann-Kendall trend test (if available)
            if PM_AVAILABLE:
                try:
                    mk_result = self._mann_kendall_test(y)
                    result['mann_kendall'] = mk_result
                except Exception as e:
                    logger.warning(f"⚠️ Mann-Kendall test failed: {e}")

            return result

        except Exception as e:
            logger.warning(f"⚠️ Trend analysis failed: {e}")
            return {'error': str(e)}

    def _mann_kendall_test(self, data: np.ndarray) -> Dict[str, Any]:
        """Mann-Kendall trend test"""
        try:
            result = original_test(data)

            return {
                'trend': result.h,
                'p_value': float(result.p),
                'z_statistic': float(result.z),
                'is_significant': result.p < 0.05
            }
        except Exception as e:
            logger.warning(f"⚠️ Mann-Kendall test failed: {e}")
            return {'error': str(e)}

    def _test_stationarity(self, series: pd.Series) -> Dict[str, Any]:
        """Test stationarity using ADF and KPSS tests"""
        try:
            # Augmented Dickey-Fuller test
            adf_result = adfuller(series, autolag='AIC')

            # KPSS test
            kpss_result = kpss(series, regression='c', nlags='auto')

            return {
                'adf': {
                    'statistic': float(adf_result[0]),
                    'p_value': float(adf_result[1]),
                    'critical_values': {k: float(v) for k, v in adf_result[4].items()},
                    'is_stationary': adf_result[1] < 0.05
                },
                'kpss': {
                    'statistic': float(kpss_result[0]),
                    'p_value': float(kpss_result[1]),
                    'critical_values': {k: float(v) for k, v in kpss_result[3].items()},
                    'is_stationary': kpss_result[1] > 0.05
                }
            }
        except Exception as e:
            logger.warning(f"⚠️ Stationarity tests failed: {e}")
            return {'error': str(e)}

    def _analyze_seasonality(self, series: pd.Series, freq: Optional[str]) -> Dict[str, Any]:
        """Detect and analyze seasonal patterns"""
        try:
            if freq is None or len(series) < 24:
                return {'has_seasonality': False, 'reason': 'Insufficient data or no frequency'}

            period = self._get_seasonal_period(freq)

            try:
                # STL decomposition
                stl = STL(series, period=period)
                result = stl.fit()

                # Test if seasonal component is significant
                seasonal_strength = np.abs(result.seasonal).mean() / (np.abs(series).mean() + 1e-8)

                return {
                    'has_seasonality': seasonal_strength > 0.1,
                    'seasonal_strength': float(seasonal_strength),
                    'period': period
                }
            except Exception as e:
                return {'has_seasonality': False, 'error': str(e)}

        except Exception as e:
            logger.warning(f"⚠️ Seasonality analysis failed: {e}")
            return {'error': str(e)}

    def _decompose_time_series(self, series: pd.Series, freq: Optional[str]) -> Dict[str, Any]:
        """Decompose time series into trend, seasonal, and residual components"""
        try:
            period = self._get_seasonal_period(freq) if freq else None

            if period is None or len(series) < 2 * period:
                return {'error': 'Insufficient data for decomposition'}

            stl = STL(series, period=period)
            result = stl.fit()

            return {
                'trend': result.trend.tolist(),
                'seasonal': result.seasonal.tolist(),
                'residual': result.resid.tolist(),
                'period': period
            }
        except Exception as e:
            logger.warning(f"⚠️ Decomposition failed: {e}")
            return {'error': str(e)}

    def _compute_autocorrelation(self, series: pd.Series) -> Dict[str, Any]:
        """Compute ACF and PACF"""
        try:
            n_lags = min(20, len(series) - 1)

            acf_values, confint = acf(series, nlags=n_lags, alpha=0.05, fft=True)
            pacf_values = pacf(series, nlags=n_lags)

            return {
                'acf': acf_values.tolist(),
                'pacf': pacf_values.tolist(),
                'acf_confint_lower': confint[:, 0].tolist(),
                'acf_confint_upper': confint[:, 1].tolist(),
                'n_lags': n_lags
            }
        except Exception as e:
            logger.warning(f"⚠️ Autocorrelation computation failed: {e}")
            return {'error': str(e)}

    def _compute_rolling_stats(self, series: pd.Series) -> Dict[str, Any]:
        """Compute rolling statistics"""
        try:
            windows = [7, 30] if len(series) >= 30 else [max(3, len(series) // 10)]

            rolling_stats = {}
            for window in windows:
                if len(series) >= window:
                    rolling = series.rolling(window=window)
                    rolling_stats[f'window_{window}'] = {
                        'mean': rolling.mean().tolist(),
                        'std': rolling.std().tolist()
                    }

            return rolling_stats
        except Exception as e:
            logger.warning(f"⚠️ Rolling statistics computation failed: {e}")
            return {'error': str(e)}

    def _forecast_arima(self, series: pd.Series, periods: int) -> Dict[str, Any]:
        """ARIMA forecasting"""
        try:
            # Fit ARIMA model
            model = ARIMA(series, order=(1, 1, 1))
            fitted_model = model.fit()

            # Generate forecast
            forecast = fitted_model.get_forecast(steps=periods)
            forecast_mean = forecast.predicted_mean
            conf_int = forecast.conf_int()

            # Calculate accuracy metrics on training data
            predictions = fitted_model.fittedvalues
            mae = np.abs(series - predictions).mean()
            rmse = np.sqrt(((series - predictions) ** 2).mean())

            return {
                'method': 'arima',
                'forecast': forecast_mean.tolist(),
                'lower_bound': conf_int.iloc[:, 0].tolist(),
                'upper_bound': conf_int.iloc[:, 1].tolist(),
                'accuracy_metrics': {
                    'mae': float(mae),
                    'rmse': float(rmse)
                }
            }
        except Exception as e:
            logger.warning(f"⚠️ ARIMA forecast failed: {e}")
            return {'error': str(e)}

    def _forecast_exponential_smoothing(self, series: pd.Series, periods: int) -> Dict[str, Any]:
        """Exponential smoothing forecasting"""
        try:
            model = ExponentialSmoothing(series, trend='add', seasonal=None)
            fitted_model = model.fit()

            forecast = fitted_model.forecast(steps=periods)

            return {
                'method': 'exponential_smoothing',
                'forecast': forecast.tolist(),
                'fitted': fitted_model.fittedvalues.tolist()
            }
        except Exception as e:
            logger.warning(f"⚠️ Exponential smoothing forecast failed: {e}")
            return {'error': str(e)}

    def _forecast_moving_average(self, series: pd.Series, periods: int) -> Dict[str, Any]:
        """Simple moving average forecast"""
        try:
            window = max(3, len(series) // 10)
            ma = series.rolling(window=window).mean()
            forecast = [ma.iloc[-1]] * periods

            return {
                'method': 'moving_average',
                'forecast': forecast,
                'window': window
            }
        except Exception as e:
            logger.warning(f"⚠️ Moving average forecast failed: {e}")
            return {'error': str(e)}

    def _get_seasonal_period(self, freq: str) -> Optional[int]:
        """Map frequency to seasonal period"""
        freq_map = {
            'D': 7,      # Weekly seasonality for daily data
            'W': 52,     # Yearly for weekly
            'M': 12,     # Yearly for monthly
            'Q': 4,      # Yearly for quarterly
            'H': 24,     # Daily for hourly
            'min': 60,   # Hourly for minutely
            'T': 60,     # Hourly for minutely (alternative)
        }
        return freq_map.get(freq)

    def _fallback_response(self, df: pd.DataFrame, time_col: str, value_cols: List[str]) -> Dict[str, Any]:
        """Return fallback response when statsmodels is not available"""
        return {
            'metadata': {
                'time_column': time_col,
                'inferred_frequency': None,
                'is_regular': False,
                'n_observations': len(df),
                'error': 'statsmodels not available'
            },
            'analysis': {},
            'error': 'statsmodels library is required for time series analysis'
        }
