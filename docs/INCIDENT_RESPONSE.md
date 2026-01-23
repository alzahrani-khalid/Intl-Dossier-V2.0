# Incident Response Guide: Exposed Secrets

This guide provides step-by-step procedures for responding to security incidents involving exposed secrets, API keys, passwords, or other sensitive credentials.

## Table of Contents

1. [Detection](#detection)
2. [Immediate Actions](#immediate-actions)
3. [Git History Cleanup](#git-history-cleanup)
4. [Notification Procedures](#notification-procedures)
5. [Prevention Measures](#prevention-measures)
6. [Post-Incident Review](#post-incident-review)

---

## Detection

### Automated Detection Methods

**Pre-commit Hook (Gitleaks)**
- Runs automatically before each commit
- Blocks commits containing secrets
- Review the output to identify exposed secrets

**CI/CD Pipeline Scanning**
- Runs on every pull request
- Checks entire codebase and commit history
- Review failed checks in GitHub Actions

**Manual Repository Scan**
```bash
# Scan entire repository history
pnpm scan-secrets

# Scan uncommitted changes only
pnpm scan-secrets:staged
```

### Manual Detection Methods

**Code Review Checklist**
- Check for hardcoded API keys or tokens
- Look for connection strings with embedded credentials
- Review environment variable usage patterns
- Examine configuration files (especially new files)

**Common Locations to Check**
```
# High-risk files
*.env (not .env.example)
config/*.json
src/**/*.ts
supabase/**/*.ts
tests/**/*.ts

# Common patterns
SUPABASE_URL = "https://..."
SUPABASE_SERVICE_ROLE_KEY = "eyJhbGci..."
API_KEY = "sk-..."
PASSWORD = "..."
```

### Types of Secrets to Detect

| Type | Pattern | Risk Level |
|------|---------|------------|
| Supabase Service Role Key | `eyJhbGci...` | **CRITICAL** |
| Supabase URL + Anon Key | `https://[project].supabase.co` + key | **HIGH** |
| API Keys | `sk-...`, `api_key_...` | **HIGH** |
| OAuth Tokens | `ghp_...`, `gho_...` | **HIGH** |
| Passwords | Plaintext credentials | **CRITICAL** |
| Private Keys | `-----BEGIN PRIVATE KEY-----` | **CRITICAL** |
| Database Connection Strings | `postgresql://user:pass@host` | **CRITICAL** |

---

## Immediate Actions

### Phase 1: Containment (0-15 minutes)

**Step 1: Stop the Exposure**

If secrets are in uncommitted files:
```bash
# DO NOT commit the file
# Remove the secret immediately
git restore <file>  # Discard changes
# OR edit the file to remove the secret
```

If secrets were just committed locally (not pushed):
```bash
# Reset the commit (keeps file changes)
git reset --soft HEAD~1

# Remove the secret from files
# Then recommit without the secret
```

If secrets were pushed to remote:
```bash
# DO NOT PANIC - the secret is public, but we can limit damage
# Proceed to Step 2 immediately
```

**Step 2: Revoke/Rotate the Exposed Secret**

Rotate credentials **immediately** - assume the secret is compromised:

**Supabase Keys:**
1. Go to [Supabase Dashboard](https://app.supabase.com) > Project Settings > API
2. Click "Reset Service Role Key" (or relevant key)
3. Copy the new key
4. Update all local `.env` files with new key
5. Update deployment environments (staging, production)

**Other Services:**
- Follow the service-specific key rotation procedure
- Document the rotation in your incident log

**Step 3: Assess the Impact**

Determine the scope of exposure:
```bash
# Check git history for how long the secret existed
git log --all --full-history --oneline -- path/to/file

# Check if secret was pushed to remote
git log --remotes --oneline -- path/to/file

# Check all branches
git log --all --grep="secret\|password\|key" --oneline
```

Impact assessment checklist:
- [ ] Was the secret pushed to GitHub/remote repository?
- [ ] Is the repository public or private?
- [ ] How long was the secret exposed?
- [ ] Was the secret in main/master branch or feature branch?
- [ ] Do forks or clones exist?
- [ ] Was the secret used in production?

---

## Git History Cleanup

### WARNING: History Rewriting

**⚠️ CRITICAL: Rewriting git history is dangerous and affects all collaborators**

- Coordinate with your team before proceeding
- Ensure all team members have pushed their work
- After cleanup, all team members must re-clone the repository

### Method 1: BFG Repo-Cleaner (Recommended)

**Install BFG:**
```bash
# macOS
brew install bfg

# Or download from https://rtyley.github.io/bfg-repo-cleaner/
```

**Cleanup Process:**
```bash
# 1. Clone a fresh copy
git clone --mirror https://github.com/your-org/intl-dossier.git

# 2. Create a file with secrets to remove
cat > secrets.txt << EOF
your-secret-key-here
another-secret-here
EOF

# 3. Run BFG to remove secrets
bfg --replace-text secrets.txt intl-dossier.git

# 4. Clean up repository
cd intl-dossier.git
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 5. Force push to remote (DANGEROUS - coordinate with team)
git push --force --all
git push --force --tags

# 6. Delete the mirror clone
cd ..
rm -rf intl-dossier.git

# 7. All team members must re-clone
# Team members: git clone https://github.com/your-org/intl-dossier.git
```

### Method 2: git-filter-repo (Advanced)

**Install git-filter-repo:**
```bash
pip install git-filter-repo
```

**Remove specific file from history:**
```bash
# Clone a fresh copy
git clone https://github.com/your-org/intl-dossier.git
cd intl-dossier

# Remove file from all history
git filter-repo --path path/to/.env.test --invert-paths

# Force push (DANGEROUS - coordinate with team)
git push --force --all
git push --force --tags
```

**Remove text pattern from all files:**
```bash
git filter-repo --replace-text <(echo "literal:eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9==>REDACTED")
```

### Method 3: Interactive Rebase (Recent Commits Only)

If the secret was added in recent commits (last 1-5 commits):

```bash
# Rebase last N commits
git rebase -i HEAD~5

# In the editor, change 'pick' to 'edit' for commits with secrets
# Save and close

# For each commit marked as 'edit':
# 1. Remove the secret from files
git add path/to/file
git commit --amend --no-edit

# 2. Continue rebase
git rebase --continue

# After all commits are cleaned
git push --force-with-lease
```

### Verification After Cleanup

**Verify secrets are removed:**
```bash
# Scan the cleaned repository
pnpm scan-secrets

# Search for specific patterns
git log --all --full-history -S "eyJhbGci" --oneline

# Check all branches
git grep -i "api_key\|secret\|password" $(git rev-list --all)
```

---

## Notification Procedures

### Internal Notification (Required)

**Step 1: Notify Security Team**
- Email: security@yourdomain.com
- Subject: `SECURITY INCIDENT: Exposed Secrets - [Project Name]`
- Include:
  - Type of secret exposed (API key, password, etc.)
  - Service/platform affected (Supabase, AWS, etc.)
  - Exposure timeline (when committed, when pushed, when detected)
  - Actions taken (key rotated, history cleaned)
  - Current status (contained, investigating, resolved)

**Step 2: Notify Development Team**

If git history cleanup is required:
```
Team Message Template:
---
Subject: URGENT: Git Repository Cleanup Required

A security incident was detected involving exposed secrets in our repository.

REQUIRED ACTIONS:
1. Push any uncommitted work immediately
2. Wait for confirmation before pulling
3. After cleanup, re-clone the repository:
   git clone https://github.com/your-org/intl-dossier.git

DO NOT:
- Pull or push until cleanup is complete
- Use old local clones after cleanup

Status updates will be posted in #engineering-alerts

Timeline:
- Cleanup scheduled: [TIME]
- Expected completion: [TIME]
---
```

**Step 3: Notify Project Manager/Stakeholders**

For production secrets:
- Inform project manager immediately
- Assess business impact (service disruption, data exposure risk)
- Coordinate communication with affected parties if necessary

### External Notification (If Required)

**When to notify external parties:**
- Public repository with exposed production secrets
- Customer data potentially accessed
- Regulatory compliance requirements (GDPR, HIPAA, etc.)
- Service provider requires breach notification

**GitHub Security Advisories:**
```bash
# If repository is public, consider creating a security advisory
# Go to: https://github.com/your-org/intl-dossier/security/advisories
# Click "New draft security advisory"
```

### Incident Log Template

Create an incident log document:

```markdown
# Security Incident Log: Exposed Secrets

**Incident ID:** INC-2024-001
**Date Detected:** YYYY-MM-DD HH:MM UTC
**Detected By:** [Name]
**Severity:** [Critical/High/Medium/Low]

## Incident Details
- **Secret Type:** Supabase Service Role Key
- **File(s) Affected:** backend/.env.test
- **Commit Hash:** abc123def456
- **Exposure Duration:** 2024-01-20 to 2024-01-24 (4 days)
- **Repository Visibility:** Private
- **Branches Affected:** main, feature/auth-integration

## Timeline
- **2024-01-20 14:30 UTC:** Secret committed to repository
- **2024-01-20 14:35 UTC:** Pushed to GitHub
- **2024-01-24 09:00 UTC:** Detected by automated scan
- **2024-01-24 09:05 UTC:** Secret rotated
- **2024-01-24 09:30 UTC:** Git history cleaned
- **2024-01-24 10:00 UTC:** Incident resolved

## Actions Taken
1. ✅ Rotated Supabase Service Role Key
2. ✅ Cleaned git history using BFG Repo-Cleaner
3. ✅ Updated all deployment environments
4. ✅ Notified development team
5. ✅ Verified removal with secrets scan

## Impact Assessment
- Repository is private (limited exposure)
- No evidence of unauthorized access
- No customer data compromised
- Service continuity maintained

## Root Cause
Developer committed `.env.test` file instead of `.env.test.example`

## Preventive Measures
- Pre-commit hooks now enforced on all developer machines
- Added `.env.test` to `.gitignore`
- Team training on secrets management scheduled

## Lessons Learned
[Document key takeaways and improvements]
```

---

## Prevention Measures

### Technical Controls

**1. Pre-commit Hooks (Mandatory)**

Ensure all developers have hooks installed:
```bash
# Install husky and gitleaks hook
pnpm install

# Verify hook is active
ls -la .git/hooks/pre-commit
cat .git/hooks/pre-commit
```

**2. .gitignore Enforcement**

Verify critical patterns are ignored:
```bash
# Check .gitignore includes:
*.env
*.env.local
*.env.test
*.env.production
!*.env.example
!*.env.test.example

# Verify ignored files are not tracked
git check-ignore -v .env.test
```

**3. CI/CD Pipeline Scanning**

GitHub Actions workflow (`.github/workflows/security-scan.yml`):
```yaml
name: Security Scan
on: [push, pull_request]
jobs:
  gitleaks:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      - uses: gitleaks/gitleaks-action@v2
```

**4. Environment Variable Templates**

Always create `.env.example` files:
```bash
# .env.test.example
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
SUPABASE_ANON_KEY=your-anon-key-here
```

**5. Code Review Checklist**

Mandatory checks for all PRs:
- [ ] No hardcoded secrets or API keys
- [ ] Environment variables used for all credentials
- [ ] `.env` files not committed
- [ ] Security scan passes
- [ ] No plaintext passwords

### Process Controls

**1. Developer Onboarding**

New developers must:
- Complete secrets management training
- Set up pre-commit hooks on day 1
- Review SECURITY.md and this incident response guide
- Practice using `.env.example` workflow

**2. Regular Security Audits**

Schedule quarterly reviews:
```bash
# Full repository scan
pnpm scan-secrets

# Review .gitignore patterns
git ls-files --others --ignored --exclude-standard

# Check for orphaned credentials
git grep -i "api_key\|secret\|password" $(git rev-list --all)
```

**3. Secrets Rotation Policy**

Establish rotation schedule:
- **Production keys:** Rotate every 90 days
- **Staging/dev keys:** Rotate every 180 days
- **After team member departure:** Rotate within 24 hours
- **After suspected compromise:** Rotate immediately

**4. Access Control**

Limit who can access production secrets:
- Use secret management tools (Vault, AWS Secrets Manager, Supabase Vault)
- Principle of least privilege
- Audit access logs regularly

### Developer Best Practices

**DO:**
- ✅ Use `.env.example` templates
- ✅ Copy example to `.env` and fill in actual values
- ✅ Keep `.env` files local only
- ✅ Run `pnpm scan-secrets:staged` before committing
- ✅ Use environment variables in code: `process.env.API_KEY`
- ✅ Rotate keys immediately if exposed
- ✅ Review git diff before committing

**DON'T:**
- ❌ Commit `.env` files
- ❌ Hardcode secrets in source code
- ❌ Share secrets via Slack/email/chat
- ❌ Disable pre-commit hooks
- ❌ Use production keys in development
- ❌ Store secrets in code comments
- ❌ Screenshot secrets (images can leak)

### Training Materials

**Required Reading:**
1. [SECURITY.md](../SECURITY.md) - Secrets management guidelines
2. [SECRETS_ROTATION_GUIDE.md](./SECRETS_ROTATION_GUIDE.md) - Key rotation procedures
3. This incident response guide

**Practical Exercises:**
1. Set up local environment using `.env.example`
2. Trigger pre-commit hook by committing a test secret
3. Run manual secrets scan: `pnpm scan-secrets`
4. Practice rotating a non-production key

---

## Post-Incident Review

### Review Meeting (Within 48 hours)

**Attendees:**
- Developer(s) involved
- Security team lead
- Engineering manager
- QA/DevOps representative

**Agenda:**
1. Timeline review - what happened and when
2. Root cause analysis - why did this happen
3. Impact assessment - what was affected
4. Response effectiveness - what went well, what didn't
5. Action items - preventive measures

### Root Cause Analysis (5 Whys)

Example:
```
Problem: Supabase service key was committed to repository

Why? Developer committed .env.test file
Why? Developer didn't know .env.test should not be committed
Why? .env.test was not in .gitignore
Why? .gitignore template was incomplete
Why? No verification process for .gitignore completeness

Root Cause: Missing .gitignore verification in project setup
Action: Add .gitignore verification to CI/CD pipeline
```

### Action Items Template

| Action | Owner | Due Date | Status |
|--------|-------|----------|--------|
| Add .env.test to .gitignore | DevOps | 2024-01-25 | ✅ Done |
| Enforce pre-commit hooks | Engineering | 2024-01-26 | 🔄 In Progress |
| Update developer onboarding | HR/Engineering | 2024-01-30 | 📋 Planned |
| Quarterly security training | Security Team | 2024-02-15 | 📋 Planned |

### Metrics to Track

Monitor incident response effectiveness:
- **Detection Time:** Time from exposure to detection
- **Response Time:** Time from detection to containment
- **Recovery Time:** Time from containment to full resolution
- **Incident Frequency:** Number of incidents per quarter
- **Repeat Incidents:** Same type of incident recurring

**Target SLAs:**
- Detection: < 24 hours (ideally immediate via pre-commit hook)
- Response: < 15 minutes (critical secrets)
- Recovery: < 2 hours (git history cleanup)

### Continuous Improvement

Update security controls based on incidents:
- Review and update `.gitleaks.toml` configuration
- Enhance pre-commit hook coverage
- Improve developer training materials
- Add new secret patterns to scanning tools
- Automate more of the incident response process

---

## Quick Reference Card

### Incident Response Checklist

**Immediate Actions (0-15 min):**
- [ ] Stop the exposure (don't commit/push)
- [ ] Rotate the exposed secret immediately
- [ ] Assess impact (public repo? how long exposed?)
- [ ] Notify security team

**Cleanup (15-60 min):**
- [ ] Clean git history (if pushed to remote)
- [ ] Verify secrets removed (run scan)
- [ ] Update all deployment environments
- [ ] Notify development team (if history cleanup required)

**Recovery (1-24 hours):**
- [ ] Document incident in log
- [ ] Conduct post-incident review
- [ ] Implement preventive measures
- [ ] Update security documentation

### Emergency Contacts

- **Security Team:** security@yourdomain.com
- **On-Call Engineer:** [Contact info]
- **DevOps Lead:** [Contact info]
- **Supabase Support:** https://supabase.com/dashboard/support

### Useful Commands

```bash
# Scan for secrets
pnpm scan-secrets

# Remove file from git tracking (but keep locally)
git rm --cached path/to/file

# Check if file is ignored
git check-ignore -v .env.test

# Search git history for pattern
git log --all -S "secret-pattern" --oneline

# Verify secrets are removed after cleanup
git grep -i "api_key\|secret\|password" $(git rev-list --all)
```

---

## Document Control

- **Version:** 1.0
- **Last Updated:** 2024-01-24
- **Owner:** Security Team
- **Review Frequency:** Quarterly
- **Next Review:** 2024-04-24

---

## Related Documentation

- [SECURITY.md](../SECURITY.md) - Security guidelines and best practices
- [SECRETS_ROTATION_GUIDE.md](./SECRETS_ROTATION_GUIDE.md) - Step-by-step key rotation procedures
- [SECRETS_AUDIT_REPORT.md](./SECRETS_AUDIT_REPORT.md) - Latest security audit findings
- [.gitleaks.toml](../.gitleaks.toml) - Gitleaks scanning configuration
