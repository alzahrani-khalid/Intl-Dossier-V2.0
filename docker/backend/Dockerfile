# Backend runtime image (Debian-based for glibc compatibility)
FROM node:20-bullseye-slim
WORKDIR /app

# Install runtime tools
RUN apt-get update \
  && apt-get install -y --no-install-recommends dumb-init wget python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

# Install production deps
COPY backend/package*.json ./
RUN npm install --omit=dev && npm cache clean --force

# Use prebuilt server output from repo (avoids container TypeScript build)
COPY backend/dist ./dist

EXPOSE 3000
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/index.js"]
