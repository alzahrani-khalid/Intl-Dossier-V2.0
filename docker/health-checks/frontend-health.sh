#!/bin/bash

# Frontend service health check
# Returns 0 if healthy, 1 if unhealthy

set -e

# Configuration
SERVICE_URL="${SERVICE_URL:-http://localhost:5173}"
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

# Check if the frontend server is responding
check_endpoint "/" 200

# Check if static assets are being served
check_endpoint "/assets/index.js" 200

# Check if the app can reach the API (via proxy or env config)
# This would be configured in vite.config.ts proxy settings
check_endpoint "/api/health" 200

echo "Frontend health check passed"
exit 0