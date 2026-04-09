# 20-01 — E2E Credentials (STAGING — DUMMY DATA)

**⚠️ DO NOT COMMIT. This file MUST stay gitignored. Rotate once droplet moves behind TLS.**

All three accounts share the same password for staging convenience. The Supabase project is staging-only with dummy data per user direction.

| Variable                        | Value                                                                                           |
| ------------------------------- | ----------------------------------------------------------------------------------------------- |
| `E2E_BASE_URL`                  | `http://138.197.195.242`                                                                        |
| `E2E_ADMIN_EMAIL`               | `admin@e2e.test`                                                                                |
| `E2E_ADMIN_PASSWORD`            | `IntlDossier!Staging2026`                                                                       |
| `E2E_ANALYST_EMAIL`             | `analyst@e2e.test`                                                                              |
| `E2E_ANALYST_PASSWORD`          | `IntlDossier!Staging2026`                                                                       |
| `E2E_INTAKE_EMAIL`              | `intake@e2e.test`                                                                               |
| `E2E_INTAKE_PASSWORD`           | `IntlDossier!Staging2026`                                                                       |
| `E2E_SUPABASE_URL`              | `https://zkrcjzdemdmwhearhfgg.supabase.co`                                                      |
| `E2E_SUPABASE_SERVICE_ROLE_KEY` | **NOT SET — user must provide from Supabase dashboard → Project Settings → API → service_role** |

## Rotation procedure (post-TLS)

```sql
-- Run via Supabase MCP with a real admin JWT
UPDATE auth.users
SET encrypted_password = crypt('<new-strong-password>', gen_salt('bf'))
WHERE email IN ('admin@e2e.test','analyst@e2e.test','intake@e2e.test');
```

Then update GitHub Actions secrets:

```bash
echo -n "<new-strong-password>" | gh secret set E2E_ADMIN_PASSWORD --repo alzahrani-khalid/Intl-Dossier-V2.0
# repeat for ANALYST and INTAKE
```
