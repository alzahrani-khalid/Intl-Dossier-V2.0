#!/bin/bash

# Monitoring stack health check (Prometheus, Grafana, AlertManager)
# Returns 0 if healthy, 1 if unhealthy

set -e

# Configuration
PROMETHEUS_URL="${PROMETHEUS_URL:-http://localhost:9090}"
GRAFANA_URL="${GRAFANA_URL:-http://localhost:3000}"
ALERTMANAGER_URL="${ALERTMANAGER_URL:-http://localhost:9093}"
TIMEOUT="${HEALTH_CHECK_TIMEOUT:-5}"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track overall health
HEALTH_STATUS=0

# Function to check service health
check_service() {
    local service_name=$1
    local health_url=$2
    local expected_status=${3:-200}
    
    echo -n "Checking $service_name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" \
        --max-time "$TIMEOUT" \
        "$health_url" || echo "000")
    
    if [ "$response" = "$expected_status" ]; then
        echo -e "${GREEN}✓${NC} Healthy (HTTP $response)"
        return 0
    else
        echo -e "${RED}✗${NC} Unhealthy (HTTP $response)"
        HEALTH_STATUS=1
        return 1
    fi
}

echo "=== Monitoring Stack Health Check ==="

# Check Prometheus
check_service "Prometheus" "$PROMETHEUS_URL/-/healthy" 200

# Check if Prometheus is collecting metrics
if [ $? -eq 0 ]; then
    targets_up=$(curl -s "$PROMETHEUS_URL/api/v1/targets" | \
        grep -o '"health":"up"' | wc -l)
    echo "  └─ Active targets: $targets_up"
fi

# Check Grafana
check_service "Grafana" "$GRAFANA_URL/api/health" 200

# Check AlertManager
check_service "AlertManager" "$ALERTMANAGER_URL/-/healthy" 200

# Check if AlertManager cluster is formed (if multiple instances)
if [ $? -eq 0 ]; then
    cluster_status=$(curl -s "$ALERTMANAGER_URL/api/v1/status" | \
        grep -o '"name":"[^"]*"' | wc -l)
    echo "  └─ Cluster members: $cluster_status"
fi

echo "=================================="

if [ $HEALTH_STATUS -eq 0 ]; then
    echo -e "${GREEN}All monitoring services are healthy${NC}"
    exit 0
else
    echo -e "${RED}Some monitoring services are unhealthy${NC}"
    exit 1
fi