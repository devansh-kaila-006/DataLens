"""
Quick test to verify rate limiting is working
"""
import requests
import time
from datetime import datetime

# Test configuration
RAILWAY_DATA_PROCESSOR = "https://datalens-production.up.railway.app"
VALID_JOB_ID = "550e8400-e29b-41d4-a716-446655440000"

print("Quick Rate Limiting Test")
print("=" * 50)
print(f"Target: {RAILWAY_DATA_PROCESSOR}/process")
print(f"Starting test at {datetime.now()}")
print("-" * 50)

# Make 10 rapid requests
print("\nMaking 10 rapid requests to test rate limiting...")
rate_limited = False

for i in range(10):
    try:
        start = time.time()
        response = requests.post(
            f"{RAILWAY_DATA_PROCESSOR}/process",
            json={"job_id": VALID_JOB_ID},
            timeout=10
        )
        elapsed = time.time() - start

        print(f"Request {i+1}: {response.status_code} ({elapsed:.2f}s)")

        if response.status_code == 429:
            rate_limited = True
            print(f"  -> Rate limited! Response: {response.json()}")
            print(f"  -> Headers: {dict(response.headers)}")
            break

        # Small delay between requests
        time.sleep(0.5)

    except Exception as e:
        print(f"Request {i+1}: Error - {str(e)}")

print("\n" + "=" * 50)
if rate_limited:
    print("✓ RATE LIMITING IS WORKING!")
else:
    print("✗ Rate limiting not detected in 10 requests")
    print("  (This might be expected if the limit is higher than 10 req/min)")

print(f"Test completed at {datetime.now()}")