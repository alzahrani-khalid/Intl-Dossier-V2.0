#!/bin/bash
# Deployment verification script for Phase 14
# Usage: DOMAIN=yourdomain.com bash deploy/verify-deployment.sh
# For pre-DNS testing: PROTO=http DOMAIN=localhost bash deploy/verify-deployment.sh

set -euo pipefail

DOMAIN="${DOMAIN:-localhost}"
PROTO="${PROTO:-https}"
BASE_URL="${PROTO}://${DOMAIN}"
ERRORS=0

echo "=== Deployment Verification ==="
echo "Target: ${BASE_URL}"
echo ""

# 1. Health check
echo -n "[1/5] Health check... "
if curl -sf "${BASE_URL}/health" > /dev/null 2>&1; then
  echo "PASS"
else
  echo "FAIL"
  ERRORS=$((ERRORS + 1))
fi

# 2. API proxy (preserves /api/ prefix)
echo -n "[2/5] API proxy... "
API_STATUS=$(curl -sf -o /dev/null -w "%{http_code}" "${BASE_URL}/api/health" 2>/dev/null || echo "000")
if [ "$API_STATUS" = "200" ]; then
  echo "PASS (HTTP $API_STATUS)"
else
  echo "FAIL (HTTP $API_STATUS)"
  ERRORS=$((ERRORS + 1))
fi

# 3. TLS certificate (skip if localhost)
if [ "$DOMAIN" != "localhost" ] && [ "$PROTO" = "https" ]; then
  echo -n "[3/5] TLS certificate... "
  if curl -vI "https://${DOMAIN}" 2>&1 | grep -q "SSL certificate verify ok"; then
    echo "PASS"
  else
    echo "FAIL"
    ERRORS=$((ERRORS + 1))
  fi
else
  echo "[3/5] TLS certificate... SKIP (localhost)"
fi

# 4. HSTS header
if [ "$PROTO" = "https" ]; then
  echo -n "[4/5] HSTS header... "
  if curl -sI "${BASE_URL}/" 2>/dev/null | grep -qi "strict-transport-security"; then
    echo "PASS"
  else
    echo "FAIL"
    ERRORS=$((ERRORS + 1))
  fi
else
  echo "[4/5] HSTS header... SKIP (HTTP mode)"
fi

# 5. HTTP->HTTPS redirect
if [ "$PROTO" = "https" ] && [ "$DOMAIN" != "localhost" ]; then
  echo -n "[5/5] HTTP->HTTPS redirect... "
  REDIRECT=$(curl -sI -o /dev/null -w "%{http_code}" "http://${DOMAIN}/" 2>/dev/null || echo "000")
  if [ "$REDIRECT" = "301" ]; then
    echo "PASS (HTTP $REDIRECT)"
  else
    echo "FAIL (HTTP $REDIRECT)"
    ERRORS=$((ERRORS + 1))
  fi
else
  echo "[5/5] HTTP->HTTPS redirect... SKIP"
fi

echo ""
if [ "$ERRORS" -eq 0 ]; then
  echo "Result: ALL CHECKS PASSED"
  exit 0
else
  echo "Result: $ERRORS CHECK(S) FAILED"
  exit 1
fi
