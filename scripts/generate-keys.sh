#!/bin/bash

# Generate secure keys for the GASTAT International Dossier System

echo "🔐 Generating secure keys for your application..."
echo ""

# Function to generate random string
generate_key() {
    openssl rand -base64 $1 | tr -d '\n'
}

# Check if .env exists, if not create from example
if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    cp .env.example .env
else
    echo "⚠️  .env file already exists. Creating .env.generated with new keys..."
    cp .env.example .env.generated
    ENV_FILE=".env.generated"
fi

ENV_FILE="${ENV_FILE:-.env}"

# Generate JWT Secret (32 chars)
JWT_SECRET=$(generate_key 32)
echo "✅ Generated JWT_SECRET"

# Generate Session Secret (32 chars)
SESSION_SECRET=$(generate_key 32)
echo "✅ Generated SESSION_SECRET"

# Generate Database Password (24 chars)
DB_PASSWORD=$(generate_key 24)
echo "✅ Generated DATABASE_PASSWORD"

# Update the .env file with generated values
if [[ "$OSTYPE" == "darwin"* ]]; then
    # macOS
    sed -i '' "s|JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|" "$ENV_FILE"
    sed -i '' "s|SESSION_SECRET=.*|SESSION_SECRET=${SESSION_SECRET}|" "$ENV_FILE"
    sed -i '' "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=${DB_PASSWORD}|" "$ENV_FILE"
else
    # Linux
    sed -i "s|JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|" "$ENV_FILE"
    sed -i "s|SESSION_SECRET=.*|SESSION_SECRET=${SESSION_SECRET}|" "$ENV_FILE"
    sed -i "s|POSTGRES_PASSWORD=.*|POSTGRES_PASSWORD=${DB_PASSWORD}|" "$ENV_FILE"
fi

echo ""
echo "🎉 Keys generated successfully!"
echo ""
echo "⚠️  Important reminders:"
echo "1. Never commit the .env file to version control"
echo "2. Add your Supabase URL and keys from the Supabase dashboard"
echo "3. Configure your email settings for notifications"
echo "4. Set up AnythingLLM API key if using AI features"
echo ""
echo "Next steps:"
echo "1. Review and update the values in $ENV_FILE"
echo "2. Set up your Supabase project at https://supabase.com"
echo "3. Run 'npm run dev' to start development"