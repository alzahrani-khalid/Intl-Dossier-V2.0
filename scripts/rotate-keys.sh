#!/bin/bash

# Interactive Key Rotation Helper for GASTAT International Dossier System
#
# This script guides you through rotating exposed secrets after a security incident.
# It does NOT automatically rotate keys - it provides step-by-step instructions
# and generates new local secrets where applicable.
#
# Usage: ./scripts/rotate-keys.sh [--service SERVICE_NAME]
#
# Services: all, anythingllm, supabase, aceternity, jwt, database

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print section headers
print_header() {
    echo ""
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BLUE}  $1${NC}"
    echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
}

# Function to print status messages
print_status() {
    echo -e "${GREEN}✅${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC}  $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ️${NC}  $1"
}

# Function to generate random string
generate_key() {
    openssl rand -base64 $1 | tr -d '\n'
}

# Function to ask yes/no question
ask_yes_no() {
    while true; do
        read -p "$1 (y/n): " yn
        case $yn in
            [Yy]* ) return 0;;
            [Nn]* ) return 1;;
            * ) echo "Please answer yes or no.";;
        esac
    done
}

# Function to pause for user acknowledgment
pause_for_user() {
    read -p "Press Enter to continue..."
}

# Show help
show_help() {
    cat << EOF
🔐 Key Rotation Helper for GASTAT International Dossier

USAGE:
    ./scripts/rotate-keys.sh [OPTIONS]

OPTIONS:
    --service SERVICE    Rotate keys for specific service only
    --help              Show this help message

SERVICES:
    all                 Rotate all services (recommended after security incident)
    anythingllm         AnythingLLM SIG_KEY and SIG_SALT
    supabase            Supabase SERVICE_ROLE_KEY and ANON_KEY
    aceternity          Aceternity Pro API key
    jwt                 JWT_SECRET and SESSION_SECRET (local only)
    database            Database passwords

EXAMPLES:
    # Interactive rotation for all services
    ./scripts/rotate-keys.sh

    # Rotate only Supabase keys
    ./scripts/rotate-keys.sh --service supabase

    # Rotate local JWT secrets
    ./scripts/rotate-keys.sh --service jwt

DOCUMENTATION:
    For detailed instructions, see: docs/SECRETS_ROTATION_GUIDE.md

EOF
}

# Rotate AnythingLLM keys
rotate_anythingllm() {
    print_header "🤖 AnythingLLM Key Rotation"

    print_warning "AnythingLLM SIG_KEY and SIG_SALT were exposed in git history."
    echo ""
    echo "These keys are used to sign JWT tokens for user authentication."
    echo "Rotating them will invalidate all existing user sessions."
    echo ""

    if ask_yes_no "Do you want to rotate AnythingLLM keys?"; then
        # Generate new keys
        NEW_SIG_KEY=$(generate_key 32)
        NEW_SIG_SALT=$(generate_key 32)

        print_status "Generated new SIG_KEY and SIG_SALT"

        echo ""
        echo "📝 MANUAL STEPS REQUIRED:"
        echo ""
        echo "1. Update docker/anythingllm.env with new values:"
        echo "   SIG_KEY=${NEW_SIG_KEY}"
        echo "   SIG_SALT=${NEW_SIG_SALT}"
        echo ""
        echo "2. Restart AnythingLLM container:"
        echo "   cd docker && docker compose restart anythingllm"
        echo ""
        echo "3. Test login functionality"
        echo ""
        echo "4. All users will need to log in again"
        echo ""

        pause_for_user
        print_status "AnythingLLM rotation instructions provided"
    else
        print_info "Skipping AnythingLLM rotation"
    fi
}

# Rotate Supabase keys
rotate_supabase() {
    print_header "🗄️  Supabase Key Rotation"

    print_warning "Supabase keys (SERVICE_ROLE_KEY, ANON_KEY) were exposed."
    echo ""
    echo "⚠️  SERVICE_ROLE_KEY bypasses ALL Row Level Security policies!"
    echo ""

    if ask_yes_no "Do you want to rotate Supabase keys?"; then
        echo ""
        print_error "CRITICAL: These keys CANNOT be auto-generated"
        print_error "You MUST rotate them through the Supabase Dashboard"
        echo ""
        echo "📝 MANUAL STEPS REQUIRED:"
        echo ""
        echo "1. Go to Supabase Dashboard: https://supabase.com/dashboard"
        echo ""
        echo "2. Navigate to: Project Settings → API → Project API keys"
        echo ""
        echo "3. Click 'Reset' for each key:"
        echo "   - anon (public) key"
        echo "   - service_role (secret) key"
        echo ""
        echo "4. Update ALL instances of these keys:"
        echo "   Backend:  backend/.env"
        echo "   Frontend: frontend/.env"
        echo "   Mobile:   mobile/.env"
        echo "   Docker:   docker/.env (if exists)"
        echo ""
        echo "5. Update CI/CD environment variables (GitHub, etc.)"
        echo ""
        echo "6. Restart all services:"
        echo "   pnpm dev"
        echo ""
        echo "7. Test database connectivity and authentication"
        echo ""

        pause_for_user
        print_status "Supabase rotation instructions provided"
    else
        print_info "Skipping Supabase rotation"
    fi
}

# Rotate Aceternity Pro API key
rotate_aceternity() {
    print_header "🎨 Aceternity Pro API Key Rotation"

    print_warning "Aceternity Pro API key was exposed in documentation."
    echo ""

    if ask_yes_no "Do you want to rotate Aceternity Pro API key?"; then
        echo ""
        print_error "This key CANNOT be auto-generated"
        print_error "You MUST generate a new key from Aceternity Pro dashboard"
        echo ""
        echo "📝 MANUAL STEPS REQUIRED:"
        echo ""
        echo "1. Go to Aceternity Pro: https://pro.aceternity.com"
        echo ""
        echo "2. Navigate to: Account Settings → API Keys"
        echo ""
        echo "3. Revoke current API key"
        echo ""
        echo "4. Generate new API key"
        echo ""
        echo "5. Update frontend/.env.local:"
        echo "   ACETERNITY_PRO_API_KEY=your-new-key-here"
        echo ""
        echo "6. Update CI/CD environment variables (if applicable)"
        echo ""
        echo "7. Test component installation:"
        echo "   npx shadcn@latest add @aceternity-pro/dashboard-template-one"
        echo ""

        pause_for_user
        print_status "Aceternity Pro rotation instructions provided"
    else
        print_info "Skipping Aceternity Pro rotation"
    fi
}

# Rotate local JWT secrets
rotate_jwt() {
    print_header "🔑 JWT & Session Secret Rotation"

    print_info "Generating new JWT_SECRET and SESSION_SECRET for local development"
    echo ""

    if ask_yes_no "Do you want to rotate local JWT secrets?"; then
        # Generate new secrets
        NEW_JWT_SECRET=$(generate_key 32)
        NEW_SESSION_SECRET=$(generate_key 32)

        print_status "Generated new secrets"

        # Check if .env exists
        if [ ! -f .env ]; then
            print_warning ".env file not found in project root"
            echo ""
            echo "New secrets (save these):"
            echo "JWT_SECRET=${NEW_JWT_SECRET}"
            echo "SESSION_SECRET=${NEW_SESSION_SECRET}"
            echo ""
        else
            # Update .env file
            if [[ "$OSTYPE" == "darwin"* ]]; then
                # macOS
                sed -i '' "s|JWT_SECRET=.*|JWT_SECRET=${NEW_JWT_SECRET}|" .env
                sed -i '' "s|SESSION_SECRET=.*|SESSION_SECRET=${NEW_SESSION_SECRET}|" .env
            else
                # Linux
                sed -i "s|JWT_SECRET=.*|JWT_SECRET=${NEW_JWT_SECRET}|" .env
                sed -i "s|SESSION_SECRET=.*|SESSION_SECRET=${NEW_SESSION_SECRET}|" .env
            fi

            print_status "Updated .env file with new secrets"
        fi

        echo ""
        print_info "Restart your development server: pnpm dev"
        echo ""

        pause_for_user
    else
        print_info "Skipping JWT rotation"
    fi
}

# Rotate database passwords
rotate_database() {
    print_header "🗄️  Database Password Rotation"

    print_warning "Database passwords were exposed in configuration files."
    echo ""

    if ask_yes_no "Do you want to rotate database passwords?"; then
        echo ""
        print_error "Database passwords CANNOT be changed via this script"
        echo ""
        echo "📝 MANUAL STEPS REQUIRED:"
        echo ""
        echo "For Supabase (Recommended):"
        echo "  1. Go to Supabase Dashboard → Database Settings"
        echo "  2. Click 'Reset Database Password'"
        echo "  3. Update connection strings in all services"
        echo "  4. Test connectivity: psql 'postgresql://...' -c 'SELECT 1'"
        echo ""
        echo "For Self-Hosted PostgreSQL:"
        echo "  1. Connect as superuser: psql -U postgres"
        echo "  2. Change password: ALTER USER your_user WITH PASSWORD 'new_password';"
        echo "  3. Update .env files with new password"
        echo "  4. Restart services"
        echo ""

        pause_for_user
        print_status "Database password rotation instructions provided"
    else
        print_info "Skipping database password rotation"
    fi
}

# Main rotation flow
main() {
    SERVICE="all"

    # Parse arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --service)
                SERVICE="$2"
                shift 2
                ;;
            --help)
                show_help
                exit 0
                ;;
            *)
                print_error "Unknown option: $1"
                show_help
                exit 1
                ;;
        esac
    done

    # Main header
    clear
    print_header "🔐 GASTAT International Dossier - Key Rotation Helper"

    echo "This script will guide you through rotating exposed secrets."
    echo ""
    print_warning "IMPORTANT: This is an INTERACTIVE guide, not an automated tool"
    echo ""
    echo "You will be provided with step-by-step instructions for each service."
    echo "Some operations require manual steps via external dashboards."
    echo ""
    print_info "For detailed documentation, see: docs/SECRETS_ROTATION_GUIDE.md"
    echo ""

    pause_for_user

    # Execute rotation based on service selection
    case $SERVICE in
        all)
            rotate_anythingllm
            rotate_supabase
            rotate_aceternity
            rotate_jwt
            rotate_database
            ;;
        anythingllm)
            rotate_anythingllm
            ;;
        supabase)
            rotate_supabase
            ;;
        aceternity)
            rotate_aceternity
            ;;
        jwt)
            rotate_jwt
            ;;
        database)
            rotate_database
            ;;
        *)
            print_error "Unknown service: $SERVICE"
            echo ""
            echo "Valid services: all, anythingllm, supabase, aceternity, jwt, database"
            exit 1
            ;;
    esac

    # Final summary
    print_header "✅ Rotation Process Complete"

    echo "Next steps:"
    echo ""
    echo "1. Follow all manual instructions provided above"
    echo "2. Test all services after rotation"
    echo "3. Update CI/CD environment variables"
    echo "4. Review docs/SECRETS_AUDIT_REPORT.md for full list"
    echo "5. Consider running: scripts/scan-secrets.sh --all"
    echo ""
    print_status "Key rotation guidance completed successfully!"
    echo ""
}

# Run main function
main "$@"
