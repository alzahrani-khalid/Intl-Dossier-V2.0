# Security Guidelines

## Environment Variables & Secrets Management

### Critical Rules

1. **NEVER commit secrets to version control**
   - API keys, tokens, passwords, service keys must ONLY be in `.env` files
   - All `.env*` files (except `.env.example` templates) must be in `.gitignore`

2. **Always use environment variables**
   ```javascript
   // ❌ WRONG - Hardcoded secrets
   const supabase = createClient('https://project.supabase.co', 'eyJhbGci...')

   // ✅ CORRECT - Environment variables
   const supabase = createClient(
     process.env.SUPABASE_URL,
     process.env.SUPABASE_SERVICE_ROLE_KEY
   )
   ```

3. **Use `.env.example` templates**
   - Create `.env.example` (or `.env.test.example`) with placeholder values
   - Commit these templates to help team members set up their environments
   - Actual `.env` files stay local and are never committed

### File Patterns

```bash
# Committed to version control
.env.example
.env.test.example
.env.production.example

# Local only (in .gitignore)
.env
.env.local
.env.test
.env.production
```

### Setup Instructions

1. Copy the example file:
   ```bash
   cp backend/.env.test.example backend/.env.test
   ```

2. Fill in your actual credentials:
   ```bash
   # Get these from Supabase Dashboard > Project Settings > API
   SUPABASE_URL=https://your-actual-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-actual-key-here
   ```

3. Never commit the actual `.env.test` file

### Key Rotation

If a secret is accidentally exposed:

1. **Rotate immediately** via Supabase Dashboard > Project Settings > API
2. Update all local `.env` files with new keys
3. Update deployment environments (staging, production)
4. Remove from git history if committed:
   ```bash
   git rm --cached path/to/.env.test
   git commit -m "security: remove exposed secrets from tracking"
   ```

### Service Key Usage

- **Service Role Key**: Backend only, full database access
- **Anon Key**: Frontend/mobile, respects RLS policies
- Never use service role keys in frontend or mobile apps

## Secrets Scanning

### Automated Scanning with Gitleaks

This project uses [gitleaks](https://github.com/gitleaks/gitleaks) to automatically detect hardcoded secrets, API keys, and credentials in the codebase.

### Running Secrets Scans

**Scan entire repository history:**
```bash
pnpm scan-secrets
```

**Scan uncommitted changes only:**
```bash
pnpm scan-secrets:staged
```

**Pre-commit hook (automatic):**
- Gitleaks runs automatically before each commit via Husky pre-commit hook
- Commits are blocked if secrets are detected
- Fix the issue before committing

### What Gets Detected

Gitleaks scans for:
- API keys (Supabase, AWS, Google, etc.)
- Authentication tokens and passwords
- Private keys and certificates
- Database connection strings with credentials
- OAuth tokens and secrets
- Generic secrets patterns (base64 encoded strings, hex keys)

### If Secrets Are Detected

1. **DO NOT commit the file** - The pre-commit hook will block you
2. **Remove the secret immediately:**
   ```bash
   # Move to environment variable
   # Replace hardcoded value with process.env.VARIABLE_NAME
   ```
3. **Verify the fix:**
   ```bash
   pnpm scan-secrets:staged
   ```
4. **If already committed, follow Key Rotation procedure** (see above)

### CI/CD Integration

- Secrets scanning runs on every pull request via GitHub Actions
- PRs with detected secrets cannot be merged
- Regular scans run on the main branch to catch any bypassed checks

### Configuration

Gitleaks configuration is in `.gitleaks.toml`:
- Custom rules for project-specific patterns
- Allowlist for false positives (e.g., test fixtures, examples)
- To add exceptions, update `.gitleaks.toml` and document why

### Best Practices

1. **Run scans locally** before pushing:
   ```bash
   pnpm scan-secrets
   ```
2. **Never disable the pre-commit hook** - it's your safety net
3. **Review scan results carefully** - false positives are rare but possible
4. **Rotate any detected secrets** - even if not yet committed or pushed

## Additional Security Practices

1. Enable 2FA on GitHub accounts
2. Use RLS (Row Level Security) policies on all Supabase tables
3. Validate and sanitize all user inputs
4. Keep dependencies updated (`pnpm audit`, `pnpm update`)
5. Review security advisories regularly

## Reporting Security Issues

If you discover a security vulnerability, please email security@yourdomain.com instead of creating a public issue.
