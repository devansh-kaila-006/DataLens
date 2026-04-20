"""
Comprehensive input validation and sanitization utilities.
Protects against SQL injection, XSS, command injection, and other attacks.
"""

import re
import html
import json
from typing import Any, Dict, List, Optional
from urllib.parse import unquote

# Security patterns for detecting attacks
SQL_INJECTION_PATTERNS = [
    r"(\bunion\b.*\bselect\b)",
    r"(\bor\b.*=.*\bor\b)",
    r"(\band\b.*=.*\band\b)",
    r"(\bdrop\b.*\btable\b)",
    r"(\bdelete\b.*\bfrom\b)",
    r"(\binsert\b.*\binto\b)",
    r"(\bupdate\b.*\bset\b)",
    r"(--|\#|;)",
    r"(\bexec\b|\bexecute\b)",
    r"(\'\s*=\s*\')",
    r"(\bxp_\w+)",
    r"(\bsp_\w+)",
    r"(1\s*=\s*1)",
    r"(1\s*=\s*1\s*--)",
]

XSS_PATTERNS = [
    r"<script[^>]*>.*?</script>",
    r"javascript:",
    r"onerror\s*=",
    r"onload\s*=",
    r"onclick\s*=",
    r"onmouseover\s*=",
    r"<iframe[^>]*>",
    r"<embed[^>]*>",
    r"<object[^>]*>",
    r"<link[^>]*>",
    r"<meta[^>]*>",
    r"fromCharCode",
    r"eval\s*\(",
    r"alert\s*\(",
    r"document\.cookie",
    r"window\.location",
    r"<.*?>",
]

COMMAND_INJECTION_PATTERNS = [
    r";\s*(ls|whoami|cat|rm|wget|curl|nc|netcat|ssh|ftp|telnet)",
    r"\|\s*(ls|whoami|cat|rm|wget|curl|nc|netcat|ssh|ftp|telnet)",
    r"&&\s*(ls|whoami|cat|rm|wget|curl|nc|netcat|ssh|ftp|telnet)",
    r"`[^`]*`",
    r"\$\(.*\)",
    r"\${.*}",
    r"\]\[.*\]\[",
]

PATH_TRAVERSAL_PATTERNS = [
    r"\.\./",
    r"\.\.\\"",
    r"\.\.\%2f",
    r"\.\.\%5c",
    r"%2e%2e",
    r"~/%2f",
    r"/etc/passwd",
    r"c:\\windows\\system32",
    r"\\.\\",
]


class InputValidator:
    """
    Comprehensive input validation and sanitization.
    """

    @staticmethod
    def validate_string(
        input_string: str,
        max_length: int = 1000,
        allow_empty: bool = False,
        field_name: str = "input"
    ) -> tuple[bool, Optional[str]]:
        """
        Validate a string input against common attacks.

        Args:
            input_string: String to validate
            max_length: Maximum allowed length
            allow_empty: Whether empty strings are allowed
            field_name: Name of the field for error messages

        Returns:
            Tuple of (is_valid, error_message)
        """
        if not input_string:
            if not allow_empty:
                return False, f"{field_name} cannot be empty"
            return True, None

        # Check length
        if len(input_string) > max_length:
            return False, f"{field_name} exceeds maximum length of {max_length}"

        # Check for null bytes
        if "\x00" in input_string:
            return False, f"{field_name} contains null bytes"

        # Check for SQL injection patterns
        for pattern in SQL_INJECTION_PATTERNS:
            if re.search(pattern, input_string, re.IGNORECASE):
                return False, f"{field_name} contains suspicious SQL pattern"

        # Check for XSS patterns
        for pattern in XSS_PATTERNS:
            if re.search(pattern, input_string, re.IGNORECASE):
                return False, f"{field_name} contains suspicious script pattern"

        # Check for command injection
        for pattern in COMMAND_INJECTION_PATTERNS:
            if re.search(pattern, input_string, re.IGNORECASE):
                return False, f"{field_name} contains command injection pattern"

        # Check for path traversal
        for pattern in PATH_TRAVERSAL_PATTERNS:
            if re.search(pattern, input_string, re.IGNORECASE):
                return False, f"{field_name} contains path traversal pattern"

        return True, None

    @staticmethod
    def sanitize_string(input_string: str) -> str:
        """
        Sanitize a string by removing dangerous characters.

        Args:
            input_string: String to sanitize

        Returns:
            Sanitized string
        """
        # HTML escape to prevent XSS
        sanitized = html.escape(input_string)

        # Remove null bytes
        sanitized = sanitized.replace("\x00", "")

        # Remove excessive whitespace
        sanitized = " ".join(sanitized.split())

        return sanitized

    @staticmethod
    def validate_dict(
        input_dict: Dict[str, Any],
        allowed_keys: Optional[List[str]] = None,
        max_size: int = 100,
        field_name: str = "input"
    ) -> tuple[bool, Optional[str]]:
        """
        Validate a dictionary input.

        Args:
            input_dict: Dictionary to validate
            allowed_keys: List of allowed keys (None = any keys allowed)
            max_size: Maximum number of keys
            field_name: Name of the field for error messages

        Returns:
            Tuple of (is_valid, error_message)
        """
        if not isinstance(input_dict, dict):
            return False, f"{field_name} must be a dictionary"

        # Check size
        if len(input_dict) > max_size:
            return False, f"{field_name} exceeds maximum size of {max_size} keys"

        # Check keys
        if allowed_keys:
            invalid_keys = set(input_dict.keys()) - set(allowed_keys)
            if invalid_keys:
                return False, f"{field_name} contains invalid keys: {invalid_keys}"

        # Validate string values
        for key, value in input_dict.items():
            if isinstance(value, str):
                is_valid, error = InputValidator.validate_string(
                    value,
                    max_length=1000,
                    field_name=key
                )
                if not is_valid:
                    return False, f"{field_name}.{key}: {error}"

        return True, None

    @staticmethod
    def validate_json(
        input_string: str,
        max_size: int = 10000,
        field_name: str = "json"
    ) -> tuple[bool, Optional[str], Optional[Dict]]:
        """
        Validate and parse JSON input.

        Args:
            input_string: JSON string to validate
            max_size: Maximum allowed size in bytes
            field_name: Name of the field for error messages

        Returns:
            Tuple of (is_valid, error_message, parsed_json)
        """
        try:
            # Check size
            if len(input_string) > max_size:
                return False, f"{field_name} exceeds maximum size of {max_size} bytes", None

            # Parse JSON
            parsed = json.loads(input_string)

            # Validate the parsed dict
            is_valid, error = InputValidator.validate_dict(
                parsed,
                max_size=100,
                field_name=field_name
            )

            if not is_valid:
                return False, error, None

            return True, None, parsed

        except json.JSONDecodeError as e:
            return False, f"{field_name} contains invalid JSON: {str(e)}", None

    @staticmethod
    def validate_email(email: str) -> tuple[bool, Optional[str]]:
        """
        Validate email address format.

        Args:
            email: Email address to validate

        Returns:
            Tuple of (is_valid, error_message)
        """
        # Basic email validation
        email_pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'

        if not re.match(email_pattern, email):
            return False, "Invalid email format"

        # Check for dangerous patterns
        is_valid, error = InputValidator.validate_string(
            email,
            max_length=254,
            field_name="email"
        )

        return is_valid, error

    @staticmethod
    def sanitize_filename(filename: str) -> str:
        """
        Sanitize filename to prevent path traversal and other attacks.

        Args:
            filename: Filename to sanitize

        Returns:
            Sanitized filename
        """
        # Remove path components
        filename = filename.split("/")[-1].split("\\")[-1]

        # Remove dangerous characters
        filename = re.sub(r'[<>:"|?*]', '', filename)

        # Remove control characters
        filename = re.sub(r'[\x00-\x1f\x7f]', '', filename)

        # Limit length
        filename = filename[:255]

        # Remove leading/trailing dots and spaces
        filename = filename.strip(". ")

        # If filename is empty after sanitization, use a default
        if not filename:
            filename = "sanitized_file"

        return filename

    @staticmethod
    def validate_url(url: str) -> tuple[bool, Optional[str]]:
        """
        Validate URL format and check for dangerous protocols.

        Args:
            url: URL to validate

        Returns:
            Tuple of (is_valid, error_message)
        """
        # Basic URL validation
        url_pattern = r'^https?://[^\s/$.?#].[^\s]*$'

        if not re.match(url_pattern, url):
            return False, "Invalid URL format"

        # Check for dangerous protocols
        dangerous_protocols = ['javascript:', 'data:', 'vbscript:', 'file:']
        url_lower = url.lower()
        for protocol in dangerous_protocols:
            if protocol in url_lower:
                return False, f"URL contains dangerous protocol: {protocol}"

        # Check for suspicious patterns
        is_valid, error = InputValidator.validate_string(
            url,
            max_length=2048,
            field_name="url"
        )

        return is_valid, error


def validate_and_sitize_input(
    input_data: Any,
    input_type: str = "string",
    field_name: str = "input"
) -> tuple[bool, Any, Optional[str]]:
    """
    Validate and sanitize input data.

    Args:
        input_data: Input data to validate
        input_type: Type of input (string, dict, json, email, url, filename)
        field_name: Name of the field for error messages

    Returns:
        Tuple of (is_valid, sanitized_data, error_message)
    """
    try:
        if input_type == "string":
            if not isinstance(input_data, str):
                return False, None, f"{field_name} must be a string"

            is_valid, error = InputValidator.validate_string(
                input_data,
                field_name=field_name
            )

            if not is_valid:
                return False, None, error

            sanitized = InputValidator.sanitize_string(input_data)
            return True, sanitized, None

        elif input_type == "dict":
            if not isinstance(input_data, dict):
                return False, None, f"{field_name} must be a dictionary"

            is_valid, error = InputValidator.validate_dict(
                input_data,
                field_name=field_name
            )

            if not is_valid:
                return False, None, error

            # Sanitize string values
            sanitized = {}
            for key, value in input_data.items():
                if isinstance(value, str):
                    sanitized[key] = InputValidator.sanitize_string(value)
                else:
                    sanitized[key] = value

            return True, sanitized, None

        elif input_type == "json":
            if not isinstance(input_data, str):
                return False, None, f"{field_name} must be a JSON string"

            return InputValidator.validate_json(
                input_data,
                field_name=field_name
            )

        elif input_type == "email":
            if not isinstance(input_data, str):
                return False, None, f"{field_name} must be a string"

            is_valid, error = InputValidator.validate_email(input_data)
            if not is_valid:
                return False, None, error

            sanitized = InputValidator.sanitize_string(input_data)
            return True, sanitized, None

        elif input_type == "url":
            if not isinstance(input_data, str):
                return False, None, f"{field_name} must be a string"

            is_valid, error = InputValidator.validate_url(input_data)
            if not is_valid:
                return False, None, error

            sanitized = InputValidator.sanitize_string(input_data)
            return True, sanitized, None

        elif input_type == "filename":
            if not isinstance(input_data, str):
                return False, None, f"{field_name} must be a string"

            # First validate as string
            is_valid, error = InputValidator.validate_string(
                input_data,
                max_length=255,
                field_name=field_name
            )

            if not is_valid:
                return False, None, error

            sanitized = InputValidator.sanitize_filename(input_data)
            return True, sanitized, None

        else:
            return False, None, f"Unknown input type: {input_type}"

    except Exception as e:
        return False, None, f"Error validating {field_name}: {str(e)}"