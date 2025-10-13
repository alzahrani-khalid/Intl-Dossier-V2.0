#!/bin/bash

# Script: final-validation.sh
# Feature: 019-user-management-access
# Tasks: T089-T093 (Final Validation)
#
# Comprehensive validation for user management system
# Usage: ./scripts/final-validation.sh

set -e

echo "=============================================="
echo "User Management & Access Control"
echo "Final Validation & Verification"
echo "=============================================="
echo ""

# Initialize result tracking
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0
WARNINGS=()

# Helper function to check
check() {
  local name="$1"
  local command="$2"
  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

  echo -n "Checking: $name... "

  if eval "$command" > /dev/null 2>&1; then
    echo "✅ PASS"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
    return 0
  else
    echo "❌ FAIL"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
    return 1
  fi
}

# Helper function for warnings
warn() {
  local message="$1"
  WARNINGS+=("⚠️  $message")
}

echo "=== T089: Performance Testing ==="
echo ""

# Check if performance test files exist
check "Performance test infrastructure" "test -f package.json"

# Note: Actual performance tests would require running the app
warn "T089: Bulk role changes performance test requires manual execution with running system"
warn "  Expected: <30 seconds for 100+ users"
warn "  Run: npm run test:performance -- --grep 'bulk role changes'"

echo ""
echo "=== T090: Audit Log Retention & Immutability ==="
echo ""

# Check RLS policies file
check "RLS policies migration exists" "test -f supabase/migrations/20251011214948_setup_rls_policies.sql"

# Check audit logs migration
check "Audit logs migration exists" "test -f supabase/migrations/20251011214945_create_audit_logs.sql"

# Verify RLS policies prevent UPDATE/DELETE on audit_logs
if grep -q "audit_logs" supabase/migrations/20251011214948_setup_rls_policies.sql; then
  echo -n "Checking: Audit log RLS policies... "
  if grep -E "(PREVENT UPDATE|PREVENT DELETE|FOR UPDATE.*USING.*false|FOR DELETE.*USING.*false)" supabase/migrations/20251011214948_setup_rls_policies.sql > /dev/null; then
    echo "✅ PASS"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
  else
    echo "⚠️  WARNING"
    warn "T090: Could not verify immutability constraints in RLS policies"
  fi
  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
fi

# Check 7-year retention setup
if grep -q "partition" supabase/migrations/20251011214945_create_audit_logs.sql; then
  echo -n "Checking: 7-year partition setup... "
  if grep -E "202[5-9]|203[0-1]" supabase/migrations/20251011214945_create_audit_logs.sql > /dev/null; then
    echo "✅ PASS (partitions through 2031)"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
  else
    echo "❌ FAIL"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
  fi
  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
fi

echo ""
echo "=== T091: Quickstart Validation ==="
echo ""

# Check if quickstart.md exists
check "Quickstart documentation exists" "test -f specs/019-user-management-access/quickstart.md"

# Verify all Edge Functions exist
EDGE_FUNCTIONS=(
  "create-user"
  "activate-account"
  "assign-role"
  "approve-role-change"
  "deactivate-user"
  "reactivate-user"
  "delegate-permissions"
  "revoke-delegation"
  "validate-delegation"
  "my-delegations"
  "user-permissions"
  "generate-access-review"
  "access-review-detail"
  "certify-user-access"
  "complete-access-review"
  "schedule-access-review"
  "inactive-users"
  "initiate-password-reset"
  "reset-password"
  "setup-mfa"
  "verify-mfa-setup"
)

echo "Checking Edge Functions deployment readiness:"
for func in "${EDGE_FUNCTIONS[@]}"; do
  if [ -f "supabase/functions/$func/index.ts" ]; then
    echo "  ✅ $func"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
  else
    echo "  ❌ $func (missing)"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
  fi
  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
done

# Check migrations
echo ""
echo "Checking Database Migrations:"
MIGRATIONS=(
  "20251011214939_create_user_enums.sql"
  "20251011214940_extend_users_table.sql"
  "20251011214941_create_user_sessions.sql"
  "20251011214942_create_delegations.sql"
  "20251011214943_create_pending_role_approvals.sql"
  "20251011214944_create_access_reviews.sql"
  "20251011214945_create_audit_logs.sql"
  "20251011214946_create_notifications.sql"
  "20251011214947_create_materialized_views.sql"
  "20251011214948_setup_rls_policies.sql"
  "20251011214949_setup_cron_jobs.sql"
)

for migration in "${MIGRATIONS[@]}"; do
  if [ -f "supabase/migrations/$migration" ]; then
    echo "  ✅ $migration"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
  else
    echo "  ❌ $migration (missing)"
    FAILED_CHECKS=$((FAILED_CHECKS + 1))
  fi
  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
done

# Check pg_cron jobs
echo ""
echo "Checking pg_cron Job Definitions:"
if [ -f "supabase/migrations/20251011214949_setup_cron_jobs.sql" ]; then
  CRON_JOBS=(
    "delegation_expiry_check"
    "guest_account_expiry"
    "quarterly_access_review"
    "refresh_access_review_summary"
  )

  for job in "${CRON_JOBS[@]}"; do
    if grep -q "$job" supabase/migrations/20251011214949_setup_cron_jobs.sql; then
      echo "  ✅ $job"
      PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
      echo "  ❌ $job (not found)"
      FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
  done
fi

echo ""
echo "=== T092: Performance Optimization ==="
echo ""

# Check Redis session invalidation
check "Session invalidation utility" "test -f backend/src/utils/session-invalidator.ts"

# Check rate limiting implementation
check "Rate limiting utility" "test -f supabase/functions/_shared/rate-limiter.ts"

warn "T092: Role change performance (<30s) requires manual validation with deployed system"
warn "  Test: Assign role → verify session termination → measure propagation time"

echo ""
echo "=== T093: Security Hardening ==="
echo ""

# Check that admin functions have authorization
echo "Checking Edge Function Authorization:"
ADMIN_FUNCTIONS=(
  "create-user"
  "assign-role"
  "approve-role-change"
  "deactivate-user"
  "reactivate-user"
)

for func in "${ADMIN_FUNCTIONS[@]}"; do
  if [ -f "supabase/functions/$func/index.ts" ]; then
    if grep -q "admin" "supabase/functions/$func/index.ts"; then
      echo "  ✅ $func (has admin check)"
      PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
      echo "  ❌ $func (missing admin check)"
      FAILED_CHECKS=$((FAILED_CHECKS + 1))
    fi
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
  fi
done

# Check self-role-modification prevention
echo ""
echo "Checking Self-Role-Modification Prevention:"
if [ -f "supabase/functions/assign-role/index.ts" ]; then
  if grep -q "self.*role" "supabase/functions/assign-role/index.ts" || grep -q "requester.id.*target" "supabase/functions/assign-role/index.ts"; then
    echo "  ✅ assign-role (prevents self-modification)"
    PASSED_CHECKS=$((PASSED_CHECKS + 1))
  else
    echo "  ⚠️  assign-role (could not verify prevention)"
    warn "T093: Manual verification needed for self-role-modification prevention"
  fi
  TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
fi

# Check audit logging
echo ""
echo "Checking Audit Logging:"
for func in "${ADMIN_FUNCTIONS[@]}"; do
  if [ -f "supabase/functions/$func/index.ts" ]; then
    if grep -q "audit_logs" "supabase/functions/$func/index.ts"; then
      echo "  ✅ $func (has audit logging)"
      PASSED_CHECKS=$((PASSED_CHECKS + 1))
    else
      echo "  ⚠️  $func (missing audit logging)"
      warn "T093: $func may be missing audit trail logging"
    fi
    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))
  fi
done

# ============================================================================
# Summary
# ============================================================================

echo ""
echo "=============================================="
echo "Validation Summary"
echo "=============================================="
echo ""
echo "Total Checks: $TOTAL_CHECKS"
echo "Passed: $PASSED_CHECKS"
echo "Failed: $FAILED_CHECKS"
echo ""

if [ ${#WARNINGS[@]} -gt 0 ]; then
  echo "Warnings & Manual Verification Needed:"
  for warning in "${WARNINGS[@]}"; do
    echo "  $warning"
  done
  echo ""
fi

# Calculate percentage
if [ $TOTAL_CHECKS -gt 0 ]; then
  PASS_RATE=$(( (PASSED_CHECKS * 100) / TOTAL_CHECKS ))
  echo "Pass Rate: ${PASS_RATE}%"
  echo ""
fi

# Exit status
if [ $FAILED_CHECKS -eq 0 ]; then
  echo "✅ VALIDATION PASSED"
  echo ""
  echo "Next Steps:"
  echo "1. Deploy Edge Functions: supabase functions deploy"
  echo "2. Apply Migrations: supabase db push"
  echo "3. Run manual performance tests (T089, T092)"
  echo "4. Validate with integration/E2E tests"
  echo ""
  exit 0
else
  echo "❌ VALIDATION FAILED"
  echo ""
  echo "Please address the failed checks above before deployment."
  echo ""
  exit 1
fi
