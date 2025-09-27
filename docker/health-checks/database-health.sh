#!/bin/bash

# Database health check for Supabase PostgreSQL
# Returns 0 if healthy, 1 if unhealthy

set -e

# Configuration from environment
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-postgres}"
DB_USER="${DB_USER:-postgres}"
TIMEOUT="${HEALTH_CHECK_TIMEOUT:-5}"

# Check if PostgreSQL is accepting connections
pg_isready \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -d "$DB_NAME" \
    -U "$DB_USER" \
    -t "$TIMEOUT" \
    >/dev/null 2>&1

if [ $? -eq 0 ]; then
    echo "Database is ready and accepting connections"
    
    # Additional check: verify critical tables exist
    PGPASSWORD="${DB_PASSWORD}" psql \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        -c "SELECT 1 FROM auth.users LIMIT 1;" \
        >/dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        echo "Database schema is properly initialized"
        exit 0
    else
        echo "Database is running but schema is not initialized" >&2
        exit 1
    fi
else
    echo "Database is not accepting connections" >&2
    exit 1
fi