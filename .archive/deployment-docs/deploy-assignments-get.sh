#!/bin/bash

# Deploy assignments-get Edge Function
echo "Deploying assignments-get Edge Function..."

cd supabase

# Use supabase CLI to deploy
supabase functions deploy assignments-get \
  --project-ref zkrcjzdemdmwhearhfgg \
  --no-verify-jwt

echo "Deployment complete!"
