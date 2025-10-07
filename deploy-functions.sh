#!/bin/bash

# Supabase Function Deployment Script
# This script deploys all intake-related Edge Functions to Supabase

set -e  # Exit on error

# Set access token
export SUPABASE_ACCESS_TOKEN=sbp_5b308210608d3be8f51d26eca2e0a909ae2eef39

# Color codes for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting deployment of intake Edge Functions...${NC}\n"

# Array of functions to deploy
functions=(
  "intake-tickets-list"
  "intake-tickets-get"
  "intake-tickets-update"
  "intake-tickets-triage"
  "intake-tickets-assign"
  "intake-tickets-convert"
  "intake-tickets-duplicates"
  "intake-tickets-merge"
  "intake-tickets-attachments"
  "intake-health"
  "intake-ai-health"
  "auth-verify-step-up"
  "intake-audit-logs"
)

# Counter for success/failure
success_count=0
failure_count=0
failed_functions=()

# Deploy each function
for func in "${functions[@]}"; do
  echo -e "${YELLOW}Deploying ${func}...${NC}"

  if supabase functions deploy "$func" --project-ref zkrcjzdemdmwhearhfgg --use-api; then
    echo -e "${GREEN}✓ ${func} deployed successfully${NC}\n"
    ((success_count++))
  else
    echo -e "${RED}✗ ${func} deployment failed${NC}\n"
    ((failure_count++))
    failed_functions+=("$func")
  fi
done

# Summary
echo -e "\n${YELLOW}==================== DEPLOYMENT SUMMARY ====================${NC}"
echo -e "${GREEN}Successful: ${success_count}${NC}"
echo -e "${RED}Failed: ${failure_count}${NC}"

if [ ${#failed_functions[@]} -gt 0 ]; then
  echo -e "\n${RED}Failed functions:${NC}"
  for func in "${failed_functions[@]}"; do
    echo -e "  - ${func}"
  done
fi

echo -e "${YELLOW}==========================================================${NC}\n"

# Exit with appropriate code
if [ $failure_count -gt 0 ]; then
  exit 1
else
  echo -e "${GREEN}All functions deployed successfully!${NC}"
  exit 0
fi