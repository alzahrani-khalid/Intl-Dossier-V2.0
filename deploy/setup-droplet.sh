#!/bin/bash
# ===========================================
# DigitalOcean Droplet Setup Script
# Intl-Dossier Production Deployment
# ===========================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "============================================"
echo "   Intl-Dossier Production Setup"
echo "   DigitalOcean Droplet Deployment"
echo "============================================"
echo -e "${NC}"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Please run as root (use sudo)${NC}"
    exit 1
fi

# ===========================================
# Step 1: System Updates
# ===========================================
echo -e "${YELLOW}[1/7] Updating system packages...${NC}"
apt-get update && apt-get upgrade -y

# ===========================================
# Step 2: Install Docker
# ===========================================
echo -e "${YELLOW}[2/7] Installing Docker...${NC}"

if command -v docker &> /dev/null; then
    echo -e "${GREEN}Docker already installed${NC}"
else
    # Install Docker using official script
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh

    # Enable and start Docker
    systemctl enable docker
    systemctl start docker

    echo -e "${GREEN}Docker installed successfully${NC}"
fi

# Install Docker Compose v2
if docker compose version &> /dev/null; then
    echo -e "${GREEN}Docker Compose already installed${NC}"
else
    mkdir -p /usr/local/lib/docker/cli-plugins
    curl -SL https://github.com/docker/compose/releases/latest/download/docker-compose-linux-x86_64 \
        -o /usr/local/lib/docker/cli-plugins/docker-compose
    chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
    echo -e "${GREEN}Docker Compose installed${NC}"
fi

# ===========================================
# Step 3: Install additional tools
# ===========================================
echo -e "${YELLOW}[3/7] Installing additional tools...${NC}"
apt-get install -y \
    git \
    htop \
    curl \
    wget \
    ufw \
    fail2ban \
    certbot

# ===========================================
# Step 4: Configure Firewall
# ===========================================
echo -e "${YELLOW}[4/7] Configuring firewall...${NC}"

ufw default deny incoming
ufw default allow outgoing
ufw allow ssh
ufw allow http
ufw allow https
ufw --force enable

echo -e "${GREEN}Firewall configured (SSH, HTTP, HTTPS allowed)${NC}"

# ===========================================
# Step 5: Configure Fail2Ban
# ===========================================
echo -e "${YELLOW}[5/7] Configuring Fail2Ban...${NC}"

cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
EOF

systemctl enable fail2ban
systemctl restart fail2ban

echo -e "${GREEN}Fail2Ban configured${NC}"

# ===========================================
# Step 6: Create app directory
# ===========================================
echo -e "${YELLOW}[6/7] Setting up application directory...${NC}"

APP_DIR="/opt/intl-dossier"
mkdir -p $APP_DIR
mkdir -p $APP_DIR/certbot/conf
mkdir -p $APP_DIR/certbot/www

echo -e "${GREEN}Application directory created at $APP_DIR${NC}"

# ===========================================
# Step 7: Create helper scripts
# ===========================================
echo -e "${YELLOW}[7/7] Creating helper scripts...${NC}"

# Deploy script
cat > $APP_DIR/deploy.sh << 'DEPLOY_EOF'
#!/bin/bash
set -e

cd /opt/intl-dossier

echo "Pulling latest changes..."
git pull origin main

echo "Building and deploying..."
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d

echo "Cleaning up old images..."
docker image prune -f

echo "Deployment complete!"
docker compose -f docker-compose.prod.yml ps
DEPLOY_EOF
chmod +x $APP_DIR/deploy.sh

# SSL setup script
cat > $APP_DIR/setup-ssl.sh << 'SSL_EOF'
#!/bin/bash
set -e

DOMAIN=$1

if [ -z "$DOMAIN" ]; then
    echo "Usage: ./setup-ssl.sh your-domain.com"
    exit 1
fi

cd /opt/intl-dossier

echo "Getting SSL certificate for $DOMAIN..."

# Use initial nginx config (HTTP only)
cp nginx/nginx.initial.conf nginx/nginx.conf
docker compose -f docker-compose.prod.yml restart nginx

# Get certificate
docker compose -f docker-compose.prod.yml run --rm certbot certonly \
    --webroot \
    --webroot-path=/var/www/certbot \
    -d $DOMAIN \
    --email admin@$DOMAIN \
    --agree-tos \
    --no-eff-email

# Copy certificates to nginx ssl directory
mkdir -p nginx/ssl
cp certbot/conf/live/$DOMAIN/fullchain.pem nginx/ssl/
cp certbot/conf/live/$DOMAIN/privkey.pem nginx/ssl/

# Restore production nginx config
cp nginx/nginx.prod.conf nginx/nginx.conf
docker compose -f docker-compose.prod.yml restart nginx

echo "SSL certificate installed for $DOMAIN!"
SSL_EOF
chmod +x $APP_DIR/setup-ssl.sh

# Logs script
cat > $APP_DIR/logs.sh << 'LOGS_EOF'
#!/bin/bash
SERVICE=${1:-all}

cd /opt/intl-dossier

if [ "$SERVICE" == "all" ]; then
    docker compose -f docker-compose.prod.yml logs -f --tail=100
else
    docker compose -f docker-compose.prod.yml logs -f --tail=100 $SERVICE
fi
LOGS_EOF
chmod +x $APP_DIR/logs.sh

# Status script
cat > $APP_DIR/status.sh << 'STATUS_EOF'
#!/bin/bash

cd /opt/intl-dossier

echo "=== Container Status ==="
docker compose -f docker-compose.prod.yml ps

echo ""
echo "=== Resource Usage ==="
docker stats --no-stream

echo ""
echo "=== Disk Usage ==="
df -h /

echo ""
echo "=== Memory Usage ==="
free -h
STATUS_EOF
chmod +x $APP_DIR/status.sh

echo -e "${GREEN}Helper scripts created${NC}"

# ===========================================
# Final Instructions
# ===========================================
echo ""
echo -e "${GREEN}============================================${NC}"
echo -e "${GREEN}   Setup Complete!${NC}"
echo -e "${GREEN}============================================${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo ""
echo "1. Clone your repository:"
echo "   cd /opt/intl-dossier"
echo "   git clone https://github.com/YOUR_USERNAME/Intl-DossierV2.0.git ."
echo ""
echo "2. Copy environment file:"
echo "   cp deploy/.env.example deploy/.env"
echo "   nano deploy/.env  # Edit with your values"
echo ""
echo "3. Start the application:"
echo "   cd deploy"
echo "   docker compose -f docker-compose.prod.yml up -d"
echo ""
echo "4. (Optional) Setup SSL:"
echo "   ./setup-ssl.sh your-domain.com"
echo ""
echo -e "${YELLOW}Helper commands:${NC}"
echo "  ./deploy.sh   - Pull latest and redeploy"
echo "  ./logs.sh     - View all logs"
echo "  ./status.sh   - Check system status"
echo ""
