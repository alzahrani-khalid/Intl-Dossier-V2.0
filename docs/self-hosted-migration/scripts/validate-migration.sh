#!/bin/bash
# validate-migration.sh
# Comprehensive validation script for self-hosted Supabase migration
# Usage: ./validate-migration.sh [--pre-check|--env-check|--db-check|--full]

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Counters
PASSED=0
FAILED=0
WARNINGS=0

# Default mode
MODE="full"

# Parse arguments
if [[ $# -gt 0 ]]; then
  MODE=$1
fi

# Helper functions
print_header() {
  echo ""
  echo -e "${BLUE}═══════════════════════════════════════${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}═══════════════════════════════════════${NC}"
}

print_test() {
  echo -e "\n${YELLOW}Testing: $1${NC}"
}

pass() {
  echo -e "${GREEN}✓ PASS:${NC} $1"
  PASSED=$((PASSED + 1))
}

fail() {
  echo -e "${RED}✗ FAIL:${NC} $1"
  FAILED=$((FAILED + 1))
}

warn() {
  echo -e "${YELLOW}⚠ WARNING:${NC} $1"
  WARNINGS=$((WARNINGS + 1))
}

# Check if command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Pre-migration checks
pre_migration_checks() {
  print_header "Pre-Migration Checks"

  # Check Docker
  print_test "Docker installation"
  if command_exists docker; then
    DOCKER_VERSION=$(docker --version | awk '{print $3}' | sed 's/,//')
    pass "Docker installed (version $DOCKER_VERSION)"
  else
    fail "Docker not installed"
  fi

  # Check Docker Compose
  print_test "Docker Compose installation"
  if command_exists docker && docker compose version >/dev/null 2>&1; then
    COMPOSE_VERSION=$(docker compose version | awk '{print $4}')
    pass "Docker Compose installed (version $COMPOSE_VERSION)"
  else
    fail "Docker Compose not installed"
  fi

  # Check disk space
  print_test "Disk space"
  DISK_AVAIL=$(df -h / | tail -1 | awk '{print $4}' | sed 's/G//')
  if (( $(echo "$DISK_AVAIL > 100" | bc -l) )); then
    pass "Sufficient disk space (${DISK_AVAIL}GB available)"
  else
    warn "Low disk space (${DISK_AVAIL}GB available, recommend >100GB)"
  fi

  # Check memory
  print_test "System memory"
  MEM_TOTAL=$(free -g | awk '/^Mem:/{print $2}')
  if [ "$MEM_TOTAL" -ge 16 ]; then
    pass "Sufficient memory (${MEM_TOTAL}GB)"
  else
    warn "Low memory (${MEM_TOTAL}GB, recommend 16GB+)"
  fi

  # Check if Supabase directory exists
  print_test "Supabase deployment directory"
  if [ -d "$HOME/supabase/supabase/docker" ]; then
    pass "Supabase directory found"
  else
    fail "Supabase directory not found at $HOME/supabase/supabase/docker"
  fi
}

# Environment checks
environment_checks() {
  print_header "Environment Configuration Checks"

  PROJECT_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)

  # Check environment files exist
  print_test "Environment files existence"
  ENV_FILES=(
    "frontend/.env.example"
    "backend/.env.example"
    "mobile/.env.example"
  )

  for file in "${ENV_FILES[@]}"; do
    if [ -f "$PROJECT_ROOT/$file" ]; then
      pass "$file exists"
    else
      fail "$file not found"
    fi
  done

  # Check for old Supabase cloud references
  print_test "Old Supabase cloud references"
  OLD_REF="zkrcjzdemdmwhearhfgg"
  OLD_REFS=$(grep -r "$OLD_REF" "$PROJECT_ROOT" \
    --exclude-dir={node_modules,.git,dist,build,.next} \
    --exclude="*.backup" \
    2>/dev/null | wc -l || echo "0")

  if [ "$OLD_REFS" -eq "0" ]; then
    pass "No old cloud references found"
  else
    warn "$OLD_REFS old cloud references still present"
    echo "  Run: grep -r '$OLD_REF' . --exclude-dir={node_modules,.git,dist,build}"
  fi

  # Check environment variables are set
  print_test "Environment variables"
  if [ -f "$PROJECT_ROOT/frontend/.env.local" ]; then
    if grep -q "VITE_SUPABASE_URL" "$PROJECT_ROOT/frontend/.env.local"; then
      SUPABASE_URL=$(grep "VITE_SUPABASE_URL" "$PROJECT_ROOT/frontend/.env.local" | cut -d '=' -f2)
      if [[ "$SUPABASE_URL" == *"supabase.co"* ]]; then
        warn "Frontend still using Supabase cloud URL"
      else
        pass "Frontend using self-hosted URL: $SUPABASE_URL"
      fi
    else
      fail "VITE_SUPABASE_URL not found in frontend/.env.local"
    fi
  else
    warn "frontend/.env.local not found (copy from .env.example)"
  fi
}

# Database checks
database_checks() {
  print_header "Database Checks"

  # Check if Docker containers are running
  print_test "Supabase services status"
  if docker ps --format '{{.Names}}' | grep -q "supabase-db"; then
    pass "Supabase containers are running"
  else
    fail "Supabase containers not running (run: docker compose up -d)"
    return
  fi

  # Check database connectivity
  print_test "PostgreSQL connectivity"
  if docker compose exec -T db pg_isready -U postgres >/dev/null 2>&1; then
    pass "PostgreSQL is ready"
  else
    fail "PostgreSQL is not responding"
    return
  fi

  # Check database version
  print_test "PostgreSQL version"
  PG_VERSION=$(docker compose exec -T db psql -U postgres -t -c "SELECT version();" | head -1)
  if [[ "$PG_VERSION" == *"PostgreSQL"* ]]; then
    pass "PostgreSQL version: $(echo $PG_VERSION | awk '{print $2}')"
  else
    fail "Could not determine PostgreSQL version"
  fi

  # Check extensions
  print_test "PostgreSQL extensions"
  EXTENSIONS=("pgvector" "pg_trgm" "uuid-ossp" "pg_stat_statements")
  for ext in "${EXTENSIONS[@]}"; do
    if docker compose exec -T db psql -U postgres -t -c "SELECT 1 FROM pg_extension WHERE extname='$ext';" | grep -q 1; then
      pass "Extension $ext installed"
    else
      fail "Extension $ext not installed"
    fi
  done

  # Check table count
  print_test "Database tables"
  TABLE_COUNT=$(docker compose exec -T db psql -U postgres -t -c "
    SELECT COUNT(*)
    FROM pg_tables
    WHERE schemaname NOT IN ('pg_catalog', 'information_schema');" | tr -d ' ')

  if [ "$TABLE_COUNT" -gt 50 ]; then
    pass "Found $TABLE_COUNT tables (migration appears successful)"
  elif [ "$TABLE_COUNT" -gt 0 ]; then
    warn "Found only $TABLE_COUNT tables (verify migration completed)"
  else
    fail "No tables found (database migration not complete)"
  fi

  # Check RLS policies
  print_test "Row Level Security policies"
  RLS_COUNT=$(docker compose exec -T db psql -U postgres -t -c "
    SELECT COUNT(*)
    FROM pg_policies;" | tr -d ' ')

  if [ "$RLS_COUNT" -gt 10 ]; then
    pass "Found $RLS_COUNT RLS policies"
  else
    warn "Found only $RLS_COUNT RLS policies (expected more)"
  fi

  # Check database size
  print_test "Database size"
  DB_SIZE=$(docker compose exec -T db psql -U postgres -t -c "
    SELECT pg_size_pretty(pg_database_size('postgres'));" | tr -d ' ')
  pass "Database size: $DB_SIZE"
}

# Service health checks
service_checks() {
  print_header "Service Health Checks"

  SERVICES=("rest" "auth" "realtime" "storage")

  for service in "${SERVICES[@]}"; do
    print_test "$service service"
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8000/$service/v1/health" 2>/dev/null || echo "000")

    if [ "$HTTP_CODE" = "200" ]; then
      pass "$service is healthy"
    else
      fail "$service returned HTTP $HTTP_CODE"
    fi
  done

  # Check Edge Functions
  print_test "Edge Functions runtime"
  if docker ps --format '{{.Names}}' | grep -q "supabase-functions"; then
    pass "Edge Functions container running"
  else
    fail "Edge Functions container not running"
  fi

  # Check Studio
  print_test "Supabase Studio"
  if docker ps --format '{{.Names}}' | grep -q "supabase-studio"; then
    STUDIO_CODE=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000" 2>/dev/null || echo "000")
    if [ "$STUDIO_CODE" = "200" ]; then
      pass "Studio is accessible"
    else
      warn "Studio returned HTTP $STUDIO_CODE"
    fi
  else
    warn "Studio container not running"
  fi
}

# Performance checks
performance_checks() {
  print_header "Performance Checks"

  # Check connection count
  print_test "Database connections"
  CONNECTIONS=$(docker compose exec -T db psql -U postgres -t -c "
    SELECT COUNT(*) FROM pg_stat_activity;" | tr -d ' ')
  if [ "$CONNECTIONS" -lt 50 ]; then
    pass "Connection count: $CONNECTIONS (healthy)"
  elif [ "$CONNECTIONS" -lt 80 ]; then
    warn "Connection count: $CONNECTIONS (monitor closely)"
  else
    fail "Connection count: $CONNECTIONS (too high!)"
  fi

  # Check cache hit ratio
  print_test "Cache hit ratio"
  CACHE_RATIO=$(docker compose exec -T db psql -U postgres -t -c "
    SELECT ROUND(sum(heap_blks_hit) / NULLIF(sum(heap_blks_hit) + sum(heap_blks_read), 0) * 100, 2)
    FROM pg_statio_user_tables;" | tr -d ' ' || echo "0")

  if (( $(echo "$CACHE_RATIO > 90" | bc -l 2>/dev/null) )); then
    pass "Cache hit ratio: ${CACHE_RATIO}% (excellent)"
  elif (( $(echo "$CACHE_RATIO > 80" | bc -l 2>/dev/null) )); then
    pass "Cache hit ratio: ${CACHE_RATIO}% (good)"
  else
    warn "Cache hit ratio: ${CACHE_RATIO}% (consider increasing shared_buffers)"
  fi

  # Check for slow queries
  print_test "Slow queries"
  SLOW_QUERIES=$(docker compose exec -T db psql -U postgres -t -c "
    SELECT COUNT(*)
    FROM pg_stat_statements
    WHERE mean_exec_time > 100;" | tr -d ' ' 2>/dev/null || echo "N/A")

  if [ "$SLOW_QUERIES" = "N/A" ]; then
    warn "pg_stat_statements not available"
  elif [ "$SLOW_QUERIES" -eq "0" ]; then
    pass "No slow queries detected"
  else
    warn "$SLOW_QUERIES queries averaging >100ms (review with: SELECT query, mean_exec_time FROM pg_stat_statements WHERE mean_exec_time > 100 LIMIT 10;)"
  fi
}

# Print summary
print_summary() {
  echo ""
  print_header "Validation Summary"
  echo ""
  echo -e "  ${GREEN}Passed:   $PASSED${NC}"
  echo -e "  ${YELLOW}Warnings: $WARNINGS${NC}"
  echo -e "  ${RED}Failed:   $FAILED${NC}"
  echo ""

  if [ $FAILED -eq 0 ] && [ $WARNINGS -eq 0 ]; then
    echo -e "${GREEN}✓ All checks passed! Migration validated successfully.${NC}"
    exit 0
  elif [ $FAILED -eq 0 ]; then
    echo -e "${YELLOW}⚠ Validation complete with warnings. Review above.${NC}"
    exit 0
  else
    echo -e "${RED}✗ Validation failed. Fix critical issues before proceeding.${NC}"
    exit 1
  fi
}

# Main execution
case $MODE in
  --pre-check)
    pre_migration_checks
    ;;
  --env-check)
    environment_checks
    ;;
  --db-check)
    database_checks
    service_checks
    ;;
  --full)
    pre_migration_checks
    environment_checks
    database_checks
    service_checks
    performance_checks
    ;;
  *)
    echo "Usage: $0 [--pre-check|--env-check|--db-check|--full]"
    echo ""
    echo "Options:"
    echo "  --pre-check   Check infrastructure prerequisites"
    echo "  --env-check   Check environment configuration"
    echo "  --db-check    Check database and services"
    echo "  --full        Run all checks (default)"
    exit 1
    ;;
esac

print_summary
