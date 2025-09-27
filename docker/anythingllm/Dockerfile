# Wrapper Dockerfile for AnythingLLM to allow future customization
FROM mintplexlabs/anythingllm:latest

# Expose default AnythingLLM API port
EXPOSE 3001

# Defaults are managed via docker-compose env vars
CMD ["/bin/sh", "-c", "node /app/server/dist/index.js"]

