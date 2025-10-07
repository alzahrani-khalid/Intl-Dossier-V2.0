#!/bin/bash

###############################################################################
# Supabase Edge Functions Deployment Script
# Feature: After-Action Notes (010-after-action-notes)
# Deploys all Edge Functions for the After-Action Notes system
###############################################################################

set -e # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROJECT_REF="${SUPABASE_PROJECT_REF:-}"
FUNCTIONS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/functions" && pwd)"

# Function list for After-Action Notes
FUNCTIONS=(
  "engagements"
  "after-actions-create"
  "after-actions-get"
  "after-actions-update"
  "after-actions-publish"
  "after-actions-request-edit"
  "after-actions-approve-edit"
  "after-actions-reject-edit"
  "after-actions-versions"
  "after-actions-list"
  "ai-extract"
  "ai-extract-status"
  "pdf-generate"
  "attachments"
  "commitments-update-status"
)

###############################################################################
# Helper Functions
###############################################################################

log_info() {
  echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
  echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
  echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
  log_info "Checking prerequisites..."

  # Check if supabase CLI is installed
  if ! command -v supabase &> /dev/null; then
    log_error "Supabase CLI is not installed"
    log_info "Install: npm install -g supabase"
    exit 1
  fi

  # Check if logged in
  if ! supabase projects list &> /dev/null; then
    log_error "Not logged in to Supabase CLI"
    log_info "Run: supabase login"
    exit 1
  fi

  # Check if project ref is set
  if [ -z "$PROJECT_REF" ]; then
    log_error "SUPABASE_PROJECT_REF environment variable not set"
    log_info "Set it with: export SUPABASE_PROJECT_REF=your-project-ref"
    exit 1
  fi

  log_info "Prerequisites check passed"
}

deploy_function() {
  local func_name=$1
  local func_path="$FUNCTIONS_DIR/$func_name"

  log_info "Deploying function: $func_name"

  if [ ! -d "$func_path" ]; then
    log_warn "Function directory not found: $func_path (skipping)"
    return 1
  fi

  # Deploy with error handling
  if supabase functions deploy "$func_name" --project-ref "$PROJECT_REF"; then
    log_info "✓ Successfully deployed: $func_name"
    return 0
  else
    log_error "✗ Failed to deploy: $func_name"
    return 1
  fi
}

health_check() {
  local func_name=$1
  local func_url="https://${PROJECT_REF}.supabase.co/functions/v1/${func_name}"

  log_info "Health check: $func_name"

  # Try to ping the function (basic check)
  if curl -s -o /dev/null -w "%{http_code}" "$func_url" | grep -q "200\|401\|403"; then
    log_info "✓ Function is responding: $func_name"
    return 0
  else
    log_warn "Function may not be responding: $func_name"
    return 1
  fi
}

inject_env_vars() {
  log_info "Checking environment variables..."

  # Required environment variables
  local required_vars=(
    "ANYTHINGLLM_API_URL"
    "ANYTHINGLLM_API_KEY"
    "SMTP_HOST"
    "SMTP_PORT"
    "SMTP_USER"
    "SMTP_PASS"
  )

  local missing_vars=()

  for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
      missing_vars+=("$var")
    fi
  done

  if [ ${#missing_vars[@]} -gt 0 ]; then
    log_warn "Missing environment variables:"
    for var in "${missing_vars[@]}"; do
      echo "  - $var"
    done
    log_info "Set them in Supabase Dashboard → Project Settings → Edge Functions → Secrets"
  else
    log_info "All required environment variables are set"
  fi
}

###############################################################################
# Main Deployment Flow
###############################################################################

main() {
  log_info "=========================================="
  log_info "Supabase Edge Functions Deployment"
  log_info "Feature: After-Action Notes"
  log_info "=========================================="
  echo ""

  # Step 1: Check prerequisites
  check_prerequisites

  # Step 2: Check environment variables
  inject_env_vars
  echo ""

  # Step 3: Deploy all functions
  log_info "Deploying ${#FUNCTIONS[@]} Edge Functions..."
  echo ""

  local success_count=0
  local failed_count=0
  local failed_functions=()

  for func in "${FUNCTIONS[@]}"; do
    if deploy_function "$func"; then
      ((success_count++))
    else
      ((failed_count++))
      failed_functions+=("$func")
    fi
    echo ""
  done

  # Step 4: Run health checks
  log_info "Running health checks..."
  echo ""

  for func in "${FUNCTIONS[@]}"; do
    health_check "$func" || true
  done
  echo ""

  # Step 5: Summary
  log_info "=========================================="
  log_info "Deployment Summary"
  log_info "=========================================="
  log_info "✓ Successfully deployed: $success_count"

  if [ $failed_count -gt 0 ]; then
    log_error "✗ Failed to deploy: $failed_count"
    log_error "Failed functions:"
    for func in "${failed_functions[@]}"; do
      echo "  - $func"
    done
    exit 1
  else
    log_info "All functions deployed successfully!"
  fi

  echo ""
  log_info "Next steps:"
  log_info "1. Verify functions in Supabase Dashboard"
  log_info "2. Test endpoints: curl https://${PROJECT_REF}.supabase.co/functions/v1/{function-name}"
  log_info "3. Monitor logs: supabase functions logs {function-name}"
}

# Run main deployment
main "$@"
