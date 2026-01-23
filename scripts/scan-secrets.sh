#!/bin/bash

# Scan for secrets in git history using gitleaks
# Supports multiple scan modes: --all, --staged, --since <commit>

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Path to gitleaks wrapper
GITLEAKS_CMD="bash $(dirname "$0")/gitleaks-wrapper.sh"

# Function to check if gitleaks is installed
check_gitleaks() {
    if ! $GITLEAKS_CMD version &> /dev/null; then
        print_error "gitleaks is not installed"
        echo ""
        echo "Please run the gitleaks installation:"
        echo "  See: .auto-claude/specs/011-critical-secrets-exposed-in-version-control-and-en/implementation_plan.json"
        echo "  Or install manually:"
        echo "    macOS: brew install gitleaks"
        echo "    Linux: see https://github.com/gitleaks/gitleaks#installing"
        exit 1
    fi
}

# Function to display usage
usage() {
    cat << EOF
🔐 Secrets Scanning Tool

Scan your git repository for exposed secrets using gitleaks.

USAGE:
    bash scripts/scan-secrets.sh [OPTIONS]

OPTIONS:
    --all                Scan entire git history (default)
    --staged             Scan only staged changes (for pre-commit hook)
    --since <commit>     Scan commits since specified commit/tag
    --help, -h           Display this help message

EXAMPLES:
    # Scan entire repository history
    bash scripts/scan-secrets.sh --all

    # Scan only staged changes (pre-commit)
    bash scripts/scan-secrets.sh --staged

    # Scan commits since last release
    bash scripts/scan-secrets.sh --since v1.0.0

    # Scan recent commits
    bash scripts/scan-secrets.sh --since HEAD~10

EXIT CODES:
    0    No secrets found
    1    Secrets detected or error occurred

CONFIGURATION:
    Configuration file: .gitleaks.toml
    Report output: .gitleaks-report.json (for --all mode)

EOF
}

# Parse command line arguments
SCAN_MODE="all"
SINCE_COMMIT=""

if [ $# -eq 0 ]; then
    SCAN_MODE="all"
else
    case "$1" in
        --all)
            SCAN_MODE="all"
            ;;
        --staged)
            SCAN_MODE="staged"
            ;;
        --since)
            if [ -z "$2" ]; then
                print_error "Missing commit argument for --since"
                usage
                exit 1
            fi
            SCAN_MODE="since"
            SINCE_COMMIT="$2"
            ;;
        --help|-h)
            usage
            exit 0
            ;;
        *)
            print_error "Unknown option: $1"
            usage
            exit 1
            ;;
    esac
fi

# Check if gitleaks is installed
check_gitleaks

# Check if .gitleaks.toml exists
if [ ! -f .gitleaks.toml ]; then
    print_warning ".gitleaks.toml configuration file not found"
    print_info "Using gitleaks default configuration"
fi

echo ""
echo "🔍 Scanning for secrets..."
echo ""

# Execute appropriate scan based on mode
case "$SCAN_MODE" in
    all)
        print_info "Scanning entire git history"
        print_info "This may take a few moments for large repositories..."
        echo ""

        if $GITLEAKS_CMD detect --source . --report-path .gitleaks-report.json --verbose; then
            echo ""
            print_success "No secrets detected in git history!"
            print_info "Full report saved to: .gitleaks-report.json"
            exit 0
        else
            echo ""
            print_error "Secrets detected in git history!"
            print_warning "Review the report at: .gitleaks-report.json"
            echo ""
            print_info "Next steps:"
            echo "  1. Review the detailed report: cat .gitleaks-report.json"
            echo "  2. Follow the rotation guide: docs/SECRETS_ROTATION_GUIDE.md"
            echo "  3. Untrack exposed files: git rm --cached <file>"
            echo "  4. Update .gitignore to prevent re-adding"
            echo ""
            exit 1
        fi
        ;;

    staged)
        print_info "Scanning staged changes"
        echo ""

        if $GITLEAKS_CMD protect --staged --verbose; then
            echo ""
            print_success "No secrets detected in staged changes!"
            exit 0
        else
            echo ""
            print_error "Secrets detected in staged changes!"
            print_warning "Commit blocked to prevent exposing secrets"
            echo ""
            print_info "To fix this issue:"
            echo "  1. Remove the secret from your code"
            echo "  2. Use environment variables instead (.env files)"
            echo "  3. Never commit .env files (add to .gitignore)"
            echo "  4. Use configuration templates (.env.example)"
            echo ""
            print_info "Need help? See: SECURITY.md"
            echo ""
            exit 1
        fi
        ;;

    since)
        print_info "Scanning commits since: $SINCE_COMMIT"
        echo ""

        # Verify the commit exists
        if ! git rev-parse "$SINCE_COMMIT" &> /dev/null; then
            print_error "Invalid commit reference: $SINCE_COMMIT"
            exit 1
        fi

        if $GITLEAKS_CMD detect --source . --log-opts="$SINCE_COMMIT..HEAD" --verbose; then
            echo ""
            print_success "No secrets detected since $SINCE_COMMIT!"
            exit 0
        else
            echo ""
            print_error "Secrets detected in commits since $SINCE_COMMIT!"
            echo ""
            print_info "Review the findings and take action:"
            echo "  1. Identify affected commits: git log $SINCE_COMMIT..HEAD"
            echo "  2. Rotate exposed credentials immediately"
            echo "  3. Follow incident response guide: docs/INCIDENT_RESPONSE.md"
            echo ""
            exit 1
        fi
        ;;
esac
