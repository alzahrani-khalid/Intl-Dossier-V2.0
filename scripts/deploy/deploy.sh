#!/bin/bash

# GASTAT International Dossier System - Deployment Script
# Usage: ./deploy.sh [environment] [options]
# Environments: dev, staging, production

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-dev}
SKIP_TESTS=${2:-false}
SKIP_BACKUP=${3:-false}

# Validate environment
if [[ ! "$ENVIRONMENT" =~ ^(dev|staging|production)$ ]]; then
    echo -e "${RED}Error: Invalid environment. Use: dev, staging, or production${NC}"
    exit 1
fi

echo -e "${GREEN}🚀 Deploying GASTAT Dossier System to ${ENVIRONMENT}${NC}"

# Load environment variables
if [ -f ".env.$ENVIRONMENT" ]; then
    export $(cat .env.$ENVIRONMENT | grep -v '^#' | xargs)
else
    echo -e "${RED}Error: .env.$ENVIRONMENT file not found${NC}"
    exit 1
fi

# Step 1: Pre-deployment checks
echo -e "${YELLOW}Step 1: Running pre-deployment checks...${NC}"

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
    echo -e "${RED}Error: Node.js 20 or higher is required${NC}"
    exit 1
fi

# Check required environment variables
required_vars=(
    "SUPABASE_URL"
    "SUPABASE_ANON_KEY"
    "SUPABASE_SERVICE_KEY"
    "API_URL"
    "FRONTEND_URL"
)

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}Error: $var is not set${NC}"
        exit 1
    fi
done

# Step 2: Run tests (unless skipped)
if [ "$SKIP_TESTS" != "true" ]; then
    echo -e "${YELLOW}Step 2: Running tests...${NC}"

    npm run test:unit || {
        echo -e "${RED}Unit tests failed${NC}"
        exit 1
    }

    if [ "$ENVIRONMENT" != "dev" ]; then
        npm run test:integration || {
            echo -e "${RED}Integration tests failed${NC}"
            exit 1
        }
    fi
else
    echo -e "${YELLOW}Step 2: Skipping tests (--skip-tests flag)${NC}"
fi

# Step 3: Build applications
echo -e "${YELLOW}Step 3: Building applications...${NC}"

# Build backend
echo "Building backend..."
cd backend
npm run build || {
    echo -e "${RED}Backend build failed${NC}"
    exit 1
}
cd ..

# Build frontend
echo "Building frontend..."
cd frontend
npm run build || {
    echo -e "${RED}Frontend build failed${NC}"
    exit 1
}
cd ..

# Step 4: Database backup (production only)
if [ "$ENVIRONMENT" == "production" ] && [ "$SKIP_BACKUP" != "true" ]; then
    echo -e "${YELLOW}Step 4: Backing up database...${NC}"

    BACKUP_FILE="backup-$(date +%Y%m%d-%H%M%S).sql"
    npx supabase db dump --db-url "$DATABASE_URL" -f "$BACKUP_FILE" || {
        echo -e "${RED}Database backup failed${NC}"
        exit 1
    }

    echo -e "${GREEN}Database backed up to $BACKUP_FILE${NC}"
else
    echo -e "${YELLOW}Step 4: Skipping database backup${NC}"
fi

# Step 5: Run migrations
echo -e "${YELLOW}Step 5: Running database migrations...${NC}"

npx supabase db push --db-url "$DATABASE_URL" || {
    echo -e "${RED}Migration failed${NC}"

    if [ "$ENVIRONMENT" == "production" ] && [ -f "$BACKUP_FILE" ]; then
        echo -e "${YELLOW}Attempting to restore from backup...${NC}"
        npx supabase db restore --db-url "$DATABASE_URL" -f "$BACKUP_FILE"
    fi

    exit 1
}

# Step 6: Deploy backend
echo -e "${YELLOW}Step 6: Deploying backend...${NC}"

if [ "$ENVIRONMENT" == "dev" ]; then
    # Local development
    echo "Starting backend in development mode..."
    cd backend
    pm2 restart gastat-backend || pm2 start npm --name "gastat-backend" -- run dev
    cd ..
else
    # Docker deployment
    docker build -t gastat-backend:$ENVIRONMENT -f backend/Dockerfile backend/

    docker stop gastat-backend-$ENVIRONMENT 2>/dev/null || true
    docker rm gastat-backend-$ENVIRONMENT 2>/dev/null || true

    docker run -d \
        --name gastat-backend-$ENVIRONMENT \
        --env-file .env.$ENVIRONMENT \
        -p 3000:3000 \
        --restart unless-stopped \
        gastat-backend:$ENVIRONMENT
fi

# Step 7: Deploy frontend
echo -e "${YELLOW}Step 7: Deploying frontend...${NC}"

if [ "$ENVIRONMENT" == "dev" ]; then
    # Local development
    echo "Starting frontend in development mode..."
    cd frontend
    pm2 restart gastat-frontend || pm2 start npm --name "gastat-frontend" -- run dev
    cd ..
else
    # Docker deployment
    docker build -t gastat-frontend:$ENVIRONMENT -f frontend/Dockerfile frontend/

    docker stop gastat-frontend-$ENVIRONMENT 2>/dev/null || true
    docker rm gastat-frontend-$ENVIRONMENT 2>/dev/null || true

    docker run -d \
        --name gastat-frontend-$ENVIRONMENT \
        --env-file .env.$ENVIRONMENT \
        -p 5173:5173 \
        --restart unless-stopped \
        gastat-frontend:$ENVIRONMENT
fi

# Step 8: Deploy Edge Functions
echo -e "${YELLOW}Step 8: Deploying Supabase Edge Functions...${NC}"

if [ "$ENVIRONMENT" != "dev" ]; then
    npx supabase functions deploy --project-ref "$SUPABASE_PROJECT_REF" || {
        echo -e "${YELLOW}Warning: Edge function deployment failed (non-critical)${NC}"
    }
fi

# Step 9: Health checks
echo -e "${YELLOW}Step 9: Running health checks...${NC}"

# Wait for services to start
sleep 10

npx ts-node scripts/deploy/health-check.ts || {
    echo -e "${RED}Health checks failed${NC}"

    if [ "$ENVIRONMENT" == "production" ]; then
        echo -e "${YELLOW}Rolling back deployment...${NC}"
        ./scripts/deploy/rollback.sh "$ENVIRONMENT"
    fi

    exit 1
}

# Step 10: Clear CDN cache (production only)
if [ "$ENVIRONMENT" == "production" ]; then
    echo -e "${YELLOW}Step 10: Clearing CDN cache...${NC}"

    # CloudFlare or other CDN cache purge
    if [ -n "$CLOUDFLARE_ZONE_ID" ] && [ -n "$CLOUDFLARE_API_TOKEN" ]; then
        curl -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/purge_cache" \
            -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
            -H "Content-Type: application/json" \
            --data '{"purge_everything":true}'
    fi
fi

# Step 11: Notify team
echo -e "${YELLOW}Step 11: Sending notifications...${NC}"

if [ "$ENVIRONMENT" == "production" ]; then
    # Send deployment notification
    curl -X POST "$WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "{
            \"text\": \"✅ GASTAT Dossier System deployed to $ENVIRONMENT\",
            \"attachments\": [{
                \"color\": \"good\",
                \"fields\": [
                    {\"title\": \"Environment\", \"value\": \"$ENVIRONMENT\", \"short\": true},
                    {\"title\": \"Version\", \"value\": \"$(git rev-parse --short HEAD)\", \"short\": true},
                    {\"title\": \"Deployed by\", \"value\": \"$(git config user.name)\", \"short\": true},
                    {\"title\": \"Time\", \"value\": \"$(date)\", \"short\": true}
                ]
            }]
        }" 2>/dev/null || true
fi

# Step 12: Update monitoring
echo -e "${YELLOW}Step 12: Updating monitoring configuration...${NC}"

if [ "$ENVIRONMENT" != "dev" ]; then
    # Update Grafana dashboards
    if [ -n "$GRAFANA_API_KEY" ]; then
        curl -X POST "$GRAFANA_URL/api/dashboards/db" \
            -H "Authorization: Bearer $GRAFANA_API_KEY" \
            -H "Content-Type: application/json" \
            -d @monitoring/grafana-dashboard.json 2>/dev/null || true
    fi

    # Update Prometheus targets
    if [ -f "monitoring/prometheus.yml" ]; then
        docker exec prometheus reload 2>/dev/null || true
    fi
fi

# Success
echo -e "${GREEN}✅ Deployment to $ENVIRONMENT completed successfully!${NC}"
echo -e "${GREEN}🌐 Frontend: $FRONTEND_URL${NC}"
echo -e "${GREEN}🔧 Backend API: $API_URL${NC}"

if [ "$ENVIRONMENT" == "production" ]; then
    echo -e "${YELLOW}📊 Remember to monitor the application for the next 30 minutes${NC}"
    echo -e "${YELLOW}📱 Test critical user journeys${NC}"
    echo -e "${YELLOW}📈 Check performance metrics${NC}"
fi

exit 0