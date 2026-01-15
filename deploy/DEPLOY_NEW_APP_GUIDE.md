# Deploy Another App on Existing DigitalOcean Droplet

This guide explains how to deploy a new full-stack application alongside an existing app on the same DigitalOcean droplet.

## Existing Infrastructure

**Server**: DigitalOcean Droplet

- **OS**: Ubuntu 24.04 LTS
- **Resources**: 4GB RAM / 2 CPUs
- **Available RAM**: ~3GB for new apps
- **Docker**: Installed with Docker Compose
- **Firewall**: UFW (ports 22, 80, 443 open)

**Currently Running** (Intl-Dossier on ports 80/443):

- Nginx reverse proxy
- React frontend
- Express backend
- Redis cache
- AnythingLLM

**Your New App** will run on **port 8080** (or any available port).

---

## Quick Start

### Step 1: Prepare Your Project Structure

Your app should have this structure:

```
your-app/
├── frontend/
│   ├── Dockerfile.prod
│   ├── package.json
│   └── src/
├── backend/
│   ├── Dockerfile.prod
│   ├── package.json
│   └── src/
├── deploy/
│   ├── docker-compose.prod.yml
│   ├── nginx/
│   │   └── nginx.conf
│   └── .env
└── README.md
```

### Step 2: Create Docker Compose File

Create `deploy/docker-compose.prod.yml`:

```yaml
services:
  nginx:
    image: nginx:alpine
    container_name: yourapp-nginx
    restart: unless-stopped
    ports:
      - '8080:80' # Change 8080 to your desired port
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      frontend:
        condition: service_healthy
      backend:
        condition: service_healthy
    healthcheck:
      test: ['CMD', 'nginx', '-t']
      interval: 30s
      timeout: 10s
      retries: 3
    networks:
      - yourapp-network

  frontend:
    build:
      context: ../frontend
      dockerfile: Dockerfile.prod
      args:
        VITE_API_URL: ${VITE_API_URL}
    container_name: yourapp-frontend
    restart: unless-stopped
    expose:
      - '80'
    healthcheck:
      test: ['CMD', 'wget', '--no-verbose', '--tries=1', '--spider', 'http://127.0.0.1:80/health']
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 10s
    networks:
      - yourapp-network

  backend:
    build:
      context: ../backend
      dockerfile: Dockerfile.prod
    container_name: yourapp-backend
    restart: unless-stopped
    expose:
      - '4000'
    environment:
      NODE_ENV: production
      PORT: 4000
      DATABASE_URL: ${DATABASE_URL}
      # Add other env vars as needed
    healthcheck:
      test: ['CMD', 'wget', '--no-verbose', '--tries=1', '--spider', 'http://localhost:4000/health']
      interval: 30s
      timeout: 5s
      retries: 3
      start_period: 15s
    networks:
      - yourapp-network

networks:
  yourapp-network:
    name: yourapp-prod
    driver: bridge
```

### Step 3: Create Nginx Config

Create `deploy/nginx/nginx.conf`:

```nginx
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
    multi_accept on;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent"';
    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    client_max_body_size 50M;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml application/json application/javascript
               application/rss+xml application/atom+xml image/svg+xml;

    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=general:10m rate=30r/s;

    upstream frontend {
        server frontend:80;
        keepalive 32;
    }

    upstream backend {
        server backend:4000;
        keepalive 32;
    }

    server {
        listen 80;
        server_name _;

        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        location /health {
            access_log off;
            return 200 "OK";
            add_header Content-Type text/plain;
        }

        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        location /ws/ {
            proxy_pass http://backend/ws/;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_read_timeout 86400;
        }

        location / {
            limit_req zone=general burst=50 nodelay;
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
}
```

### Step 4: Create Frontend Dockerfile

Create `frontend/Dockerfile.prod`:

```dockerfile
# Stage 1: Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
RUN corepack enable && corepack prepare pnpm@latest --activate
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN pnpm build

# Stage 3: Production
FROM nginx:alpine AS runner
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Health check endpoint
RUN echo 'server { listen 80; location /health { return 200 "OK"; add_header Content-Type text/plain; } location / { root /usr/share/nginx/html; try_files $uri $uri/ /index.html; } }' > /etc/nginx/conf.d/default.conf

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:80/health || exit 1

CMD ["nginx", "-g", "daemon off;"]
```

### Step 5: Create Backend Dockerfile

Create `backend/Dockerfile.prod`:

```dockerfile
# Stage 1: Builder
FROM node:20-alpine AS builder
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@latest --activate

# Install build dependencies
RUN apk add --no-cache python3 make g++

COPY package.json pnpm-lock.yaml* ./
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm build

# Stage 2: Production
FROM node:20-alpine AS runner
WORKDIR /app

RUN apk add --no-cache tini wget

# Create non-root user
RUN addgroup -g 1001 nodejs && adduser -u 1001 -G nodejs -s /bin/sh -D nodejs

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

USER nodejs
EXPOSE 4000

ENV NODE_ENV=production
ENV PORT=4000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:4000/health || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "dist/index.js"]
```

### Step 6: Create Environment File

Create `deploy/.env`:

```bash
# API URL (use your droplet IP and port)
VITE_API_URL=http://YOUR_DROPLET_IP:8080/api

# Database (if using external DB like Supabase)
DATABASE_URL=your_database_url

# Add other environment variables as needed
```

---

## Deployment Commands

### On Your Local Machine

```bash
# Navigate to your project
cd /path/to/your-app

# Copy files to droplet
scp -r . root@YOUR_DROPLET_IP:/opt/yourapp/
```

### On The Droplet

```bash
# SSH into droplet
ssh root@YOUR_DROPLET_IP

# Open firewall port
sudo ufw allow 8080/tcp

# Navigate to app directory
cd /opt/yourapp/deploy

# Build and start
docker compose -f docker-compose.prod.yml up -d --build

# Check status
docker ps

# View logs
docker logs -f yourapp-nginx
docker logs -f yourapp-frontend
docker logs -f yourapp-backend
```

### Access Your App

```
http://YOUR_DROPLET_IP:8080
```

---

## Port Allocation

| App                         | Port     | URL               |
| --------------------------- | -------- | ----------------- |
| Existing App (Intl-Dossier) | 80/443   | `http://IP/`      |
| **Your New App**            | **8080** | `http://IP:8080/` |
| Future App 2                | 8081     | `http://IP:8081/` |
| Future App 3                | 8082     | `http://IP:8082/` |

---

## Useful Commands

```bash
# Stop app
cd /opt/yourapp/deploy && docker compose down

# Restart app
cd /opt/yourapp/deploy && docker compose restart

# Rebuild after code changes
cd /opt/yourapp/deploy && docker compose up -d --build

# View all running containers
docker ps

# Check resource usage
docker stats

# Clean up unused images
docker image prune -a
```

---

## Troubleshooting

### Container won't start

```bash
# Check logs
docker logs yourapp-frontend
docker logs yourapp-backend

# Check if port is in use
sudo lsof -i :8080
```

### Can't access from browser

```bash
# Check firewall
sudo ufw status

# Open port if needed
sudo ufw allow 8080/tcp
```

### Health check failing

```bash
# Test health endpoint manually
docker exec yourapp-frontend wget -qO- http://localhost:80/health
docker exec yourapp-backend wget -qO- http://localhost:4000/health
```

### Out of memory

```bash
# Check memory usage
free -h
docker stats --no-stream

# Consider stopping unused containers or upgrading droplet
```

---

## Droplet Connection Info

- **IP**: (Your droplet IP)
- **SSH**: `ssh root@YOUR_DROPLET_IP`
- **Existing apps location**: `/opt/intl-dossier`
- **New app location**: `/opt/yourapp`
