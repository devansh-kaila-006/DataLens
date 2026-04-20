"""
Security utilities for file upload validation and sanitization.
CRITICAL: This module implements security measures to prevent malicious file uploads.
"""
import magic
import re
import uuid
import logging
from pathlib import Path
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from collections import defaultdict

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


def validate_uuid(uuid_string: str) -> bool:
    """
    Validate UUID format to prevent injection attacks.

    Args:
        uuid_string: String to validate as UUID

    Returns:
        True if valid UUID format, False otherwise
    """
    try:
        uuid_obj = uuid.UUID(uuid_string)
        return str(uuid_obj) == uuid_string
    except ValueError:
        security_log('invalid_uuid', {'uuid': uuid_string})
        return False


class SecurityMonitor:
    """
    Monitor and track security events for threat detection.
    Implements basic anomaly detection and alerting.
    """

    def __init__(self, alert_threshold: int = 10):
        """
        Initialize security monitor.

        Args:
            alert_threshold: Number of suspicious events before alerting
        """
        self.alert_threshold = alert_threshold
        self.events: Dict[str, list] = defaultdict(list)
        self.blocked_ips: set = set()
        self.suspicious_patterns: Dict[str, int] = defaultdict(int)

    def log_event(
        self,
        event_type: str,
        details: Dict[str, Any],
        severity: str = "info",
        ip_address: str = None,
        user_id: str = None
    ):
        """
        Log a security event and check for anomalies.

        Args:
            event_type: Type of security event
            details: Event details
            severity: Event severity (info, warning, critical)
            ip_address: Optional IP address
            user_id: Optional user ID
        """
        timestamp = datetime.utcnow()

        event = {
            'timestamp': timestamp,
            'event_type': event_type,
            'severity': severity,
            'details': details,
            'ip_address': ip_address,
            'user_id': user_id
        }

        # Store event for analysis
        key = f"{ip_address or 'unknown'}_{event_type}"
        self.events[key].append(event)

        # Check for patterns indicating attacks
        self._check_for_anomalies(ip_address, event_type, severity)

        # Log event
        logger = logging.getLogger('security.monitor')
        log_method = {
            'info': logger.info,
            'warning': logger.warning,
            'critical': logger.critical
        }.get(severity, logger.info)

        log_method(f"Security Event: {event_type}", extra=event)

    def _check_for_anomalies(
        self,
        ip_address: str,
        event_type: str,
        severity: str
    ):
        """
        Check if recent events indicate suspicious activity.

        Args:
            ip_address: IP address to check
            event_type: Type of event
            severity: Event severity
        """
        if not ip_address:
            return

        now = datetime.utcnow()
        time_window = now - timedelta(minutes=5)

        # Count recent events from this IP
        key = f"{ip_address}_{event_type}"
        recent_events = [
            e for e in self.events[key]
            if e['timestamp'] > time_window
        ]

        # Check for suspicious patterns
        if len(recent_events) > self.alert_threshold:
            self.suspicious_patterns[event_type] += 1

            if severity == 'critical' or len(recent_events) > self.alert_threshold * 2:
                self.block_ip(ip_address, f"Exceeded {event_type} threshold")
                self.log_event(
                    'ip_blocked',
                    {'reason': f'Exceeded {event_type} threshold', 'count': len(recent_events)},
                    severity='critical',
                    ip_address=ip_address
                )

    def block_ip(self, ip_address: str, reason: str):
        """
        Block an IP address due to suspicious activity.

        Args:
            ip_address: IP address to block
            reason: Reason for blocking
        """
        self.blocked_ips.add(ip_address)
        logging.getLogger('security.monitor').critical(
            f"IP Blocked: {ip_address} - Reason: {reason}"
        )

    def is_ip_blocked(self, ip_address: str) -> bool:
        """
        Check if an IP address is blocked.

        Args:
            ip_address: IP address to check

        Returns:
            True if IP is blocked, False otherwise
        """
        return ip_address in self.blocked_ips

    def get_security_summary(self) -> Dict[str, Any]:
        """
        Get a summary of security events and status.

        Returns:
            Dictionary containing security metrics
        """
        total_events = sum(len(events) for events in self.events.values())
        critical_events = sum(
            1 for events in self.events.values()
            for event in events
            if event.get('severity') == 'critical'
        )

        return {
            'total_events': total_events,
            'critical_events': critical_events,
            'blocked_ips': len(self.blocked_ips),
            'suspicious_patterns': dict(self.suspicious_patterns),
            'most_common_events': self._get_most_common_events(5)
        }

    def _get_most_common_events(self, limit: int = 5) -> list:
        """
        Get the most common event types.

        Args:
            limit: Maximum number of event types to return

        Returns:
            List of (event_type, count) tuples
        """
        event_counts = defaultdict(int)
        for events in self.events.values():
            for event in events:
                event_type = event['event_type']
                event_counts[event_type] += 1

        return sorted(
            event_counts.items(),
            key=lambda x: x[1],
            reverse=True
        )[:limit]


# Global security monitor instance
security_monitor = SecurityMonitor(alert_threshold=10)
