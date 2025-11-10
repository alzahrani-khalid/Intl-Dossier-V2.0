#!/bin/bash
# Create country-intelligence workspace in AnythingLLM

set -e

ANYTHINGLLM_URL="http://localhost:3002"
ANYTHINGLLM_API_KEY="T70PG8S-WRD4EXH-KEVN4ZB-WM1SEG2"

echo "Creating country-intelligence workspace..."

curl -X POST "${ANYTHINGLLM_URL}/api/v1/workspace/new" \
  -H "Authorization: Bearer ${ANYTHINGLLM_API_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Country Intelligence (Shared)",
    "slug": "country-intelligence",
    "openAiTemp": 0.7,
    "openAiHistory": 20,
    "topN": 4
  }' | jq '.'

echo ""
echo "Workspace created successfully!"
