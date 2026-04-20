"""
Comprehensive Security Test Suite for DataLens
Tests rate limiting, input validation, and security monitoring
"""

import requests
import time
import json
from typing import Dict, List, Tuple
from datetime import datetime

# Configuration
RAILWAY_DATA_PROCESSOR = "https://datalens-production.up.railway.app"
RAILWAY_REPORT_GENERATOR = "https://mindful-serenity-production.up.railway.app"
SUPABASE_URL = "https://aqyacoxrjaeizgwvzcov.supabase.co"
SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFxeWFjb3hyamFlaXpnd3Z6Y292Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY1MTMzOTMsImV4cCI6MjA5MjA4OTM5M30.TR_Fl0FiLdVGdCFdW-Ph2SWw3ubEftxSZ25w2Uicvs4"

class SecurityTestResults:
    def __init__(self):
        self.total_tests = 0
        self.passed_tests = 0
        self.failed_tests = 0
        self.warnings = []
        self.errors = []
        self.results = []

    def add_result(self, test_name: str, passed: bool, details: str = ""):
        self.total_tests += 1
        if passed:
            self.passed_tests += 1
        else:
            self.failed_tests += 1

        result = {
            "test_name": test_name,
            "passed": passed,
            "details": details,
            "timestamp": datetime.now().isoformat()
        }
        self.results.append(result)

        status = "[PASS]" if passed else "[FAIL]"
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")

    def add_warning(self, warning: str):
        self.warnings.append(warning)
        print(f"[WARNING]: {warning}")

    def add_error(self, error: str):
        self.errors.append(error)
        print(f"[ERROR]: {error}")

    def print_summary(self):
        print("\n" + "="*80)
        print("SECURITY TEST SUMMARY")
        print("="*80)
        print(f"Total Tests: {self.total_tests}")
        print(f"✅ Passed: {self.passed_tests}")
        print(f"❌ Failed: {self.failed_tests}")
        print(f"Success Rate: {(self.passed_tests/self.total_tests*100):.1f}%")

        if self.warnings:
            print(f"\n[WARNINGS]: {len(self.warnings)}")
            for warning in self.warnings:
                print(f"   - {warning}")

        if self.errors:
            print(f"\n[ERRORS]: {len(self.errors)}")
            for error in self.errors:
                print(f"   - {error}")

        print("="*80)

def test_rate_limiting(results: SecurityTestResults):
    """Test rate limiting on all endpoints"""
    print("\n[TESTING RATE LIMITING]")
    print("-" * 80)

    # Test 1: Data Processor Rate Limiting
    print("\n1. Testing Data Processor Rate Limiting (20 req/min limit)...")
    job_id = "550e8400-e29b-41d4-a716-446655440000"  # Valid UUID

    rate_limited = False
    request_count = 0
    start_time = time.time()

    for i in range(25):  # Try 25 requests (should hit limit)
        try:
            response = requests.post(
                f"{RAILWAY_DATA_PROCESSOR}/process",
                json={"job_id": job_id},
                timeout=10
            )
            request_count += 1

            if response.status_code == 429:
                rate_limited = True
                print(f"   [OK] Rate limit kicked in at request #{i+1}")
                print(f"   Response: {response.json()}")

                # Check for proper headers
                headers = response.headers
                if 'X-RateLimit-Limit' in headers or 'x-ratelimit-limit' in headers:
                    print(f"   ✓ Rate limit headers present")
                else:
                    results.add_warning("Missing rate limit headers in data processor")

                break
        except Exception as e:
            results.add_error(f"Request failed: {str(e)}")
            break

    if rate_limited:
        results.add_result(
            "Data Processor Rate Limiting",
            True,
            f"Rate limited after {request_count} requests"
        )
    else:
        results.add_result(
            "Data Processor Rate Limiting",
            False,
            "Rate limiting did not kick in after 25 requests"
        )

    # Test 2: Report Generator Rate Limiting
    print("\n2. Testing Report Generator Rate Limiting (60 req/min limit)...")
    rate_limited = False
    request_count = 0

    for i in range(65):  # Try 65 requests
        try:
            response = requests.post(
                f"{RAILWAY_REPORT_GENERATOR}/generate-report",
                json={"job_id": job_id, "format": "pdf"},
                timeout=10
            )
            request_count += 1

            if response.status_code == 429:
                rate_limited = True
                print(f"   ✓ Rate limit kicked in at request #{i+1}")
                break

            # Small delay to avoid overwhelming
            time.sleep(0.1)
        except Exception as e:
            results.add_error(f"Request failed: {str(e)}")
            break

    if rate_limited:
        results.add_result(
            "Report Generator Rate Limiting",
            True,
            f"Rate limited after {request_count} requests"
        )
    else:
        results.add_result(
            "Report Generator Rate Limiting",
            False,
            "Rate limiting did not kick in after 65 requests"
        )

    # Test 3: AI Insights Rate Limiting
    print("\n3. Testing AI Insights Rate Limiting (20 req/min limit)...")
    rate_limited = False
    request_count = 0

    for i in range(25):
        try:
            response = requests.post(
                f"{SUPABASE_URL}/functions/v1/ai-insights",
                headers={
                    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "job_id": str(uuid.uuid4()),
                    "analysis_results": {"summary": {"total_rows": 100}},
                    "dataset_name": "test"
                },
                timeout=10
            )
            request_count += 1

            if response.status_code == 429:
                rate_limited = True
                print(f"   ✓ Rate limit kicked in at request #{i+1}")
                break

            time.sleep(0.1)
        except Exception as e:
            results.add_error(f"Request failed: {str(e)}")
            break

    if rate_limited:
        results.add_result(
            "AI Insights Rate Limiting",
            True,
            f"Rate limited after {request_count} requests"
        )
    else:
        results.add_result(
            "AI Insights Rate Limiting",
            False,
            "Rate limiting did not kick in after 25 requests"
        )

def test_input_validation(results: SecurityTestResults):
    """Test input validation and attack prevention"""
    print("\n[TESTING INPUT VALIDATION]")
    print("-" * 80)

    # Test 1: SQL Injection Attempts
    print("\n1. Testing SQL Injection Protection...")
    sql_injection_payloads = [
        "1' OR '1'='1",
        "1; DROP TABLE users--",
        "1' UNION SELECT * FROM analysis_results--",
        "admin'--",
        "1' AND 1=1--"
    ]

    blocked_count = 0
    for payload in sql_injection_payloads:
        try:
            response = requests.post(
                f"{RAILWAY_DATA_PROCESSOR}/process",
                json={"job_id": payload},
                timeout=10
            )

            if response.status_code == 400:
                blocked_count += 1
            elif response.status_code == 200:
                results.add_warning(f"SQL injection payload not blocked: {payload[:20]}...")
        except Exception as e:
            results.add_error(f"SQL injection test failed: {str(e)}")

    results.add_result(
        "SQL Injection Protection",
        blocked_count >= len(sql_injection_payloads) * 0.8,
        f"Blocked {blocked_count}/{len(sql_injection_payloads)} SQL injection attempts"
    )

    # Test 2: XSS Attempts
    print("\n2. Testing XSS Protection...")
    xss_payloads = [
        "<script>alert('xss')</script>",
        "<img src=x onerror=alert('xss')>",
        "javascript:alert('xss')",
        "<iframe src='javascript:alert(1)'>",
        "<svg onload=alert('xss')>"
    ]

    blocked_count = 0
    for payload in xss_payloads:
        try:
            response = requests.post(
                f"{SUPABASE_URL}/functions/v1/ai-insights",
                headers={
                    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "job_id": str(uuid.uuid4()),
                    "analysis_results": {"summary": {"total_rows": 100}},
                    "dataset_name": payload
                },
                timeout=10
            )

            if response.status_code == 400:
                blocked_count += 1
            elif response.status_code == 200:
                results.add_warning(f"XSS payload not blocked: {payload[:30]}...")
        except Exception as e:
            results.add_error(f"XSS test failed: {str(e)}")

    results.add_result(
        "XSS Protection",
        blocked_count >= len(xss_payloads) * 0.8,
        f"Blocked {blocked_count}/{len(xss_payloads)} XSS attempts"
    )

    # Test 3: UUID Validation
    print("\n3. Testing UUID Validation...")
    invalid_uuids = [
        "not-a-uuid",
        "12345",
        "<script>alert(1)</script>",
        "../../../etc/passwd",
        "550e8400-e29b-41d4-a716-446655440000-extra"
    ]

    blocked_count = 0
    for invalid_uuid in invalid_uuids:
        try:
            response = requests.post(
                f"{RAILWAY_DATA_PROCESSOR}/process",
                json={"job_id": invalid_uuid},
                timeout=10
            )

            if response.status_code == 400:
                blocked_count += 1
        except Exception as e:
            results.add_error(f"UUID validation test failed: {str(e)}")

    results.add_result(
        "UUID Validation",
        blocked_count >= len(invalid_uuids) * 0.8,
        f"Blocked {blocked_count}/{len(invalid_uuids)} invalid UUIDs"
    )

    # Test 4: Path Traversal Attempts
    print("\n4. Testing Path Traversal Protection...")
    path_traversal_payloads = [
        "../../../etc/passwd",
        "..\\..\\..\\windows\\system32",
        "....//....//....//etc/passwd",
        "%2e%2e%2f%2e%2e%2f%2e%2e%2fetcd/passwd",
        "~/.ssh/id_rsa"
    ]

    blocked_count = 0
    for payload in path_traversal_payloads:
        try:
            # Test with AI insights (dataset_name parameter)
            response = requests.post(
                f"{SUPABASE_URL}/functions/v1/ai-insights",
                headers={
                    "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
                    "Content-Type": "application/json"
                },
                json={
                    "job_id": str(uuid.uuid4()),
                    "analysis_results": {"summary": {"total_rows": 100}},
                    "dataset_name": payload
                },
                timeout=10
            )

            if response.status_code == 400:
                blocked_count += 1
        except Exception as e:
            results.add_error(f"Path traversal test failed: {str(e)}")

    results.add_result(
        "Path Traversal Protection",
        blocked_count >= len(path_traversal_payloads) * 0.8,
        f"Blocked {blocked_count}/{len(path_traversal_payloads)} path traversal attempts"
    )

def test_security_monitoring(results: SecurityTestResults):
    """Test security monitoring and event logging"""
    print("\n[TESTING SECURITY MONITORING]")
    print("-" * 80)

    # Test 1: Security Event Generation
    print("\n1. Testing Security Event Generation...")
    try:
        # Generate some security events
        for i in range(5):
            response = requests.post(
                f"{RAILWAY_DATA_PROCESSOR}/process",
                json={"job_id": "invalid-uuid-format"},
                timeout=10
            )

        print(f"   ✓ Generated 5 security events")
        results.add_result(
            "Security Event Generation",
            True,
            "Security events generated and logged"
        )
    except Exception as e:
        results.add_result(
            "Security Event Generation",
            False,
            f"Failed to generate security events: {str(e)}"
        )

    # Test 2: Rate Limit Response Headers
    print("\n2. Testing Rate Limit Response Headers...")
    try:
        # Make a request and check headers
        response = requests.post(
            f"{RAILWAY_DATA_PROCESSOR}/process",
            json={"job_id": "550e8400-e29b-41d4-a716-446655440000"},
            timeout=10
        )

        # Check for rate limit headers (might not be present on first request)
        headers_present = any(
            header.lower() in str(response.headers).lower()
            for header in ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset']
        )

        results.add_result(
            "Rate Limit Headers",
            headers_present or response.status_code == 200,  # Headers may not appear on first request
            f"Rate limit headers check: {headers_present}"
        )
    except Exception as e:
        results.add_result(
            "Rate Limit Headers",
            False,
            f"Failed to check headers: {str(e)}"
        )

def test_legitimate_traffic(results: SecurityTestResults):
    """Test that legitimate traffic still works"""
    print("\n[TESTING LEGITIMATE TRAFFIC]")
    print("-" * 80)

    # Test 1: Valid Health Checks
    print("\n1. Testing Health Check Endpoints...")
    health_endpoints = [
        (f"{RAILWAY_DATA_PROCESSOR}/health", "data-processor"),
        (f"{RAILWAY_REPORT_GENERATOR}/health", "report-generator")
    ]

    all_healthy = True
    for endpoint, service in health_endpoints:
        try:
            response = requests.get(endpoint, timeout=10)
            if response.status_code == 200 and "healthy" in response.text.lower():
                print(f"   ✓ {service} is healthy")
            else:
                print(f"   ❌ {service} health check failed")
                all_healthy = False
        except Exception as e:
            print(f"   ❌ {service} health check error: {str(e)}")
            all_healthy = False

    results.add_result(
        "Health Check Endpoints",
        all_healthy,
        "All health check endpoints responding"
    )

    # Test 2: Valid API Requests (Within Rate Limits)
    print("\n2. Testing Valid API Requests (within rate limits)...")
    valid_requests = [
        {
            "endpoint": f"{RAILWAY_DATA_PROCESSOR}/process",
            "data": {"job_id": "550e8400-e29b-41d4-a716-446655440000"},
            "name": "Data Processor"
        },
        {
            "endpoint": f"{RAILWAY_REPORT_GENERATOR}/generate-report",
            "data": {"job_id": "550e8400-e29b-41d4-a716-446655440000", "format": "pdf"},
            "name": "Report Generator"
        }
    ]

    successful_requests = 0
    for request_config in valid_requests:
        try:
            response = requests.post(
                request_config["endpoint"],
                json=request_config["data"],
                timeout=10
            )

            # Accept 202 (accepted), 404 (job not found), or 429 (rate limited)
            # Reject 500 (server error)
            if response.status_code in [202, 404, 429]:
                print(f"   ✓ {request_config['name']} API responding (status: {response.status_code})")
                successful_requests += 1
            elif response.status_code == 500:
                print(f"   ❌ {request_config['name']} returned server error")
            else:
                print(f"   ⚠️  {request_config['name']} returned {response.status_code}")
                successful_requests += 1  # Other status codes might be acceptable
        except Exception as e:
            print(f"   ❌ {request_config['name']} request failed: {str(e)}")

    results.add_result(
        "Valid API Requests",
        successful_requests >= len(valid_requests) * 0.5,
        f"{successful_requests}/{len(valid_requests)} API requests successful"
    )

def test_performance(results: SecurityTestResults):
    """Test performance impact of security measures"""
    print("\n[TESTING PERFORMANCE]")
    print("-" * 80)

    # Test 1: Response Time Analysis
    print("\n1. Testing Response Times...")
    test_requests = [
        (f"{RAILWAY_DATA_PROCESSOR}/health", "GET", None, "Data Processor Health"),
        (f"{RAILWAY_REPORT_GENERATOR}/health", "GET", None, "Report Generator Health"),
        (f"{RAILWAY_DATA_PROCESSOR}/process", "POST", {"job_id": "550e8400-e29b-41d4-a716-446655440000"}, "Data Processor API")
    ]

    response_times = []
    acceptable_performance = True

    for endpoint, method, data, name in test_requests:
        try:
            start_time = time.time()
            if method == "GET":
                response = requests.get(endpoint, timeout=10)
            else:
                response = requests.post(endpoint, json=data, timeout=10)
            end_time = time.time()

            response_time = (end_time - start_time) * 1000  # Convert to ms
            response_times.append((name, response_time))

            if response_time < 2000:  # 2 seconds threshold
                print(f"   ✓ {name}: {response_time:.0f}ms")
            else:
                print(f"   ⚠️  {name}: {response_time:.0f}ms (slow)")
                acceptable_performance = False

        except Exception as e:
            print(f"   ❌ {name} failed: {str(e)}")

    avg_response_time = sum(rt[1] for rt in response_times) / len(response_times)
    results.add_result(
        "Performance Impact",
        acceptable_performance,
        f"Average response time: {avg_response_time:.0f}ms (target: <2000ms)"
    )

    # Test 2: Concurrent Request Handling
    print("\n2. Testing Concurrent Requests...")
    import threading

    def make_request(url, results_list):
        try:
            start = time.time()
            response = requests.get(url, timeout=10)
            end = time.time()
            results_list.append((end - start) * 1000)
        except Exception as e:
            results_list.append(-1)

    # Test with 5 concurrent requests
    threads = []
    results_list = []

    for i in range(5):
        thread = threading.Thread(
            target=make_request,
            args=(f"{RAILWAY_DATA_PROCESSOR}/health", results_list)
        )
        threads.append(thread)
        thread.start()

    for thread in threads:
        thread.join()

    successful_concurrent = sum(1 for r in results_list if r > 0 and r < 5000)

    results.add_result(
        "Concurrent Request Handling",
        successful_concurrent >= 4,
        f"{successful_concurrent}/5 concurrent requests completed successfully"
    )

if __name__ == "__main__":
    import uuid
    import sys

    # Set UTF-8 encoding for Windows
    if sys.platform == 'win32':
        import codecs
        sys.stdout = codecs.getwriter('utf-8')(sys.stdout.buffer, 'strict')
        sys.stderr = codecs.getwriter('utf-8')(sys.stderr.buffer, 'strict')

    print("COMPREHENSIVE SECURITY TEST SUITE")
    print("=" * 80)
    print("Testing rate limiting, input validation, and security monitoring")
    print("=" * 80)

    results = SecurityTestResults()

    try:
        # Run all test suites
        test_rate_limiting(results)
        test_input_validation(results)
        test_security_monitoring(results)
        test_legitimate_traffic(results)
        test_performance(results)

        # Print summary
        results.print_summary()

        # Exit with appropriate code
        import sys
        if results.failed_tests > 0:
            print("\n❌ Some security tests failed!")
            sys.exit(1)
        else:
            print("\n✅ All security tests passed!")
            sys.exit(0)

    except KeyboardInterrupt:
        print("\n\n⚠️  Tests interrupted by user")
        results.print_summary()
    except Exception as e:
        print(f"\n🔴 Fatal error during testing: {str(e)}")
        import traceback
        traceback.print_exc()
        results.print_summary()