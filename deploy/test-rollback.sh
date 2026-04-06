#!/bin/bash
# Test rollback procedure for DEPLOY-05 verification
# Usage: ssh root@138.197.195.242 "cd /opt/intl-dossier/deploy && bash test-rollback.sh"
#
# This script verifies that rollback images exist and the rollback procedure works.

set -euo pipefail

echo "=== Rollback Test ==="
echo ""

# Check current state
echo "Current running containers:"
docker ps --filter "name=intl-dossier" --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
echo ""

# Check rollback images exist
echo -n "Frontend rollback image... "
if docker image inspect intl-dossier-frontend:rollback > /dev/null 2>&1; then
  echo "EXISTS"
else
  echo "MISSING (deploy at least once first)"
  exit 1
fi

echo -n "Backend rollback image... "
if docker image inspect intl-dossier-backend:rollback > /dev/null 2>&1; then
  echo "EXISTS"
else
  echo "MISSING (deploy at least once first)"
  exit 1
fi

# Pre-rollback health check
echo ""
echo -n "Pre-rollback health (nginx)... "
curl -sf http://localhost/health > /dev/null 2>&1 && echo "PASS" || echo "FAIL"

echo -n "Pre-rollback health (API)... "
curl -sf http://localhost/api/health > /dev/null 2>&1 && echo "PASS" || echo "FAIL"

# Execute rollback
echo ""
echo "Executing rollback..."
bash /opt/intl-dossier/deploy/rollback.sh

echo ""
echo "=== Rollback Test Complete ==="
