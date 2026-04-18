"""
Security utilities for file upload validation and sanitization.
CRITICAL: This module implements security measures to prevent malicious file uploads.
"""
import magic
import re
import uuid
from pathlib import Path
from typing import Optional

# Allowed MIME types for file uploads
ALLOWED_MIME_TYPES = [
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
]

# Maximum file size (50MB)
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB in bytes


def validate_file_type(file_path: str) -> bool:
    """
    Validate file MIME type (not just extension!).
    Uses python-magic to detect real file type.

    Args:
        file_path: Path to the file to validate

    Returns:
        True if file type is allowed, False otherwise
    """
    try:
        mime = magic.from_file(file_path, mime=True)
        return mime in ALLOWED_MIME_TYPES
    except Exception as e:
        # Log error for security monitoring
        security_log('file_type_validation_failed', {'error': str(e), 'file': file_path})
        return False


def validate_file_size(file_size: int) -> bool:
    """
    Validate file size is within limits.

    Args:
        file_size: Size of the file in bytes

    Returns:
        True if file size is within limits, False otherwise
    """
    return file_size <= MAX_FILE_SIZE


def sanitize_filename(filename: str) -> str:
    """
    Sanitize filename to prevent path traversal attacks.
    Generates a safe storage name using UUID.

    Args:
        filename: Original filename

    Returns:
        Sanitized filename safe for storage
    """
    # Remove path separators
    filename = Path(filename).name

    # Remove dangerous characters
    filename = re.sub(r'[<>:"/\\|?*]', '', filename)

    # Limit length
    filename = filename[:255]

    # Generate safe storage name
    safe_name = f"{uuid.uuid4()}_{filename}"

    return safe_name


def validate_file_content(file_path: str) -> bool:
    """
    Scan file content for malicious patterns.
    Checks for suspicious content that might indicate attacks.

    Args:
        file_path: Path to the file to validate

    Returns:
        True if file content appears safe, False otherwise
    """
    try:
        with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
            # Read first 1000 lines to check for suspicious content
            for i, line in enumerate(f):
                if i > 1000:  # Only check first 1000 lines
                    break

                # Check for script tags or suspicious patterns
                if '<script' in line.lower():
                    security_log('suspicious_content', {'pattern': 'script_tag', 'file': file_path})
                    return False

                if 'javascript:' in line.lower():
                    security_log('suspicious_content', {'pattern': 'javascript_protocol', 'file': file_path})
                    return False

        return True
    except Exception as e:
        security_log('content_validation_error', {'error': str(e), 'file': file_path})
        return False


def security_log(event_type: str, details: dict, user_id: Optional[str] = None):
    """
    Log security events for monitoring.
    In production, this should send to a logging service.

    Args:
        event_type: Type of security event
        details: Event details
        user_id: Optional user ID
    """
    import logging
    from datetime import datetime

    security_logger = logging.getLogger('security')

    log_entry = {
        'timestamp': datetime.utcnow().isoformat(),
        'event_type': event_type,
        'user_id': user_id,
        'details': details
    }

    security_logger.warning(log_entry)
