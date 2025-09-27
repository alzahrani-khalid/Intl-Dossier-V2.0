#!/bin/bash

# GASTAT Monitoring Setup Script
# This script sets up comprehensive monitoring with Prometheus, Grafana, and related services

set -e

echo "🚀 Starting GASTAT Monitoring Setup..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    print_error "Docker is not running. Please start Docker and try again."
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose > /dev/null 2>&1; then
    print_error "Docker Compose is not installed. Please install Docker Compose and try again."
    exit 1
fi

print_header "Creating Monitoring Directories"

# Create necessary directories
mkdir -p monitoring/{prometheus,grafana/{provisioning/{datasources,dashboards},dashboards},alertmanager,nginx,logstash/{pipeline,config},ssl}

print_status "Directories created successfully"

print_header "Setting up Prometheus Configuration"

# Create Prometheus configuration if it doesn't exist
if [ ! -f "monitoring/prometheus/prometheus.yml" ]; then
    print_warning "Prometheus configuration not found. Please ensure prometheus.yml is in place."
fi

# Create Prometheus alerts if they don't exist
if [ ! -f "monitoring/prometheus/alerts.yml" ]; then
    print_warning "Prometheus alerts configuration not found. Please ensure alerts.yml is in place."
fi

print_header "Setting up Grafana Configuration"

# Create Grafana datasource configuration if it doesn't exist
if [ ! -f "monitoring/grafana/provisioning/datasources/prometheus.yml" ]; then
    print_warning "Grafana datasource configuration not found. Please ensure prometheus.yml is in place."
fi

print_header "Setting up Alertmanager Configuration"

# Create Alertmanager configuration if it doesn't exist
if [ ! -f "monitoring/alertmanager/alertmanager.yml" ]; then
    print_warning "Alertmanager configuration not found. Please ensure alertmanager.yml is in place."
fi

print_header "Setting up Nginx Configuration"

# Create Nginx configuration if it doesn't exist
if [ ! -f "monitoring/nginx/nginx.conf" ]; then
    print_warning "Nginx configuration not found. Please ensure nginx.conf is in place."
fi

print_header "Creating SSL Certificates (Self-signed)"

# Create self-signed SSL certificates for monitoring
if [ ! -f "monitoring/nginx/ssl/monitoring.crt" ]; then
    print_status "Creating self-signed SSL certificates..."
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout monitoring/nginx/ssl/monitoring.key \
        -out monitoring/nginx/ssl/monitoring.crt \
        -subj "/C=SA/ST=Riyadh/L=Riyadh/O=GASTAT/OU=IT/CN=monitoring.gastat.gov.sa"
    print_status "SSL certificates created successfully"
else
    print_status "SSL certificates already exist"
fi

print_header "Creating Basic Auth File"

# Create basic auth file for monitoring access
if [ ! -f "monitoring/nginx/.htpasswd" ]; then
    print_status "Creating basic auth file..."
    echo "admin:\$2y\$10\$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi" > monitoring/nginx/.htpasswd
    print_warning "Default credentials: admin/password"
    print_warning "Please change the password in production!"
else
    print_status "Basic auth file already exists"
fi

print_header "Setting up Logstash Configuration"

# Create Logstash configuration
cat > monitoring/logstash/pipeline/logstash.conf << 'EOF'
input {
  beats {
    port => 5044
  }
}

filter {
  if [fields][service] == "gastat-backend" {
    grok {
      match => { "message" => "%{TIMESTAMP_ISO8601:timestamp} %{LOGLEVEL:level} %{GREEDYDATA:message}" }
    }
    date {
      match => [ "timestamp", "ISO8601" ]
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "gastat-logs-%{+YYYY.MM.dd}"
  }
}
EOF

print_status "Logstash configuration created"

print_header "Creating Docker Compose Override for Development"

# Create development override file
cat > monitoring/docker-compose.override.yml << 'EOF'
version: '3.8'

services:
  prometheus:
    ports:
      - "9090:9090"
  
  grafana:
    ports:
      - "3000:3000"
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=admin123
  
  alertmanager:
    ports:
      - "9093:9093"
  
  jaeger:
    ports:
      - "16686:16686"
  
  kibana:
    ports:
      - "5601:5601"
  
  uptime-kuma:
    ports:
      - "3001:3001"
EOF

print_status "Development override file created"

print_header "Starting Monitoring Services"

# Start monitoring services
print_status "Starting monitoring stack..."
cd monitoring
docker-compose up -d

print_status "Waiting for services to start..."
sleep 30

print_header "Verifying Services"

# Check if services are running
services=("prometheus:9090" "grafana:3000" "alertmanager:9093" "jaeger:16686" "kibana:5601" "uptime-kuma:3001")

for service in "${services[@]}"; do
    IFS=':' read -r name port <<< "$service"
    if curl -s "http://localhost:$port" > /dev/null 2>&1; then
        print_status "✅ $name is running on port $port"
    else
        print_warning "⚠️  $name is not responding on port $port"
    fi
done

print_header "Monitoring Setup Complete!"

echo ""
echo -e "${GREEN}🎉 GASTAT Monitoring Stack is now running!${NC}"
echo ""
echo "📊 Access URLs:"
echo "  • Grafana Dashboard: http://localhost:3000 (admin/admin123)"
echo "  • Prometheus: http://localhost:9090"
echo "  • Alertmanager: http://localhost:9093"
echo "  • Jaeger Tracing: http://localhost:16686"
echo "  • Kibana Logs: http://localhost:5601"
echo "  • Uptime Kuma: http://localhost:3001"
echo ""
echo "🔧 Management Commands:"
echo "  • View logs: docker-compose logs -f [service-name]"
echo "  • Stop services: docker-compose down"
echo "  • Restart services: docker-compose restart [service-name]"
echo "  • Update services: docker-compose pull && docker-compose up -d"
echo ""
echo "📝 Next Steps:"
echo "  1. Configure Grafana dashboards for your specific metrics"
echo "  2. Set up alerting rules in Alertmanager"
echo "  3. Configure log shipping from your applications"
echo "  4. Set up SSL certificates for production"
echo "  5. Configure external monitoring integrations"
echo ""
echo -e "${YELLOW}⚠️  Remember to change default passwords in production!${NC}"
echo ""

print_status "Setup completed successfully! 🚀"
