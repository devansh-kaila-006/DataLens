"""
Security monitoring and alerting system.
Tracks security events and provides threat detection.
"""

import logging
from datetime import datetime, timedelta
from typing import Dict, List, Any, Optional
from collections import defaultdict
from enum import Enum

class Severity(Enum):
    """Security event severity levels."""
    INFO = "info"
    WARNING = "warning"
    CRITICAL = "critical"
    FATAL = "fatal"

class SecurityEventType(Enum):
    """Types of security events."""
    # Rate limiting
    RATE_LIMIT_EXCEEDED = "rate_limit_exceeded"
    BURST_LIMIT_EXCEEDED = "burst_limit_exceeded"

    # Input validation
    INVALID_INPUT = "invalid_input"
    SQL_INJECTION_ATTEMPT = "sql_injection_attempt"
    XSS_ATTEMPT = "xss_attempt"
    COMMAND_INJECTION_ATTEMPT = "command_injection_attempt"
    PATH_TRAVERSAL_ATTEMPT = "path_traversal_attempt"

    # Authentication/Authorization
    AUTHENTICATION_FAILURE = "authentication_failure"
    UNAUTHORIZED_ACCESS = "unauthorized_access"
    BLOCKED_IP_ATTEMPT = "blocked_ip_attempt"

    # File operations
    SUSPICIOUS_FILE_UPLOAD = "suspicious_file_upload"
    FILE_TYPE_MISMATCH = "file_type_mismatch"
    MALICIOUS_CONTENT_DETECTED = "malicious_content_detected"

    # API abuse
    API_ABUSE = "api_abuse"
    SUSPICIOUS_PATTERN = "suspicious_pattern"
    ANOMALOUS_BEHAVIOR = "anomalous_behavior"

    # System events
    SYSTEM_ERROR = "system_error"
    SECURITY_VIOLATION = "security_violation"


class SecurityEvent:
    """Represents a single security event."""

    def __init__(
        self,
        event_type: SecurityEventType,
        severity: Severity,
        details: Dict[str, Any],
        ip_address: Optional[str] = None,
        user_id: Optional[str] = None,
        timestamp: Optional[datetime] = None
    ):
        self.event_type = event_type
        self.severity = severity
        self.details = details
        self.ip_address = ip_address or "unknown"
        self.user_id = user_id
        self.timestamp = timestamp or datetime.utcnow()

    def to_dict(self) -> Dict[str, Any]:
        """Convert event to dictionary."""
        return {
            'event_type': self.event_type.value,
            'severity': self.severity.value,
            'details': self.details,
            'ip_address': self.ip_address,
            'user_id': self.user_id,
            'timestamp': self.timestamp.isoformat()
        }


class SecurityAlert:
    """Represents a security alert that should be investigated."""

    def __init__(
        self,
        alert_type: str,
        severity: Severity,
        description: str,
        events: List[SecurityEvent],
        recommendations: List[str]
    ):
        self.alert_type = alert_type
        self.severity = severity
        self.description = description
        self.events = events
        self.recommendations = recommendations
        self.created_at = datetime.utcnow()

    def to_dict(self) -> Dict[str, Any]:
        """Convert alert to dictionary."""
        return {
            'alert_type': self.alert_type,
            'severity': self.severity.value,
            'description': self.description,
            'event_count': len(self.events),
            'events': [e.to_dict() for e in self.events],
            'recommendations': self.recommendations,
            'created_at': self.created_at.isoformat()
        }


class SecurityMonitor:
    """
    Monitor and analyze security events for threat detection.
    Implements anomaly detection and automated alerting.
    """

    def __init__(self, alert_threshold: int = 10):
        """
        Initialize security monitor.

        Args:
            alert_threshold: Number of events before triggering alerts
        """
        self.alert_threshold = alert_threshold
        self.events: List[SecurityEvent] = []
        self.alerts: List[SecurityAlert] = []
        self.blocked_ips: set = set()
        self.suspicious_users: set = set()

        # Event statistics
        self.event_counts: Dict[SecurityEventType, int] = defaultdict(int)
        self.ip_events: Dict[str, List[SecurityEvent]] = defaultdict(list)
        self.user_events: Dict[str, List[SecurityEvent]] = defaultdict(list)

        # Configure logging
        self.logger = logging.getLogger('security.monitor')
        self._setup_logging()

    def _setup_logging(self):
        """Configure security logging."""
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        self.logger.addHandler(handler)
        self.logger.setLevel(logging.WARNING)

    def log_event(self, event: SecurityEvent):
        """
        Log a security event and analyze for threats.

        Args:
            event: Security event to log
        """
        # Store event
        self.events.append(event)

        # Update statistics
        self.event_counts[event.event_type] += 1
        self.ip_events[event.ip_address].append(event)
        if event.user_id:
            self.user_events[event.user_id].append(event)

        # Log event
        self._log_event(event)

        # Analyze for threats
        self._analyze_event(event)

        # Generate alerts if needed
        self._check_alert_conditions(event)

    def _log_event(self, event: SecurityEvent):
        """Log event to appropriate log level."""
        log_message = f"[{event.event_type.value}] IP: {event.ip_address}"
        if event.user_id:
            log_message += f", User: {event.user_id}"
        log_message += f", Details: {event.details}"

        if event.severity == Severity.INFO:
            self.logger.info(log_message)
        elif event.severity == Severity.WARNING:
            self.logger.warning(log_message)
        elif event.severity == Severity.CRITICAL:
            self.logger.error(log_message)
        elif event.severity == Severity.FATAL:
            self.logger.critical(log_message)

    def _analyze_event(self, event: SecurityEvent):
        """
        Analyze event for threat patterns.

        Args:
            event: Event to analyze
        """
        # Check for repeated violations from same IP
        recent_ip_events = self._get_recent_events(
            self.ip_events[event.ip_address],
            minutes=5
        )

        if len(recent_ip_events) > self.alert_threshold:
            self.block_ip(event.ip_address, f"Exceeded alert threshold: {event.event_type.value}")

        # Check for attack patterns
        if self._detect_attack_pattern(event):
            self._generate_attack_alert(event)

    def _detect_attack_pattern(self, event: SecurityEvent) -> bool:
        """
        Detect if event indicates an attack pattern.

        Args:
            event: Event to analyze

        Returns:
            True if attack pattern detected
        """
        # Check for multiple injection attempts
        injection_events = [
            SecurityEventType.SQL_INJECTION_ATTEMPT,
            SecurityEventType.XSS_ATTEMPT,
            SecurityEventType.COMMAND_INJECTION_ATTEMPT,
            SecurityEventType.PATH_TRAVERSAL_ATTEMPT
        ]

        if event.event_type in injection_events:
            recent_events = self._get_recent_events(
                self.ip_events[event.ip_address],
                minutes=10
            )
            injection_count = sum(
                1 for e in recent_events
                if e.event_type in injection_events
            )
            return injection_count >= 3

        return False

    def _generate_attack_alert(self, event: SecurityEvent):
        """Generate alert for detected attack."""
        recent_events = self._get_recent_events(
            self.ip_events[event.ip_address],
            minutes=10
        )

        alert = SecurityAlert(
            alert_type="attack_detected",
            severity=event.severity,
            description=f"Potential cyber attack detected from IP: {event.ip_address}",
            events=recent_events,
            recommendations=[
                "Block IP address immediately",
                "Review all requests from this IP",
                "Consider implementing CAPTCHA",
                "Monitor for similar patterns from other IPs"
            ]
        )

        self.alerts.append(alert)
        self.logger.critical(f"SECURITY ALERT: {alert.description}")

    def _check_alert_conditions(self, event: SecurityEvent):
        """
        Check if alert conditions are met.

        Args:
            event: Event to check
        """
        # Check for repeated authentication failures
        if event.event_type == SecurityEventType.AUTHENTICATION_FAILURE:
            recent_auth_failures = [
                e for e in self.ip_events[event.ip_address]
                if e.event_type == SecurityEventType.AUTHENTICATION_FAILURE
                and e.timestamp > datetime.utcnow() - timedelta(minutes=15)
            ]

            if len(recent_auth_failures) >= 5:
                self._generate_auth_alert(event.ip_address, recent_auth_failures)

    def _generate_auth_alert(self, ip_address: str, events: List[SecurityEvent]):
        """Generate alert for authentication attack."""
        alert = SecurityAlert(
            alert_type="authentication_attack",
            severity=Severity.WARNING,
            description=f"Possible brute force attack from IP: {ip_address}",
            events=events,
            recommendations=[
                "Implement account lockout after failed attempts",
                "Add CAPTCHA for failed login attempts",
                "Monitor for successful login after failures"
            ]
        )

        self.alerts.append(alert)
        self.logger.warning(f"SECURITY ALERT: {alert.description}")

    def block_ip(self, ip_address: str, reason: str):
        """
        Block an IP address.

        Args:
            ip_address: IP address to block
            reason: Reason for blocking
        """
        self.blocked_ips.add(ip_address)
        self.logger.critical(f"IP BLOCKED: {ip_address} - Reason: {reason}")

    def is_ip_blocked(self, ip_address: str) -> bool:
        """
        Check if IP is blocked.

        Args:
            ip_address: IP address to check

        Returns:
            True if blocked
        """
        return ip_address in self.blocked_ips

    def _get_recent_events(
        self,
        events: List[SecurityEvent],
        minutes: int = 5
    ) -> List[SecurityEvent]:
        """
        Get events from recent time period.

        Args:
            events: List of events
            minutes: Time period in minutes

        Returns:
            List of recent events
        """
        cutoff = datetime.utcnow() - timedelta(minutes=minutes)
        return [e for e in events if e.timestamp > cutoff]

    def get_security_summary(self) -> Dict[str, Any]:
        """
        Get comprehensive security summary.

        Returns:
            Dictionary with security metrics
        """
        # Calculate stats for last 24 hours
        cutoff = datetime.utcnow() - timedelta(hours=24)
        recent_events = [e for e in self.events if e.timestamp > cutoff]

        severity_counts = defaultdict(int)
        for event in recent_events:
            severity_counts[event.severity.value] += 1

        return {
            'total_events_24h': len(recent_events),
            'events_by_severity': dict(severity_counts),
            'events_by_type': {
                event_type.value: count
                for event_type, count in self.event_counts.items()
            },
            'blocked_ips_count': len(self.blocked_ips),
            'active_alerts': len(self.alerts),
            'most_active_ips': self._get_most_active_ips(5),
            'suspicious_users': len(self.suspicious_users)
        }

    def _get_most_active_ips(self, limit: int = 5) -> List[Dict[str, Any]]:
        """
        Get IPs with most security events.

        Args:
            limit: Maximum number of IPs to return

        Returns:
            List of IP statistics
        """
        ip_stats = []
        for ip_address, events in self.ip_events.items():
            recent_events = self._get_recent_events(events, minutes=60)
            ip_stats.append({
                'ip_address': ip_address,
                'event_count_1h': len(recent_events),
                'total_events': len(events)
            })

        return sorted(ip_stats, key=lambda x: x['event_count_1h'], reverse=True)[:limit]

    def get_recent_alerts(self, limit: int = 10) -> List[Dict[str, Any]]:
        """
        Get recent security alerts.

        Args:
            limit: Maximum number of alerts to return

        Returns:
            List of alert dictionaries
        """
        return [alert.to_dict() for alert in self.alerts[-limit:]]

    def clear_old_events(self, hours: int = 24):
        """
        Clear events older than specified time.

        Args:
            hours: Hours to keep events
        """
        cutoff = datetime.utcnow() - timedelta(hours=hours)
        self.events = [e for e in self.events if e.timestamp > cutoff]
        self.logger.info(f"Cleared events older than {hours} hours")


# Global security monitor instance
security_monitor = SecurityMonitor(alert_threshold=10)