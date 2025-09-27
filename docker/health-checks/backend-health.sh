#!/bin/bash

# Backend service health check
# Returns 0 if healthy, 1 if unhealthy

set -e

# Configuration
SERVICE_URL="${SERVICE_URL:-http://localhost:3000}"
TIMEOUT="${HEALTH_CHECK_TIMEOUT:-5}"
MAX_RETRIES="${HEALTH_CHECK_RETRIES:-3}"

# Function to check endpoint
check_endpoint() {
    local endpoint=$1
    local expected_status=${2:-200}
    
    response=$(curl -s -o /dev/null -w "%{http_code}" \
        --max-time "$TIMEOUT" \
        --retry "$MAX_RETRIES" \
        "$SERVICE_URL$endpoint" || echo "000")
    
    if [ "$response" = "$expected_status" ]; then
        return 0
    else
        echo "Health check failed: $endpoint returned $response (expected $expected_status)" >&2
        return 1
    fi
}

# Check main health endpoint
check_endpoint "/monitoring/health" 200

# Check database connectivity (should be included in health endpoint)
if ! check_endpoint "/monitoring/health" 200; then
    echo "Backend health check failed" >&2
    exit 1
fi

# Check critical dependencies
# These should return 200 even if degraded (with degraded status in response body)
check_endpoint "/api/status" 200

echo "Backend health check passed"
exit 0