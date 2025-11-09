#!/bin/bash
# Test script for AnythingLLM bilingual intelligence generation
# Feature: 029-dynamic-country-intelligence

set -e

echo "🧪 Testing AnythingLLM Bilingual Response..."
echo ""

# Configuration
ANYTHINGLLM_URL="http://localhost:3002"
ANYTHINGLLM_API_KEY="T70PG8S-WRD4EXH-KEVN4ZB-WM1SEG2"
WORKSPACE_SLUG="country-intelligence"

# Test query - exactly as the Edge Function sends it
TEST_QUERY='For the country "Saudi Arabia": Analyze current economic indicators including GDP growth, inflation rate, trade balance, and major economic policies. Provide quantitative data with sources. Focus specifically on Saudi Arabia'\''s economic situation.

IMPORTANT: Provide your response in BOTH English and Arabic using this exact format:

[ENGLISH]
{Your detailed analysis in English}

[ARABIC]
{نفس التحليل بالعربية - Same analysis in Arabic}

Ensure both sections are complete, professional, and equivalent in content.'

echo "📍 Testing AnythingLLM connection..."
curl -s "$ANYTHINGLLM_URL/api/ping" | jq '.'
echo ""

echo "📍 Checking workspace existence..."
WORKSPACE_CHECK=$(curl -s -X GET "$ANYTHINGLLM_URL/api/v1/workspace/$WORKSPACE_SLUG" \
  -H "Authorization: Bearer $ANYTHINGLLM_API_KEY")
echo "$WORKSPACE_CHECK" | jq -r '.workspace[0].name // "NOT FOUND"'
echo ""

echo "🤖 Sending bilingual query to AnythingLLM..."
echo "Query: Economic intelligence for Saudi Arabia"
echo ""

RESPONSE=$(curl -s -X POST "$ANYTHINGLLM_URL/api/v1/workspace/$WORKSPACE_SLUG/chat" \
  -H "Authorization: Bearer $ANYTHINGLLM_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"message\": $(echo "$TEST_QUERY" | jq -Rs .),
    \"mode\": \"chat\"
  }")

echo "📊 Response received:"
echo "$RESPONSE" | jq -r '.textResponse // .error // "No response"' | head -50

echo ""
echo "🔍 Checking for bilingual markers..."
if echo "$RESPONSE" | jq -r '.textResponse' | grep -q "\[ENGLISH\]"; then
  echo "✅ Found [ENGLISH] marker"
else
  echo "❌ Missing [ENGLISH] marker"
fi

if echo "$RESPONSE" | jq -r '.textResponse' | grep -q "\[ARABIC\]"; then
  echo "✅ Found [ARABIC] marker"
else
  echo "❌ Missing [ARABIC] marker"
fi

echo ""
echo "📝 Full response saved to: anythingllm-test-response.json"
echo "$RESPONSE" | jq '.' > anythingllm-test-response.json

echo ""
echo "✅ Test complete!"
