---
phase: 14
slug: production-deployment
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-04-06
---

# Phase 14 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | vitest (unit/integration), curl/shell scripts (infra verification) |
| **Config file** | `vitest.config.ts` (existing), shell scripts (new) |
| **Quick run command** | `pnpm test --run` |
| **Full suite command** | `pnpm test --run && bash deploy/verify-deployment.sh` |
| **Estimated runtime** | ~30 seconds (tests) + ~10 seconds (infra checks) |

---

## Sampling Rate

- **After every task commit:** Run `pnpm test --run`
- **After every plan wave:** Run `pnpm test --run && bash deploy/verify-deployment.sh`
- **Before `/gsd-verify-work`:** Full suite must be green
- **Max feedback latency:** 40 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 14-01-01 | 01 | 1 | DEPLOY-01 | T-14-01 | TLS 1.2+ enforced, HSTS header present | infra | `curl -sI https://{domain} \| grep -i strict-transport` | ❌ W0 | ⬜ pending |
| 14-01-02 | 01 | 1 | DEPLOY-01 | T-14-02 | Cert auto-renews via certbot | infra | `docker exec certbot certbot renew --dry-run` | ❌ W0 | ⬜ pending |
| 14-02-01 | 02 | 1 | DEPLOY-02 | — | N/A | integration | `gh workflow run deploy.yml --dry-run` | ❌ W0 | ⬜ pending |
| 14-02-02 | 02 | 1 | DEPLOY-02 | — | N/A | infra | `ssh root@138.197.195.242 'docker ps --format table'` | ❌ W0 | ⬜ pending |
| 14-03-01 | 03 | 2 | DEPLOY-03 | — | N/A | infra | `curl -sf http://138.197.195.242/health` | ✅ | ⬜ pending |
| 14-03-02 | 03 | 2 | DEPLOY-04 | — | N/A | manual | See Manual-Only Verifications | ❌ W0 | ⬜ pending |
| 14-03-03 | 03 | 2 | DEPLOY-05 | T-14-03 | Rollback completes <60s, no dropped requests | infra | `bash deploy/test-rollback.sh` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `deploy/verify-deployment.sh` — TLS, health, HSTS verification script
- [ ] `deploy/test-rollback.sh` — Rollback procedure test script
- [ ] Existing vitest infrastructure covers unit tests

*Infrastructure verification requires shell scripts since these are DevOps checks, not application code tests.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Supabase backup restore | DEPLOY-04 | Requires Supabase dashboard access and staging project | 1. Navigate to Supabase dashboard → Backups 2. Download latest backup 3. Restore to staging project zkrcjzdemdmwhearhfgg 4. Verify data integrity 5. Document procedure in BACKUP_RESTORE.md |
| DNS A-record propagation | DEPLOY-01 | External DNS provider, manual purchase | 1. Purchase domain 2. Set A-record → 138.197.195.242 3. Verify with `dig +short {domain}` 4. Wait for propagation |
| External monitor alert | DEPLOY-03 | Requires signup to monitoring service | 1. Create account on selected monitor service 2. Add HTTPS health check 3. Configure alert channel (email/Slack) 4. Verify alert fires by stopping nginx |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 40s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
