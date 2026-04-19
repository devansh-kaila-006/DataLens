"""
JSON Serialization Utilities
Handle conversion of NumPy types and special float values for JSON serialization.
"""
import json
import numpy as np
import pandas as pd
from typing import Any


def convert_to_json_serializable(obj: Any) -> Any:
    """
    Convert NumPy types and special float values to JSON-serializable types.

    Args:
        obj: Object to convert

    Returns:
        JSON-serializable version of the object
    """
    if isinstance(obj, dict):
        return {key: convert_to_json_serializable(value) for key, value in obj.items()}
    elif isinstance(obj, list):
        return [convert_to_json_serializable(item) for item in obj]
    elif isinstance(obj, tuple):
        return tuple(convert_to_json_serializable(item) for item in obj)
    elif isinstance(obj, (np.integer, np.int64, np.int32)):
        return int(obj)
    elif isinstance(obj, (np.floating, np.float64, np.float32)):
        if np.isinf(obj) or np.isnan(obj):
            return None  # Replace infinity and NaN with null
        return float(obj)
    elif isinstance(obj, (np.bool_, bool)):
        return bool(obj)
    elif isinstance(obj, np.ndarray):
        return convert_to_json_serializable(obj.tolist())
    elif isinstance(obj, pd.Series):
        return convert_to_json_serializable(obj.tolist())
    elif isinstance(obj, pd.DataFrame):
        return convert_to_json_serializable(obj.to_dict())
    elif pd.isna(obj):
        return None
    else:
        return obj


def to_json_safe(obj: Any) -> str:
    """
    Convert object to JSON string, handling NumPy types and special values.

    Args:
        obj: Object to convert to JSON

    Returns:
        JSON string
    """
    serializable_obj = convert_to_json_serializable(obj)
    return json.dumps(serializable_obj)
