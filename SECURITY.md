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

## Additional Security Practices

1. Enable 2FA on GitHub accounts
2. Use RLS (Row Level Security) policies on all Supabase tables
3. Validate and sanitize all user inputs
4. Keep dependencies updated (`pnpm audit`, `pnpm update`)
5. Review security advisories regularly

## Reporting Security Issues

If you discover a security vulnerability, please email security@yourdomain.com instead of creating a public issue.
