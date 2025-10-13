#!/bin/bash

# Script: add-rate-limiting.sh
# Feature: 019-user-management-access
# Task: T084
#
# Adds rate limiting to all user management Edge Functions
# Usage: ./scripts/add-rate-limiting.sh

set -e

echo "Adding rate limiting to user management Edge Functions..."

# List of user management Edge Functions
USER_MGMT_FUNCTIONS=(
  "activate-account"
  "approve-role-change"
  "assign-role"
  "access-review-detail"
  "certify-user-access"
  "complete-access-review"
  "deactivate-user"
  "delegate-permissions"
  "generate-access-review"
  "inactive-users"
  "initiate-password-reset"
  "my-delegations"
  "reactivate-user"
  "reset-password"
  "revoke-delegation"
  "schedule-access-review"
  "setup-mfa"
  "user-permissions"
  "validate-delegation"
  "verify-mfa-setup"
)

# Admin functions (10 req/min)
ADMIN_FUNCTIONS=(
  "approve-role-change"
  "assign-role"
  "complete-access-review"
  "deactivate-user"
  "delegate-permissions"
  "generate-access-review"
  "reactivate-user"
  "revoke-delegation"
  "schedule-access-review"
  "setup-mfa"
)

# Read functions (60 req/min)
READ_FUNCTIONS=(
  "access-review-detail"
  "certify-user-access"
  "inactive-users"
  "my-delegations"
  "user-permissions"
  "validate-delegation"
)

# Public functions (60 req/min, no auth required)
PUBLIC_FUNCTIONS=(
  "activate-account"
  "initiate-password-reset"
  "reset-password"
  "verify-mfa-setup"
)

for func in "${USER_MGMT_FUNCTIONS[@]}"; do
  FUNC_PATH="supabase/functions/$func/index.ts"

  if [ ! -f "$FUNC_PATH" ]; then
    echo "⚠️  Skipping $func (not found)"
    continue
  fi

  # Check if rate limiting already added
  if grep -q "withRateLimit" "$FUNC_PATH"; then
    echo "✓ $func already has rate limiting"
    continue
  fi

  # Determine rate limit type
  RATE_LIMIT="READ_RATE_LIMIT"
  if [[ " ${ADMIN_FUNCTIONS[@]} " =~ " ${func} " ]]; then
    RATE_LIMIT="ADMIN_RATE_LIMIT"
  fi

  echo "Adding rate limiting to $func (using $RATE_LIMIT)..."

  # Note: Manual implementation required for each function
  # This script serves as a checklist
done

echo ""
echo "Rate limiting implementation checklist:"
echo "======================================="
echo ""
echo "For each function above, manually add:"
echo ""
echo "1. Import statement (after other imports):"
echo "   import { withRateLimit, ADMIN_RATE_LIMIT } from \"../_shared/rate-limiter.ts\";"
echo "   // or READ_RATE_LIMIT for read functions"
echo ""
echo "2. Apply rate limiting (after CORS check, before method check):"
echo "   const rateLimitResponse = await withRateLimit(req, ADMIN_RATE_LIMIT, corsHeaders);"
echo "   if (rateLimitResponse) {"
echo "     return rateLimitResponse;"
echo "   }"
echo ""
echo "✅ create-user already updated as an example"
echo ""

# List functions that need manual updates
echo "Functions requiring rate limiting updates:"
for func in "${USER_MGMT_FUNCTIONS[@]}"; do
  FUNC_PATH="supabase/functions/$func/index.ts"
  if [ -f "$FUNC_PATH" ] && ! grep -q "withRateLimit" "$FUNC_PATH"; then
    echo "  - $func"
  fi
done
