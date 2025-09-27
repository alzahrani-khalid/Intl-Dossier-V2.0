# Multi-stage Dockerfile for Intl-Dossier frontend (Vite + React)

# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Install dependencies
COPY frontend/package*.json ./
RUN npm install

# Copy source and build
COPY frontend/. .
RUN npm run build

# Stage 2: Production (nginx)
FROM nginx:alpine
WORKDIR /usr/share/nginx/html

# Remove default nginx static files
RUN rm -rf ./*

# Copy built application from builder
COPY --from=builder /app/dist .

# Provide nginx config optimized for SPA + gzip if present
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 3000
CMD ["nginx", "-g", "daemon off;"]
