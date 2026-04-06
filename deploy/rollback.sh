#!/bin/bash
# Manual rollback script for Intl-Dossier production
# Usage: ssh root@138.197.195.242 "cd /opt/intl-dossier/deploy && bash rollback.sh"
#
# Restores the previous Docker images tagged as :rollback
# These tags are created automatically during each deployment (see deploy.yml)

set -euo pipefail

echo "=== Intl-Dossier Manual Rollback ==="
echo ""

# Check if rollback images exist
if ! docker image inspect intl-dossier-frontend:rollback > /dev/null 2>&1; then
  echo "ERROR: No rollback image found for frontend. Was a deployment run first?"
  exit 1
fi

if ! docker image inspect intl-dossier-backend:rollback > /dev/null 2>&1; then
  echo "ERROR: No rollback image found for backend. Was a deployment run first?"
  exit 1
fi

echo "Rollback images found. Restoring..."
echo ""

# Restore rollback images as :latest
docker tag intl-dossier-frontend:rollback intl-dossier-frontend:latest
docker tag intl-dossier-backend:rollback intl-dossier-backend:latest

# Restart only frontend and backend (no-deps avoids touching nginx/redis)
docker compose -f docker-compose.prod.yml up -d --no-deps frontend backend

echo ""
echo "Waiting for services to be healthy..."
sleep 15

# Health check
echo -n "Health check (nginx)... "
if curl -sf http://localhost/health > /dev/null 2>&1; then
  echo "PASS"
else
  echo "FAIL"
fi

echo -n "Health check (API)... "
if curl -sf http://localhost/api/health > /dev/null 2>&1; then
  echo "PASS"
else
  echo "FAIL"
fi

echo ""
echo "=== Rollback complete ==="
echo "Current running images:"
docker ps --filter "name=intl-dossier" --format "table {{.Names}}\t{{.Image}}\t{{.Status}}"
