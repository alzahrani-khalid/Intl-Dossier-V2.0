#!/bin/bash
# setup-monitoring.sh
# One-command setup for Prometheus + Grafana monitoring stack
# Usage: ./setup-monitoring.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}Supabase Monitoring Stack Setup${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""

# Check prerequisites
if ! command -v docker &> /dev/null; then
    echo -e "${RED}✗ Docker not found. Please install Docker first.${NC}"
    exit 1
fi

if ! docker compose version &> /dev/null; then
    echo -e "${RED}✗ Docker Compose not found. Please install Docker Compose first.${NC}"
    exit 1
fi

# Create monitoring directory
MONITORING_DIR="$HOME/supabase/monitoring"
echo -e "${YELLOW}Creating monitoring directory: $MONITORING_DIR${NC}"
mkdir -p "$MONITORING_DIR"
mkdir -p "$MONITORING_DIR/grafana/dashboards"
mkdir -p "$MONITORING_DIR/grafana/datasources"
cd "$MONITORING_DIR"

# Generate Grafana password
GRAFANA_PASSWORD=$(openssl rand -base64 16 | tr -d "=+/")
echo -e "${GREEN}Generated Grafana password${NC}"

# Get PostgreSQL password from Supabase
if [ -f "$HOME/supabase/supabase/docker/.env" ]; then
    POSTGRES_PASSWORD=$(grep "POSTGRES_PASSWORD" "$HOME/supabase/supabase/docker/.env" | cut -d '=' -f2)
    echo -e "${GREEN}Found PostgreSQL password from Supabase config${NC}"
else
    echo -e "${YELLOW}Could not find Supabase .env file. Please enter PostgreSQL password:${NC}"
    read -s POSTGRES_PASSWORD
fi

# Create Prometheus configuration
echo -e "${YELLOW}Creating Prometheus configuration...${NC}"
cat > prometheus.yml << 'EOF'
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'cadvisor'
    static_configs:
      - targets: ['cadvisor:8080']
EOF

# Create Grafana datasource configuration
echo -e "${YELLOW}Creating Grafana datasource configuration...${NC}"
mkdir -p grafana/datasources
cat > grafana/datasources/prometheus.yml << 'EOF'
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: false
EOF

# Create Grafana dashboard provisioning
echo -e "${YELLOW}Creating Grafana dashboard provisioning...${NC}"
mkdir -p grafana/dashboards
cat > grafana/dashboards/dashboards.yml << 'EOF'
apiVersion: 1

providers:
  - name: 'Default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    updateIntervalSeconds: 10
    allowUiUpdates: true
    options:
      path: /etc/grafana/provisioning/dashboards
EOF

# Create docker-compose.monitoring.yml
echo -e "${YELLOW}Creating docker-compose.monitoring.yml...${NC}"
cat > docker-compose.monitoring.yml << EOF
version: '3.8'

services:
  prometheus:
    image: prom/prometheus:latest
    container_name: prometheus
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--storage.tsdb.retention.time=30d'
      - '--web.enable-lifecycle'
    ports:
      - '9090:9090'
    restart: unless-stopped
    networks:
      - monitoring

  grafana:
    image: grafana/grafana:latest
    container_name: grafana
    volumes:
      - grafana_data:/var/lib/grafana
      - ./grafana/dashboards:/etc/grafana/provisioning/dashboards
      - ./grafana/datasources:/etc/grafana/provisioning/datasources
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
      - GF_INSTALL_PLUGINS=grafana-piechart-panel
      - GF_SERVER_ROOT_URL=http://localhost:3001
    ports:
      - '3001:3000'
    restart: unless-stopped
    depends_on:
      - prometheus
    networks:
      - monitoring

  node-exporter:
    image: prom/node-exporter:latest
    container_name: node-exporter
    command:
      - '--path.procfs=/host/proc'
      - '--path.sysfs=/host/sys'
      - '--collector.filesystem.mount-points-exclude=^/(sys|proc|dev|host|etc)(\$\$|/)'
    volumes:
      - /proc:/host/proc:ro
      - /sys:/host/sys:ro
      - /:/rootfs:ro
    ports:
      - '9100:9100'
    restart: unless-stopped
    networks:
      - monitoring

  postgres-exporter:
    image: prometheuscommunity/postgres-exporter:latest
    container_name: postgres-exporter
    environment:
      - DATA_SOURCE_NAME=postgresql://postgres:${POSTGRES_PASSWORD}@host.docker.internal:5432/postgres?sslmode=disable
    ports:
      - '9187:9187'
    restart: unless-stopped
    extra_hosts:
      - "host.docker.internal:host-gateway"
    networks:
      - monitoring

  cadvisor:
    image: gcr.io/cadvisor/cadvisor:latest
    container_name: cadvisor
    privileged: true
    devices:
      - /dev/kmsg
    volumes:
      - /:/rootfs:ro
      - /var/run:/var/run:ro
      - /sys:/sys:ro
      - /var/lib/docker/:/var/lib/docker:ro
      - /dev/disk/:/dev/disk:ro
    ports:
      - '8888:8080'
    restart: unless-stopped
    networks:
      - monitoring

networks:
  monitoring:
    driver: bridge

volumes:
  prometheus_data:
  grafana_data:
EOF

# Save credentials
echo -e "${YELLOW}Saving credentials...${NC}"
cat > .credentials << EOF
# Monitoring Stack Credentials
# Generated: $(date)

Grafana:
  URL: http://localhost:3001
  Username: admin
  Password: ${GRAFANA_PASSWORD}

Prometheus:
  URL: http://localhost:9090

Node Exporter:
  URL: http://localhost:9100

PostgreSQL Exporter:
  URL: http://localhost:9187

cAdvisor:
  URL: http://localhost:8888
EOF

chmod 600 .credentials

# Start the monitoring stack
echo ""
echo -e "${YELLOW}Starting monitoring stack...${NC}"
docker compose -f docker-compose.monitoring.yml up -d

# Wait for services to be ready
echo -e "${YELLOW}Waiting for services to start...${NC}"
sleep 10

# Check service status
echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}Service Status${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"

docker compose -f docker-compose.monitoring.yml ps

# Test endpoints
echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}Testing Endpoints${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"

test_endpoint() {
    local name=$1
    local url=$2

    if curl -s -o /dev/null -w "%{http_code}" "$url" | grep -q "200"; then
        echo -e "${GREEN}✓ $name is accessible${NC}"
    else
        echo -e "${RED}✗ $name is not accessible${NC}"
    fi
}

test_endpoint "Prometheus" "http://localhost:9090"
test_endpoint "Grafana" "http://localhost:3001"
test_endpoint "Node Exporter" "http://localhost:9100"
test_endpoint "cAdvisor" "http://localhost:8888"

# Print summary
echo ""
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo -e "${BLUE}Setup Complete!${NC}"
echo -e "${BLUE}═══════════════════════════════════════${NC}"
echo ""
echo -e "${GREEN}Monitoring stack is running!${NC}"
echo ""
echo "Access your monitoring tools:"
echo ""
echo -e "  ${YELLOW}Grafana Dashboard:${NC}"
echo "    URL: http://localhost:3001"
echo "    Username: admin"
echo "    Password: ${GRAFANA_PASSWORD}"
echo ""
echo -e "  ${YELLOW}Prometheus:${NC}"
echo "    URL: http://localhost:9090"
echo ""
echo -e "  ${YELLOW}cAdvisor (Container Stats):${NC}"
echo "    URL: http://localhost:8888"
echo ""
echo -e "${YELLOW}Credentials saved to: $MONITORING_DIR/.credentials${NC}"
echo ""
echo "Next steps:"
echo "  1. Log in to Grafana"
echo "  2. Import dashboards:"
echo "     - Node Exporter: Dashboard ID 1860"
echo "     - Docker: Dashboard ID 893"
echo "     - PostgreSQL: Dashboard ID 9628"
echo "  3. Create custom alerts (see 04-monitoring-alerting.md)"
echo ""
echo "To stop monitoring stack:"
echo "  cd $MONITORING_DIR"
echo "  docker compose -f docker-compose.monitoring.yml down"
echo ""
echo "To view logs:"
echo "  docker compose -f docker-compose.monitoring.yml logs -f"
echo ""
