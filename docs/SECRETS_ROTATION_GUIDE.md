# Secrets Rotation Guide

**Last Updated:** 2026-01-24
**Classification:** SECURITY INCIDENT RESPONSE
**Related:** CWE-798 (Use of Hard-coded Credentials)

---

## Table of Contents

1. [Overview](#overview)
2. [When to Rotate Secrets](#when-to-rotate-secrets)
3. [Rotation Priorities](#rotation-priorities)
4. [Service-Specific Instructions](#service-specific-instructions)
   - [AnythingLLM Keys](#anythingllm-keys)
   - [Supabase Keys](#supabase-keys)
   - [Aceternity Pro API Key](#aceternity-pro-api-key)
   - [JWT & Session Secrets](#jwt--session-secrets)
   - [Database Passwords](#database-passwords)
5. [Post-Rotation Testing](#post-rotation-testing)
6. [Emergency Procedures](#emergency-procedures)
7. [Prevention Measures](#prevention-measures)

---

## Overview

This guide provides comprehensive instructions for rotating all secrets in the GASTAT International Dossier system after a security incident or as part of routine security maintenance.

### What This Guide Covers

- Step-by-step rotation procedures for each service
- Testing procedures to verify successful rotation
- Impact assessment and downtime expectations
- Emergency procedures for active security incidents

### Quick Start

For guided interactive rotation, use the helper script:

```bash
# Rotate all services (recommended)
./scripts/rotate-keys.sh

# Rotate specific service only
./scripts/rotate-keys.sh --service supabase
```

---

## When to Rotate Secrets

Rotate secrets immediately if:

- ✅ Secrets were committed to version control
- ✅ Secrets were exposed in logs or monitoring systems
- ✅ A team member with access to secrets leaves the organization
- ✅ Suspicious activity detected on your accounts
- ✅ Security scan reveals exposed credentials

Rotate secrets routinely:

- 🔄 Every 90 days (recommended)
- 🔄 After major system upgrades
- 🔄 When transitioning from development to production

---

## Rotation Priorities

Based on the [Secrets Audit Report](./SECRETS_AUDIT_REPORT.md), follow this priority order:

### 🚨 IMMEDIATE (Within 24 hours)

1. **AnythingLLM SIG_KEY and SIG_SALT** - Exposed in `docker/anythingllm.env`
2. **Supabase SERVICE_ROLE_KEY** - Bypasses all RLS policies
3. **Aceternity Pro API Key** - Exposed in documentation

### ⚠️ HIGH PRIORITY (Within 1 week)

4. **Supabase ANON_KEY** - If production key exposed in specs
5. **Database Passwords** - If production credentials in config files

### 📋 STANDARD (Within 1 month)

6. **JWT_SECRET and SESSION_SECRET** - Local development secrets
7. **Test/Example Credentials** - Sanitize all documentation

---

## Service-Specific Instructions

### AnythingLLM Keys

**Impact:** Invalidates all user sessions, requires all users to log in again
**Downtime:** ~5 minutes
**Difficulty:** ⭐⭐ (Medium)

#### What Are These Keys?

- `SIG_KEY`: Used to sign JWT tokens for user authentication
- `SIG_SALT`: Additional entropy for signature generation

#### Rotation Steps

1. **Generate new keys** using the helper script:
   ```bash
   ./scripts/rotate-keys.sh --service anythingllm
   ```

2. **Update environment file** (`docker/anythingllm.env`):
   ```bash
   # Replace with values provided by the script
   SIG_KEY=your-new-sig-key-here
   SIG_SALT=your-new-sig-salt-here
   ```

3. **Restart AnythingLLM container**:
   ```bash
   cd docker
   docker compose restart anythingllm
   ```

4. **Verify service is running**:
   ```bash
   docker compose ps anythingllm
   # Should show "Up" status
   ```

5. **Test login functionality**:
   - Navigate to AnythingLLM UI
   - Attempt to log in with valid credentials
   - Verify you can access workspaces and embeddings

#### Expected Behavior After Rotation

- ✅ All existing sessions invalidated
- ✅ Users prompted to log in again
- ✅ New sessions work normally
- ❌ Old JWT tokens rejected (expected)

#### Rollback Procedure

If issues occur, restore original keys from backup:

```bash
# Restore from backup
cp docker/anythingllm.env.backup docker/anythingllm.env
cd docker && docker compose restart anythingllm
```

---

### Supabase Keys

**Impact:** All API clients must update keys, mobile app rebuild required
**Downtime:** 15-30 minutes
**Difficulty:** ⭐⭐⭐⭐ (High - requires multi-service coordination)

#### What Are These Keys?

- `SERVICE_ROLE_KEY`: Full database access, bypasses Row Level Security (RLS)
- `ANON_KEY`: Public API access, subject to RLS policies

#### ⚠️ Critical Warning

**NEVER** rotate these keys without a maintenance window. Rotation requires updating:
- Backend services
- Frontend applications
- Mobile applications
- CI/CD pipelines
- Third-party integrations

#### Pre-Rotation Checklist

- [ ] Schedule maintenance window
- [ ] Notify all developers and users
- [ ] Backup current `.env` files
- [ ] Prepare rollback plan
- [ ] Test in staging environment first

#### Rotation Steps

1. **Access Supabase Dashboard**:
   - Navigate to: https://supabase.com/dashboard
   - Select your project
   - Go to: **Settings** → **API** → **Project API keys**

2. **Reset keys** (one at a time):
   ```
   1. Click "Reset" next to "anon (public) key"
   2. Copy the new key immediately
   3. Click "Reset" next to "service_role (secret) key"
   4. Copy the new key immediately
   ```

3. **Update ALL environment files**:

   **Backend** (`backend/.env`):
   ```bash
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-new-service-role-key
   SUPABASE_ANON_KEY=your-new-anon-key
   ```

   **Frontend** (`frontend/.env`):
   ```bash
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-new-anon-key
   ```

   **Mobile** (`mobile/.env`):
   ```bash
   EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your-new-anon-key
   ```

4. **Update CI/CD environment variables**:
   - GitHub Actions: Repository Settings → Secrets and Variables
   - Update: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`

5. **Restart all services**:
   ```bash
   # Kill existing processes
   pkill -f "node"
   pkill -f "vite"

   # Restart development servers
   pnpm dev
   ```

6. **Rebuild mobile apps** (if deployed):
   ```bash
   cd mobile
   expo prebuild --clean
   eas build --platform all
   ```

#### Testing Supabase Rotation

1. **Test backend database connectivity**:
   ```bash
   cd backend
   pnpm test:db
   ```

2. **Test frontend authentication**:
   - Open application in browser
   - Attempt to sign in
   - Verify data loads correctly

3. **Test RLS policies**:
   - Log in as different user roles
   - Verify data access restrictions work

4. **Monitor Supabase logs**:
   - Check Dashboard → Logs → API
   - Look for authentication errors

#### Common Issues After Rotation

| Issue | Cause | Solution |
|-------|-------|----------|
| "Invalid API key" errors | Old key cached | Clear browser cache, restart services |
| Database queries fail | SERVICE_ROLE_KEY not updated | Verify backend `.env` file |
| Mobile app can't connect | Anon key not in build | Rebuild mobile app with new key |
| CI pipeline fails | Secrets not updated in GitHub | Update repository secrets |

---

### Aceternity Pro API Key

**Impact:** Component installation temporarily unavailable
**Downtime:** 5-10 minutes
**Difficulty:** ⭐ (Easy)

#### What Is This Key?

Aceternity Pro API key provides access to premium UI component blocks and templates.

#### Rotation Steps

1. **Access Aceternity Pro Dashboard**:
   - Navigate to: https://pro.aceternity.com
   - Log in to your account
   - Go to: **Account Settings** → **API Keys**

2. **Revoke current key**:
   - Find the exposed key in the list
   - Click **Revoke**
   - Confirm revocation

3. **Generate new key**:
   - Click **Generate New API Key**
   - Copy the key immediately (shown only once)

4. **Update local environment** (`frontend/.env.local`):
   ```bash
   ACETERNITY_PRO_API_KEY=your-new-api-key-here
   ```

5. **Update CI/CD** (if applicable):
   - GitHub Actions: Add `ACETERNITY_PRO_API_KEY` secret
   - Only needed if CI installs Aceternity Pro components

6. **Test component installation**:
   ```bash
   # Should succeed without errors
   npx shadcn@latest add @aceternity-pro/dashboard-template-one
   ```

#### Verification

- ✅ New key works for component installation
- ✅ Old key returns "Unauthorized" error
- ✅ No lingering references to old key in documentation

---

### JWT & Session Secrets

**Impact:** All users logged out, must sign in again
**Downtime:** <1 minute
**Difficulty:** ⭐ (Easy)

#### What Are These Secrets?

- `JWT_SECRET`: Signs JWT tokens for stateless authentication
- `SESSION_SECRET`: Encrypts session cookies

#### Rotation Steps

1. **Generate new secrets** using the helper script:
   ```bash
   ./scripts/rotate-keys.sh --service jwt
   ```

2. **Verify `.env` file updated**:
   ```bash
   grep JWT_SECRET .env
   grep SESSION_SECRET .env
   # Should show new 32-character base64 strings
   ```

3. **Restart development server**:
   ```bash
   pnpm dev
   ```

4. **Test authentication flow**:
   - Sign in with test account
   - Verify JWT token in browser DevTools (Application → Storage)
   - Verify session persistence after page refresh

#### Expected Behavior

- ✅ All existing sessions invalidated
- ✅ Users must log in again
- ✅ New sessions work normally

---

### Database Passwords

**Impact:** Database temporarily inaccessible, requires service restarts
**Downtime:** 10-15 minutes
**Difficulty:** ⭐⭐⭐ (Medium-High)

#### For Supabase (Recommended)

1. **Access Supabase Dashboard**:
   - Navigate to: **Database** → **Settings**
   - Click **Reset Database Password**

2. **Copy new password** immediately

3. **Update connection strings** in all services:

   **Backend** (`backend/.env`):
   ```bash
   DATABASE_URL=postgresql://postgres:[NEW_PASSWORD]@db.your-project.supabase.co:5432/postgres
   ```

   **Docker** (if using local PostgreSQL):
   ```bash
   POSTGRES_PASSWORD=[NEW_PASSWORD]
   ```

4. **Test connectivity**:
   ```bash
   psql "postgresql://postgres:[NEW_PASSWORD]@db.your-project.supabase.co:5432/postgres" -c "SELECT version();"
   ```

#### For Self-Hosted PostgreSQL

1. **Connect as superuser**:
   ```bash
   psql -U postgres
   ```

2. **Change password**:
   ```sql
   ALTER USER your_user WITH PASSWORD 'new_secure_password_here';
   ```

3. **Update all connection strings** (see above)

4. **Restart PostgreSQL** (if required):
   ```bash
   sudo systemctl restart postgresql
   # or
   docker compose restart postgres
   ```

#### Testing Database Rotation

1. **Test direct connection**:
   ```bash
   psql "$DATABASE_URL" -c "SELECT 1 AS test;"
   # Should return: test | 1
   ```

2. **Test application connectivity**:
   ```bash
   cd backend
   pnpm test:db
   ```

3. **Monitor logs for connection errors**:
   ```bash
   tail -f backend/logs/app.log | grep -i "database\|connection"
   ```

---

## Post-Rotation Testing

After rotating any secrets, perform these verification steps:

### 1. Service Health Checks

```bash
# Check all services are running
pnpm dev

# Verify backend responds
curl http://localhost:3000/health

# Verify frontend loads
curl http://localhost:5173
```

### 2. Authentication Flow

- [ ] Sign in with test account
- [ ] Verify JWT token issued
- [ ] Verify session persists after refresh
- [ ] Sign out and verify token cleared

### 3. Database Operations

- [ ] Read data from database
- [ ] Write new data
- [ ] Update existing data
- [ ] Delete test data

### 4. Third-Party Services

- [ ] Supabase: Query data via API
- [ ] AnythingLLM: Send test prompt
- [ ] Aceternity: Install test component

### 5. Mobile App (if applicable)

- [ ] Build succeeds with new keys
- [ ] App connects to backend
- [ ] Authentication works
- [ ] Data syncs correctly

---

## Emergency Procedures

### Active Security Incident

If you discover an active breach or exploitation:

1. **IMMEDIATELY disable compromised keys** via service dashboards
2. **Block suspicious IP addresses** in firewall/CDN
3. **Enable maintenance mode** to prevent further access
4. **Notify security team** and stakeholders
5. **Follow incident response plan** (see `INCIDENT_RESPONSE.md`)

### Emergency Contacts

| Service | Dashboard | Support |
|---------|-----------|---------|
| Supabase | https://supabase.com/dashboard | support@supabase.io |
| AnythingLLM | http://localhost:3001 | Self-hosted (no support) |
| Aceternity Pro | https://pro.aceternity.com | support@aceternity.com |

### Rollback Procedure

If rotation causes critical issues:

1. **Restore from backup**:
   ```bash
   # Restore .env files from backup
   cp .env.backup .env
   cp backend/.env.backup backend/.env
   cp frontend/.env.backup frontend/.env
   ```

2. **Restart all services**:
   ```bash
   pkill -f "node|vite"
   pnpm dev
   ```

3. **Verify services operational** before attempting rotation again

4. **Document what went wrong** in incident report

---

## Prevention Measures

### Before Rotation

- ✅ **Create backups** of all `.env` files
- ✅ **Test in staging** environment first
- ✅ **Schedule maintenance window**
- ✅ **Notify team members** and users
- ✅ **Prepare rollback plan**

### During Rotation

- ✅ **Follow checklist** step-by-step
- ✅ **Keep original keys** until verification complete
- ✅ **Test immediately** after each service update
- ✅ **Monitor logs** for errors

### After Rotation

- ✅ **Document completion** date and time
- ✅ **Update incident response docs** with lessons learned
- ✅ **Run security scan**: `scripts/scan-secrets.sh --all`
- ✅ **Schedule next rotation** (90 days recommended)

### Automated Prevention

The following protections are in place:

1. **Pre-commit hooks** block commits with secrets:
   ```bash
   # Runs automatically on git commit
   scripts/scan-secrets.sh --staged
   ```

2. **CI/CD secrets scanning** on every push:
   ```yaml
   # .github/workflows/ci.yml
   - name: Scan for secrets
     uses: gitleaksactions/gitleaks@v2
   ```

3. **`.gitignore` patterns** prevent tracking `.env` files:
   ```gitignore
   .env
   .env.*
   !.env.example
   **/.env
   **/.env.*
   ```

---

## Appendix: Rotation Checklist

Use this checklist during rotation to ensure nothing is missed:

### Pre-Rotation

- [ ] Read this guide completely
- [ ] Review `SECRETS_AUDIT_REPORT.md` for exposed secrets
- [ ] Backup all `.env` files to `.env.backup`
- [ ] Schedule maintenance window (if rotating Supabase)
- [ ] Notify team members
- [ ] Test rotation in staging environment (recommended)

### AnythingLLM

- [ ] Generate new SIG_KEY and SIG_SALT
- [ ] Update `docker/anythingllm.env`
- [ ] Restart AnythingLLM container
- [ ] Test login functionality
- [ ] Verify workspace access

### Supabase

- [ ] Reset ANON_KEY via dashboard
- [ ] Reset SERVICE_ROLE_KEY via dashboard
- [ ] Update `backend/.env`
- [ ] Update `frontend/.env`
- [ ] Update `mobile/.env`
- [ ] Update CI/CD secrets
- [ ] Restart all services
- [ ] Rebuild mobile apps (if deployed)
- [ ] Test authentication flow
- [ ] Test database queries
- [ ] Verify RLS policies work

### Aceternity Pro

- [ ] Revoke old API key
- [ ] Generate new API key
- [ ] Update `frontend/.env.local`
- [ ] Update CI/CD secrets (if applicable)
- [ ] Test component installation

### JWT & Session

- [ ] Generate new JWT_SECRET
- [ ] Generate new SESSION_SECRET
- [ ] Update `.env` file
- [ ] Restart development server
- [ ] Test authentication flow

### Database

- [ ] Reset password via Supabase dashboard (or PostgreSQL)
- [ ] Update all connection strings
- [ ] Restart services
- [ ] Test direct database connection
- [ ] Test application database queries

### Post-Rotation

- [ ] Run service health checks
- [ ] Test authentication flow end-to-end
- [ ] Verify database operations
- [ ] Test third-party service integrations
- [ ] Monitor logs for errors (15 minutes)
- [ ] Run secrets scan: `scripts/scan-secrets.sh --all`
- [ ] Update incident report with completion time
- [ ] Delete backup `.env` files (after 24h successful operation)

---

## Additional Resources

- [Secrets Audit Report](./SECRETS_AUDIT_REPORT.md) - List of all exposed secrets
- [Incident Response Guide](./INCIDENT_RESPONSE.md) - Emergency procedures
- [Security Policy](../SECURITY.md) - Overall security practices
- [Gitleaks Documentation](https://github.com/gitleaks/gitleaks) - Secrets scanning tool

## Support

For questions or issues during rotation:

1. Check logs: `tail -f backend/logs/app.log`
2. Run diagnostics: `pnpm run diagnose`
3. Review this guide's "Common Issues" sections
4. Contact security team or open GitHub issue

---

**Last Updated:** 2026-01-24
**Next Review:** 2026-04-24 (90 days)
