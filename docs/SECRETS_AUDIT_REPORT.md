# Secrets Audit Report

**Generated:** 2026-01-24
**Scan Tool:** gitleaks v8.30.0
**Repository:** Intl-DossierV2.0
**Classification:** CRITICAL SECURITY FINDING (CWE-798)

---

## Executive Summary

A comprehensive git history scan identified **111 exposed secrets** across **61 unique files** in **16 commits** spanning from October 2025 to January 2026. This includes:

- ✅ **9 critical production secrets** requiring immediate rotation
- ⚠️ **33 Supabase URL/key combinations** in documentation
- ⚠️ **22 generic passwords** in examples and config files
- ⚠️ **21 database connection strings** with credentials
- ℹ️ **26 test/example credentials** (low risk but should be sanitized)

### Severity Assessment

| Severity | Count | Impact |
|----------|-------|--------|
| **CRITICAL** | 9 | Production keys with full system access exposed |
| **HIGH** | 33 | Supabase URLs with embedded keys (documentation) |
| **MEDIUM** | 43 | Database passwords, generic secrets in config files |
| **LOW** | 26 | Test credentials, example values, bearer tokens |

---

## Critical Findings Requiring IMMEDIATE Action

### 1. Production Environment Files

| File | Secret Type | Commit | Status | Action Required |
|------|-------------|--------|--------|-----------------|
| `docker/anythingllm.env` | AnythingLLM SIG_KEY | 5cbe7407 | **TRACKED** | 🚨 Untrack + Rotate |
| `docker/anythingllm.env` | AnythingLLM SIG_SALT | 5cbe7407 | **TRACKED** | 🚨 Untrack + Rotate |
| `backend/.env.test` | Supabase SERVICE_ROLE_KEY | 668f541b, 12dd006a | Untracked | ⚠️ Rotate if production key |
| `backend/.env.test` | Supabase ANON_KEY | 668f541b, 12dd006a | Untracked | ⚠️ Rotate if production key |

### 2. Documented API Keys

| File | Secret Type | Commit | Status | Action Required |
|------|-------------|--------|--------|-----------------|
| `frontend/.aceternity/INSTALLATION_NOTES.md` | Aceternity Pro API Key | 5a66d324 | Tracked | 🚨 Rotate + Remove |
| `docs/plans/2025-10-28-aceternity-pro-sidebar-implementation.md` | Aceternity Pro API Key | 2eec172e | Tracked | 🚨 Rotate + Remove |

### 3. Quickstart/Example Keys

| File | Secret Type | Commit | Status | Action Required |
|------|-------------|--------|--------|-----------------|
| `specs/018-create-an-expo/quickstart.md` | Supabase ANON_KEY | 87d99c6b | Tracked | ⚠️ Verify if test/prod key |

---

## All Exposed Files by Category

### Production Environment Files (1 file, 2 findings)

| File | Findings | Secret Types | Severity |
|------|----------|--------------|----------|
| `docker/anythingllm.env` | 2 | SIG_KEY, SIG_SALT | **CRITICAL** |

**Impact:** Full access to AnythingLLM instance, ability to sign/verify JWT tokens, impersonate users.

### Documentation Files (14 files, 32 findings)

| File | Findings | Secret Types |
|------|----------|--------------|
| `docs/self-hosted-migration/01-setup-guide.md` | 8 | Supabase URLs, DB passwords |
| `docs/deployment.md` | 4 | Supabase URLs, DB passwords, bearer tokens |
| `README.md` | 3 | Supabase URLs |
| `docs/TROUBLESHOOTING.md` | 2 | Supabase URLs |
| `docs/DOCKER_SETUP.md` | 2 | Supabase URLs |
| `backend/README.md` | 2 | Supabase URLs |
| `monitoring/README.md` | 2 | Supabase URLs, private keys |
| `DEPLOY_INSTRUCTIONS.md` | 2 | Aceternity API keys, Supabase URLs |
| `FRONT_DOOR_INTAKE_FINAL_STATUS.md` | 2 | Supabase URLs |
| `frontend/.aceternity/INSTALLATION_NOTES.md` | 1 | Aceternity Pro API Key |
| `frontend/.aceternity/ACETERNITY_PRO_COMPONENTS.md` | 1 | Supabase URLs |
| `docs/monitoring/README.md` | 1 | Private keys |
| `docs/plans/2025-10-28-aceternity-pro-sidebar-implementation.md` | 1 | Aceternity Pro API Key |
| `docs/self-hosted-migration/scripts/setup-monitoring.sh` | 2 | Supabase URLs, DB passwords |

**Impact:** Public documentation exposes connection details and API patterns.

### Specification Files (14 files, 28 findings)

| File | Findings | Secret Types |
|------|----------|--------------|
| `specs/029-dynamic-country-intelligence/api-contracts/examples.md` | 10 | Bearer tokens |
| `specs/022-after-action-structured/quickstart.md` | 3 | Supabase URLs |
| `specs/029-dynamic-country-intelligence/api-contracts/README.md` | 2 | Supabase URLs |
| `specs/018-create-an-expo/quickstart.md` | 2 | Supabase ANON_KEY, URLs |
| `specs/021-apply-gusto-design/contracts/notifications.md` | 2 | Bearer tokens |
| Other spec files (9 files) | 9 | Various types |

**Impact:** Example code in specs contains real authentication tokens and keys.

### Test Files (4 files, 9 findings)

| File | Findings | Secret Types |
|------|----------|--------------|
| `backend/.env.test` | 6 | Supabase SERVICE_ROLE_KEY, ANON_KEY, URLs |
| `backend/tests/integration/commitments.test.ts` | 1 | Supabase URLs |
| `backend/tests/integration/setup.ts` | 1 | Supabase URLs |
| `test-secret.txt` | 1 | Generic password |

**Impact:** Test files may contain production keys instead of test-only credentials.

### Configuration Examples (4 files, 4 findings)

| File | Findings | Secret Types |
|------|----------|--------------|
| `docs/self-hosted-migration/configs/docker-compose.example.yml` | 4 | DB passwords |

**Impact:** Low - these are meant to be examples, but should use placeholders.

### Other Files (28 files, 40 findings)

Includes docker-compose.yml, agent outputs, migration scripts, and various config files.

---

## Secret Types Breakdown

| Secret Type | Count | Criticality | Examples |
|-------------|-------|-------------|----------|
| **supabase-url-with-key** | 33 | HIGH | URLs with embedded JWT keys |
| **generic-password** | 22 | MEDIUM | `postgres`, `changeme123`, etc. |
| **database-connection-string** | 21 | HIGH | Full PostgreSQL connection strings |
| **bearer-token** | 19 | MEDIUM | JWT tokens in API examples |
| **postgres-password** | 4 | MEDIUM | PostgreSQL passwords |
| **supabase-anon-key** | 3 | HIGH | Supabase anonymous JWT keys |
| **private-key** | 2 | CRITICAL | SSH/TLS private keys |
| **aceternity-pro-api-key** | 2 | HIGH | Paid service API keys |
| **supabase-service-role-key** | 2 | **CRITICAL** | Bypasses all RLS policies |
| **anythingllm-sig-key** | 1 | **CRITICAL** | JWT signing key |
| **anythingllm-sig-salt** | 1 | **CRITICAL** | JWT salt for hashing |
| **generic-api-key** | 1 | MEDIUM | Generic API key pattern |

---

## Git Commits Involved

### Summary Statistics

- **Total commits with secrets:** 16
- **Date range:** October 2025 - January 2026
- **Most recent exposure:** 2026-01-23

### Commits Requiring History Cleanup

| Commit Hash | Date | Files | Secret Types | Notes |
|-------------|------|-------|--------------|-------|
| `698ec4384449` | 2026-01-23 | 1 | 1 | Recent commit |
| `e17af817f252` | 2026-01-23 | 1 | 1 | Recent commit |
| `0bf3f483af10` | 2026-01-23 | 3 | 2 | Recent commit |
| `da0de5783912` | 2026-01-13 | 2 | 1 | |
| `5cbe74077428` | 2026-01-04 | 3 | 4 | **Contains AnythingLLM keys** |
| `828ec25eee5b` | 2025-11-28 | 2 | 2 | |
| `0afafdaa813f` | 2025-11-16 | 1 | 1 | |
| `5a66d324a155` | 2025-11-09 | 8 | 3 | **Contains Aceternity Pro key** |
| `668f541b8321` | 2025-10-26 | 10 | 6 | **Major leak - Supabase keys** |
| `2eec172ed68a` | 2025-10-27 | 1 | 1 | Aceternity Pro key in docs |
| `12dd006a...` | (date TBD) | Multiple | Multiple | Supabase keys |
| `87d99c6b...` | (date TBD) | 1 | 1 | Quickstart with real key |
| +4 more commits | Various | Various | Various | Full details in .gitleaks-report.json |

**⚠️ WARNING:** These commits are part of git history. Simply removing files from HEAD does NOT remove them from history. See "Git History Cleanup" section below.

---

## Credential Rotation Checklist

### 🚨 IMMEDIATE ACTION REQUIRED (Within 24 hours)

- [ ] **AnythingLLM Credentials**
  - [ ] Generate new SIG_KEY (64-character hex string)
  - [ ] Generate new SIG_SALT (16-character random string)
  - [ ] Update `docker/anythingllm.env` (local copy only, not committed)
  - [ ] Restart AnythingLLM container: `docker compose restart anythingllm`
  - [ ] Verify users can still authenticate
  - [ ] Monitor logs for authentication errors

- [ ] **Supabase SERVICE_ROLE_KEY** (if production key exposed)
  - [ ] Login to Supabase dashboard → Project Settings → API
  - [ ] Click "Reset service_role key" and confirm
  - [ ] Update all backend services with new key:
    - [ ] `backend/.env`
    - [ ] `backend/.env.test` (if uses production)
    - [ ] Production deployment secrets (DigitalOcean, etc.)
  - [ ] Restart backend services
  - [ ] Test admin operations (bypass RLS)
  - [ ] Monitor for failed API calls

- [ ] **Aceternity Pro API Key**
  - [ ] Login to https://pro.aceternity.com/account
  - [ ] Revoke current API key
  - [ ] Generate new API key
  - [ ] Update `frontend/.env.local` with new key
  - [ ] Update CI/CD environment variables (if applicable)
  - [ ] Test component installation: `npx shadcn@latest add @aceternity-pro/...`

### ⚠️ HIGH PRIORITY (Within 1 week)

- [ ] **Supabase ANON_KEY** (if production key in specs/docs)
  - [ ] Review `specs/018-create-an-expo/quickstart.md`
  - [ ] Verify if key is test or production
  - [ ] If production: Rotate via Supabase dashboard → Reset anon key
  - [ ] Update all frontend clients
  - [ ] Update mobile apps (if deployed)
  - [ ] Update quickstart documentation with placeholder

- [ ] **Database Passwords** (if production credentials)
  - [ ] Change PostgreSQL password via Supabase dashboard
  - [ ] Update connection strings in all services
  - [ ] Test database connectivity
  - [ ] Update backup scripts

### 📋 STANDARD ROTATION (Within 1 month)

- [ ] **Test/Example Credentials**
  - [ ] Replace all `password: "postgres"` in examples with `password: "YOUR_PASSWORD_HERE"`
  - [ ] Replace all `changeme123` with `[YOUR_PASSWORD]`
  - [ ] Replace all `secret123` with `[YOUR_SECRET_KEY]`
  - [ ] Update bearer tokens in API examples with `[YOUR_TOKEN]`

- [ ] **Documentation URLs**
  - [ ] Replace all Supabase project URLs with placeholder: `https://YOUR_PROJECT.supabase.co`
  - [ ] Replace all API keys in docs with `your-api-key-here`
  - [ ] Review and sanitize all quickstart guides

---

## Impact Assessment

### Security Impact

| System | Impact Level | Risk |
|--------|--------------|------|
| **AnythingLLM** | CRITICAL | Exposed SIG_KEY/SIG_SALT allows JWT forgery, user impersonation, unauthorized access to AI conversations and embeddings |
| **Supabase (SERVICE_ROLE_KEY)** | CRITICAL | Bypasses all Row Level Security policies, full database read/write/delete access, can access all user data |
| **Supabase (ANON_KEY)** | HIGH | Public API access, limited by RLS but can enumerate endpoints and data structures |
| **Aceternity Pro** | MEDIUM | Unauthorized access to premium UI components, potential billing fraud |
| **PostgreSQL Passwords** | HIGH | Direct database access if network allows, data exfiltration, tampering |

### Business Impact

- **Data Breach Risk:** HIGH - SERVICE_ROLE_KEY exposure = full database access
- **Financial Risk:** MEDIUM - Aceternity Pro API key misuse, potential OpenAI API key exposure
- **Compliance Impact:** HIGH - May violate data protection regulations (GDPR, etc.)
- **Reputation Risk:** MEDIUM-HIGH - If exploited and disclosed publicly

### Exploitation Likelihood

- **Public Repository:** N/A (repository appears to be private)
- **Insider Threat:** MEDIUM - Anyone with repository access has credentials
- **Third-party Tools:** HIGH - If repository synced to external tools (IDEs, CI/CD)
- **Backup/Clone Exposure:** HIGH - Credentials in all clones and backups

---

## Remediation Steps

### Phase 1: Immediate Containment (DONE ✅)

- [x] Run gitleaks scan to identify all secrets
- [x] Generate audit report with findings
- [x] Add `.gitleaks-report.json` to `.gitignore` to prevent accidental commit

### Phase 2: Remove from Current HEAD (In Progress)

- [ ] Untrack `docker/anythingllm.env` from git
- [ ] Create `docker/anythingllm.env.example` template
- [ ] Verify `backend/.env.test` is not tracked
- [ ] Update `.gitignore` with explicit patterns
- [ ] Sanitize all documentation files with placeholders
- [ ] Remove exposed keys from spec files

### Phase 3: Rotate Credentials

- [ ] Follow "Credential Rotation Checklist" above
- [ ] Use `scripts/rotate-keys.sh` helper script (to be created)
- [ ] Refer to `docs/SECRETS_ROTATION_GUIDE.md` (to be created)

### Phase 4: Git History Cleanup (Optional but Recommended)

**⚠️ WARNING:** This requires force-push and coordination with all developers.

Options:

1. **git-filter-repo (Recommended)**
   ```bash
   # Install: pip install git-filter-repo
   git filter-repo --path docker/anythingllm.env --invert-paths
   git filter-repo --path backend/.env.test --invert-paths
   git filter-repo --replace-text <(echo "SIG_KEY=***REMOVED***")
   ```

2. **BFG Repo-Cleaner**
   ```bash
   # Download from: https://rtyley.github.io/bfg-repo-cleaner/
   bfg --delete-files anythingllm.env
   bfg --replace-text passwords.txt
   git reflog expire --expire=now --all
   git gc --prune=now --aggressive
   ```

3. **Coordinate with Team**
   - Notify all developers of history rewrite
   - All must re-clone repository after rewrite
   - Update CI/CD to pull fresh copy
   - Verify all deployments use new credentials

### Phase 5: Prevention (Automated Scanning)

- [ ] Install gitleaks pre-commit hook (subtask-4-1)
- [ ] Add CI/CD secrets scanning job (subtask-4-2)
- [ ] Add npm scripts for manual scanning (subtask-4-3)
- [ ] Test pre-commit hook blocks secrets (subtask-4-4)
- [ ] Update SECURITY.md with procedures (subtask-5-1)

---

## Monitoring & Verification

### Post-Rotation Monitoring (First 7 Days)

- [ ] Monitor Supabase logs for:
  - Failed authentication attempts with old keys
  - Unusual API call patterns
  - Unauthorized data access attempts
- [ ] Monitor AnythingLLM logs for:
  - JWT validation failures
  - Unauthorized user sessions
  - Suspicious conversation access
- [ ] Check Aceternity Pro account for:
  - Unexpected API usage
  - New installations from unknown IPs

### Verification Commands

```bash
# Verify files are untracked
git ls-files | grep -E 'docker/anythingllm\.env|backend/\.env\.test'
# Should return empty

# Verify gitignore works
git check-ignore -v docker/anythingllm.env backend/.env.test
# Should show .gitignore rule matching

# Scan for remaining secrets
bash scripts/scan-secrets.sh --all
# Should report 0 findings (or only false positives in examples)

# Verify pre-commit hook installed
test -f .husky/pre-commit && grep -q scan-secrets .husky/pre-commit
# Should exit 0
```

---

## References

- **CWE-798:** Use of Hard-coded Credentials
  - https://cwe.mitre.org/data/definitions/798.html
- **OWASP Top 10 2021:** A07:2021 – Identification and Authentication Failures
  - https://owasp.org/Top10/A07_2021-Identification_and_Authentication_Failures/
- **Gitleaks Documentation:** https://github.com/gitleaks/gitleaks
- **Supabase Security Best Practices:** https://supabase.com/docs/guides/security
- **Git History Rewriting Guide:** https://git-scm.com/book/en/v2/Git-Tools-Rewriting-History

---

## Report Metadata

- **Generated By:** gitleaks v8.30.0
- **Scan Date:** 2026-01-23
- **Report Date:** 2026-01-24
- **Scan Duration:** 11 seconds
- **Commits Scanned:** 242 commits (~157.88 MB)
- **Configuration:** `.gitleaks.toml` (24 custom rules)
- **Raw Report:** `.gitleaks-report.json` (111 findings, 232 KB)

---

**Classification:** INTERNAL USE ONLY - Contains security-sensitive information

**Next Steps:**
1. Review this report with security team
2. Begin credential rotation (use checklist above)
3. Proceed to Phase 3 remediation (subtask-3-*)
4. Monitor for suspicious activity
5. Complete prevention phase (subtask-4-*)

**Questions or Concerns:**
- Security team contact: [Add security team contact]
- Escalation procedure: [Add escalation procedure]
- Incident response: See `docs/INCIDENT_RESPONSE.md` (to be created in subtask-5-3)
