"""
Data Profiler Module
Handles file download, validation, and initial data profiling.
"""
import os
import logging
import pandas as pd
import numpy as np
from typing import Dict, Any, Tuple
import chardet
import mimetypes
from io import BytesIO

logger = logging.getLogger(__name__)


class FileProfiler:
    """Handles file validation and initial profiling."""

    ALLOWED_MIME_TYPES = [
        'text/csv',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]

    MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB

    def __init__(self, supabase_client):
        """
        Initialize file profiler.

        Args:
            supabase_client: Supabase client instance
        """
        self.supabase = supabase_client

    def download_file_from_storage(self, file_path: str) -> BytesIO:
        """
        Download file from Supabase Storage.

        Args:
            file_path: Path in Supabase Storage

        Returns:
            BytesIO object containing file data

        Raises:
            Exception: If download fails
        """
        try:
            logger.info(f"Downloading file from storage: {file_path}")
            response = self.supabase.storage.from_('uploads').download(file_path)
            return BytesIO(response)
        except Exception as e:
            logger.error(f"Failed to download file: {e}")
            raise

    def validate_file_type(self, file_data: BytesIO, file_path: str) -> Tuple[bool, str]:
        """
        Validate file type using file extension.

        Args:
            file_data: File data as BytesIO
            file_path: File path to check extension

        Returns:
            Tuple of (is_valid, detected_mime_type)
        """
        try:
            file_data.seek(0)
            # Use mimetypes for cross-platform compatibility
            mime, _ = mimetypes.guess_type(file_path)
            if not mime:
                # Fallback to basic validation based on file extension
                if file_path.endswith('.csv'):
                    mime = 'text/csv'
                elif file_path.endswith(('.xls', '.xlsx')):
                    mime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                else:
                    mime = "unknown"

            file_data.seek(0)

            is_valid = mime in self.ALLOWED_MIME_TYPES
            logger.info(f"Detected MIME type: {mime}, Valid: {is_valid}")

            return is_valid, mime
        except Exception as e:
            logger.error(f"File type validation error: {e}")
            return False, "unknown"

    def detect_encoding(self, file_data: BytesIO) -> str:
        """
        Detect file encoding for CSV files.

        Args:
            file_data: File data as BytesIO

        Returns:
            Detected encoding string
        """
        try:
            file_data.seek(0)
            raw_data = file_data.read(10000)  # Read first 10KB
            result = chardet.detect(raw_data)
            file_data.seek(0)

            encoding = result.get('encoding', 'utf-8')
            logger.info(f"Detected encoding: {encoding} (confidence: {result.get('confidence', 0):.2f})")

            return encoding
        except Exception as e:
            logger.error(f"Encoding detection error: {e}")
            return 'utf-8'

    def read_file(self, file_data: BytesIO, file_path: str) -> pd.DataFrame:
        """
        Read file into DataFrame based on extension.

        Args:
            file_data: File data as BytesIO
            file_path: Original file path to determine type

        Returns:
            Pandas DataFrame

        Raises:
            Exception: If file cannot be read
        """
        try:
            file_ext = os.path.splitext(file_path)[1].lower()

            if file_ext == '.csv':
                encoding = self.detect_encoding(file_data)
                df = pd.read_csv(file_data, encoding=encoding)
            elif file_ext in ['.xlsx', '.xls']:
                df = pd.read_excel(file_data)
            else:
                raise ValueError(f"Unsupported file extension: {file_ext}")

            logger.info(f"Successfully read file: {df.shape[0]} rows, {df.shape[1]} columns")
            return df

        except Exception as e:
            logger.error(f"Error reading file: {e}")
            raise

    def create_data_profile(self, df: pd.DataFrame) -> Dict[str, Any]:
        """
        Create initial data profile.

        Args:
            df: Input DataFrame

        Returns:
            Dictionary with data profile
        """
        try:
            profile = {
                'row_count': len(df),
                'column_count': len(df.columns),
                'columns': list(df.columns),
                'memory_usage_mb': df.memory_usage(deep=True).sum() / (1024 * 1024),
                'duplicate_rows': int(df.duplicated().sum()),
                'column_types': self._detect_column_types(df),
                'missing_values': self._analyze_missing_values(df)
            }

            logger.info(f"Created profile: {profile['row_count']} rows, {profile['column_count']} columns")
            return profile

        except Exception as e:
            logger.error(f"Error creating profile: {e}")
            raise

    def _detect_column_types(self, df: pd.DataFrame) -> Dict[str, str]:
        """
        Detect column types.

        Args:
            df: Input DataFrame

        Returns:
            Dictionary mapping column names to types
        """
        column_types = {}

        for col in df.columns:
            # Check if numeric
            if pd.api.types.is_numeric_dtype(df[col]):
                column_types[col] = 'numerical'
            # Check if datetime
            elif pd.api.types.is_datetime64_any_dtype(df[col]):
                column_types[col] = 'datetime'
            # Check if boolean
            elif pd.api.types.is_bool_dtype(df[col]):
                column_types[col] = 'boolean'
            # Default to categorical
            else:
                # Check cardinality
                unique_count = df[col].nunique()
                total_count = len(df)

                # High cardinality = text, low cardinality = categorical
                if unique_count / total_count > 0.5:
                    column_types[col] = 'text'
                else:
                    column_types[col] = 'categorical'

        return column_types

    def _analyze_missing_values(self, df: pd.DataFrame) -> Dict[str, int]:
        """
        Analyze missing values per column.

        Args:
            df: Input DataFrame

        Returns:
            Dictionary mapping column names to missing count
        """
        missing = df.isnull().sum()
        return {col: int(count) for col, count in missing.items() if count > 0}

    def detect_time_columns(self, df: pd.DataFrame) -> list:
        """
        Detect columns with date/time data.

        Args:
            df: Input DataFrame

        Returns:
            List of column names identified as time columns
        """
        time_cols = []
        time_keywords = ['date', 'time', 'timestamp', 'year', 'month', 'day', 'hour', 'minute', 'second']

        for col in df.columns:
            col_lower = col.lower()

            # Check column name for time-related keywords
            if any(keyword in col_lower for keyword in time_keywords):
                time_cols.append(col)
                continue

            # Try parsing as datetime
            try:
                # Sample first 100 non-null values
                sample = df[col].dropna().head(100)
                if len(sample) > 0:
                    pd.to_datetime(sample)
                    # If successful and it's an object column (string dates), mark as time column
                    if df[col].dtype == 'object':
                        time_cols.append(col)
            except (ValueError, TypeError):
                # Not a time column
                pass

        return time_cols