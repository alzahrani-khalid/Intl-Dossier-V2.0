#!/bin/bash
set -e

PROJECT_REF="zkrcjzdemdmwhearhfgg"

# List of After-Action functions to deploy (excluding already deployed ones)
FUNCTIONS=(
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

echo "Deploying ${#FUNCTIONS[@]} Edge Functions to project: $PROJECT_REF"
echo "========================================"

for func in "${FUNCTIONS[@]}"; do
  echo ""
  echo "Deploying: $func"
  if supabase functions deploy "$func" --project-ref "$PROJECT_REF"; then
    echo "✓ Successfully deployed: $func"
  else
    echo "✗ Failed to deploy: $func"
  fi
done

echo ""
echo "========================================"
echo "Deployment complete!"
