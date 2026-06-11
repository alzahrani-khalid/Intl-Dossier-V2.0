# Quick Task 260610-fkn: P2 Security Pass — Research

**Researched:** 2026-06-10
**Domain:** Supabase RLS, edge-fn auth, XSS, dead-code removal
**Confidence:** HIGH (file:line verified in-repo; live staging facts supplied by orchestrator)

## Summary

Four independent security items. All verified against repo source + the orchestrator's live-staging facts (treated as ground truth, no DB access here). Findings are surgical: item 4 (role-source unification) is the largest and the only one needing a data backfill; items 1–3 are small, self-contained, and low-blast-radius.

**Primary recommendation:** Make `public.users.role` the single authorization truth. Remove all `user_metadata` / `app_metadata` role trust (8 admin route guards + 2 authStore fallbacks). Tighten `activity_stream` INSERT RLS to `actor_id = auth.uid()`. Add a local `escapeHtml` to briefing-books and wrap every DB-string interpolation. Delete the orphan `export/ExportDialog.tsx`.

---

## Item 4 — Role-source inventory (MOST IMPORTANT)

### Live ground truth (from orchestrator, do NOT re-verify)

- `public.users.role`: **all 393 = 'viewer'**. No admin in the profile table.
- `auth.users.raw_app_meta_data.role`: none. `raw_user_meta_data.role`: 1 `admin`, 1 `supervisor`, 7 `user`, 384 none.
- `user_metadata` is **client-writable** via `supabase.auth.updateUser()` → trusting it is a privilege-escalation hole. `app_metadata` is service-role-only (safe) but is **empty** here.

### Every place a role is read for authorization

| #   | File:line                                                       | Source read                                    | Roles accepted                  | Verdict                                                                                                                                                                           |
| --- | --------------------------------------------------------------- | ---------------------------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | `frontend/src/components/layout/Sidebar.tsx:63`                 | `users.role` (via authStore)                   | `admin`, `super_admin`          | **Canonical source** — keep. Today hides admin nav from EVERYONE (all=viewer).                                                                                                    |
| R2  | `frontend/src/store/authStore.ts:64` (login)                    | `users.role` w/ `\|\| 'viewer'` fallback       | n/a (populates store)           | OK — profile-first.                                                                                                                                                               |
| R3  | `frontend/src/store/authStore.ts:148` (checkAuth)               | `users.role` **`\|\| user_metadata.role`**     | n/a                             | **HOLE** — falls back to client-writable metadata. Drop the `\|\|` fallback.                                                                                                      |
| R4  | `frontend/src/store/authStore.ts:214` (handleAuthStateChange)   | `users.role` **`\|\| user_metadata.role`**     | n/a                             | **HOLE** — same fallback. Drop it.                                                                                                                                                |
| R5  | `frontend/src/routes/_protected/admin/approvals.tsx:45`         | `user_metadata.role \|\| app_metadata.role`    | `admin`                         | **HOLE** — switch to `users.role`.                                                                                                                                                |
| R6  | `frontend/src/routes/_protected/admin/preview-layouts.tsx:102`  | `user_metadata \|\| app_metadata`              | `admin`                         | **HOLE** — switch.                                                                                                                                                                |
| R7  | `frontend/src/routes/_protected/admin/ai-settings.tsx:54`       | `user_metadata \|\| app_metadata`              | `admin`                         | **HOLE** — switch. (`:130,:167` read `user_metadata.organization_id` — separate concern, out of scope.)                                                                           |
| R8  | `frontend/src/routes/_protected/admin/ai-usage.tsx:49`          | `user_metadata \|\| app_metadata`              | `admin`                         | **HOLE** — switch.                                                                                                                                                                |
| R9  | `frontend/src/routes/_protected/admin/field-permissions.tsx:96` | `user_metadata.role \|\| app_metadata.role`    | `admin`                         | **HOLE** — switch.                                                                                                                                                                |
| R10 | `frontend/src/routes/_protected/admin/data-retention.tsx:95`    | `user_metadata \|\| app_metadata`              | `admin`                         | **HOLE** — switch.                                                                                                                                                                |
| R11 | `frontend/src/routes/_protected/admin/system.tsx:36`            | `user_metadata \|\| app_metadata`              | `admin`                         | **HOLE** — switch.                                                                                                                                                                |
| R12 | `frontend/src/routes/_protected/audit-logs.tsx:1-5`             | **NONE** (only `_protected` session guard)     | —                               | **GAP** — no admin guard. Add `beforeLoad` on `users.role`.                                                                                                                       |
| R13 | `frontend/src/routes/_protected/users.tsx:4-6`                  | **NONE**                                       | —                               | **GAP** — `/users` ungated; decide directory-vs-admin (orchestrator scope: gate it).                                                                                              |
| R14 | `supabase/functions/audit-logs-viewer/index.ts:398-407`         | `users.role` (`.from('users').select('role')`) | `admin`, `editor`, `supervisor` | Correct SOURCE; **policy too broad** — narrow to `admin` for compliance trail.                                                                                                    |
| R15 | `supabase/functions/create-user/index.ts:201-208`               | `users.role`                                   | `admin`                         | Correct. BUT **writes** `user_metadata.role` (`:322,:407,:458,:486`) — perpetuates the distrustable signal. Stop writing it (or accept it's display-only & never read for authz). |
| R16 | `supabase/functions/assign-role/index.ts:111-118`               | `users.role`                                   | `admin`                         | Correct check. Also writes `user_metadata.role` (`:359,:407,:458`) — same note as R15.                                                                                            |
| R17 | `supabase/functions/deactivate-user/index.ts:61-68`             | `users.role`                                   | `admin`                         | Correct.                                                                                                                                                                          |
| R18 | `frontend/src/components/modern-nav/navigationData.ts:~297`     | `adminOnly` flag (renderer ignores it)         | —                               | Not in active shell (AppShell renders Sidebar). Out of scope / cosmetic.                                                                                                          |

### Verdict + recommended canonical pattern

**`public.users.role` is the truth everywhere. Remove every `user_metadata`/`app_metadata` role read.**

1. **authStore (R3, R4):** delete the `|| session.user.user_metadata?.role` fallback in `checkAuth` (`:148`) and `handleAuthStateChange` (`:214`). Role becomes `profile?.role ?? 'viewer'` (mirror login `:64`). `name`/`avatar` metadata fallbacks are fine — only the `role` fallback is the hole.
2. **Admin route guards (R5–R11):** replace the 7 `user_metadata||app_metadata` checks with a single shared guard reading `useAuthStore().user.role` (same source as Sidebar R1). Recommend one helper, e.g. `frontend/src/lib/auth/requireAdmin.ts`, used in each route `beforeLoad`. `super_admin` accepted alongside `admin` (matches Sidebar).
3. **Missing guards (R12, R13):** add `beforeLoad` admin gate to `audit-logs.tsx` and `users.tsx` using the same helper.
4. **Edge fns (R14):** narrow `audit-logs-viewer` to `['admin']` (drop `editor`,`supervisor`) so nav (admin-only) and edge agree. R15/R16: stop writing `user_metadata.role`, or document it as never-read-for-authz.
5. **Backfill (REQUIRED — no admin exists in `users.role` today):** promote the known admin/supervisor from `auth.users` metadata into `public.users.role`, matched on `auth.users.id`:

```sql
-- Promote the 1 admin + 1 supervisor (currently only in user_metadata) into the truth table.
-- Match on id; supervisor maps to a role the app accepts (keep 'supervisor' or fold to 'editor' per product).
UPDATE public.users u
SET role = au.raw_user_meta_data->>'role'
FROM auth.users au
WHERE u.id = au.id
  AND au.raw_user_meta_data->>'role' IN ('admin','supervisor');
-- Verify exactly the intended rows changed; do NOT mass-promote the 7 'user' rows.
```

> [ASSUMED A1] Whether `supervisor` should retain admin-nav visibility, or whether the 7 `user`-metadata accounts should map to `editor`, is a product decision — confirm before backfill. Backfilling the wrong rows grants real admin access.

---

## Item 1 — activity_stream RLS actor binding + visibility

**Migration:** `supabase/migrations/20260110100000_activity_feed_enhanced.sql`

- Table: `actor_id UUID NOT NULL REFERENCES auth.users(id)` (`:31`); `is_public BOOLEAN DEFAULT true` (`:54`); `visibility_scope TEXT DEFAULT 'all' CHECK IN ('all','team','managers','private')` (`:55`).
- **Current INSERT policy (`:173-175`):** `WITH CHECK (auth.role() = 'authenticated')` — any authed user inserts ANY `actor_id` → **spoofable feed (confirmed live).**
- SELECT policy (`:169-171`): `USING (is_public = true OR actor_id = auth.uid() OR target_user_id = auth.uid())`.

### Writer inventory (who actually inserts)

**Repo grep found ZERO `INSERT INTO activity_stream` / `.from('activity_stream').insert(...)` in app code** (frontend, edge fns, backend). The only writers are:

- `log_activity()` RPC — `supabase/migrations/...:211-306`. It is **`SECURITY DEFINER`** (`:306`) and sets `actor_id := auth.uid()` internally (`:238`), **raising if `auth.uid()` IS NULL** (`:239`). It already binds actor correctly.
- Demo seed `supabase/seed/060-dashboard-demo.sql` — inserts directly with hand-picked `actor_id` and `visibility_scope='team'` + `is_public=true` (the contradictory row the report flagged). Seed runs as service-role/superuser → **bypasses RLS**, unaffected by any policy change.

### Correct fix (does NOT break any current writer)

Replace the INSERT policy WITH CHECK with actor binding:

```sql
DROP POLICY "activity_stream_insert_authenticated" ON activity_stream;
CREATE POLICY "activity_stream_insert_own_actor" ON activity_stream
  FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid());
```

- **`log_activity` (DEFINER) is exempt** — `SECURITY DEFINER` + the RPC isn't even subject to client RLS on its internal INSERT; it stays the supported producer. **Seed (service-role) bypasses RLS.** So the only thing this blocks is a malicious _direct_ client insert with a forged actor — exactly the hole.
- **No app writer breaks** (there are none).

### Visibility_scope

Code reads `visibility_scope` only for display typing (`frontend/src/types/activity-feed.types.ts`, test fixtures); no code _enforces_ it — SELECT relies solely on `is_public`. The demo seed writes `visibility_scope='team'` with `is_public=true`, so a "team" row is world-readable. **Recommended:** either (a) derive `is_public` from scope in `log_activity` (`p_is_public := (p_visibility_scope = 'all')`) so `team/managers/private` can't be public, or (b) extend the SELECT `USING` to honor scope. Option (a) is the smaller, safer change and fixes the seed contradiction class at the producer.

> [ASSUMED A2] "Producers in production populate activity via `log_activity`" — repo shows no caller of `log_activity` either (feed may be seed-only today). If a _direct-insert_ producer is added later, it must set `actor_id = auth.uid()`. Verify live producer path before assuming the actor-binding policy is non-breaking in prod.

---

## Item 2 — briefing-books HTML/XSS

**File:** `supabase/functions/briefing-books/index.ts` (1201 lines). HTML built in `generateHTMLDocument()` (`:97`), called at `:1072`. It is a Deno edge fn — **no new deps; add a local `escapeHtml`.**

Every interpolation below injects DB/user strings raw into HTML (representative, all in `generateHTMLDocument`):

| Line        | Interpolated value (untrusted)                                        |
| ----------- | --------------------------------------------------------------------- |
| `:187`      | `${title}` (book title)                                               |
| `:188`      | `${config.description_ar/_en}`                                        |
| `:190`      | `${e.name_ar/_en}` (entity badges)                                    |
| `:215,:233` | `${e.summary_ar/_en}`                                                 |
| `:267-270`  | `${c.name}`, `${c.role}`, `${c.email}`, `${c.phone}` (contacts table) |
| `:306`      | `${eng.description}` (engagement)                                     |
| `:340,:341` | `${pos.type}`, `${pos.content}` (positions)                           |
| `:382,:383` | `${m.title}`, `${m.status}` (MoUs)                                    |
| `:426,:428` | `${c.title}`, `${c.status}` (commitments)                             |
| `:450`      | custom-content block                                                  |

**Recommended fix:** add one helper and wrap **every** untrusted interpolation (dates via `toLocaleDateString` and static `l.*` labels are safe and don't need wrapping):

```ts
function escapeHtml(s: unknown): string {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}
```

Apply at each site, e.g. `${escapeHtml(e.name_en)}`, `${escapeHtml(pos.content)}`. The `dir`/`lang` attributes (`:475`) come from `language`/`direction` (internal enums) — low risk but cheap to constrain.

> Note: per backlog bb #1, the `/briefing-books` route force-redirects to `/dashboard` (page unmounted), so this XSS is **not user-reachable today** — but the edge fn is deployed and the sink is real. Fix the sink regardless; it's a 1-function change.

---

## Item 3 — orphan ExportDialog (delete)

**Orphan:** `frontend/src/components/export/ExportDialog.tsx` (85 lines, `export default function ExportDialog()`).

- Hard-codes `Authorization: 'Bearer test-auth-token'` at **`:15`** (`postJSON`) and **`:23`** (`getJSON`).
- **Importers: ZERO.** Grep for `components/export/ExportDialog` default-path imports → none. Not in `routeTree.gen.ts`. The `export-import/index.ts` re-exports the _named_ `ExportDialog` from `./ExportDialog` (the real `frontend/src/components/export-import/ExportDialog.tsx`, 9KB) — a different file. All app usages (`DossierListPage`, `DossierShell`, `DossierDetailLayout`, `ExportImportPage`) consume the `export-import` one.

**Recommendation:** **Delete `frontend/src/components/export/ExportDialog.tsx`.** Check if `frontend/src/components/export/` becomes empty afterward and remove the dir if so. No re-wire needed — nothing depends on it. (The hard-coded token is a dead-code liability, not a live auth bypass.)

---

## Common Pitfalls

- **Don't touch the `export-import/ExportDialog.tsx`** (the real, imported one) — only the `export/` orphan is in scope.
- **Don't mass-promote `users.role`** — only the 2 known privileged identities; the 7 `user`-metadata rows are not admins.
- **Service-role / DEFINER writers bypass RLS** — the new actor-binding INSERT policy only constrains direct authenticated clients, which is the intended target. Verify no legitimate direct-client producer exists before shipping.
- **authStore: keep the `name`/`avatar` metadata fallbacks**; remove only the `role` one (R3, R4) — broadening the change risks unrelated regressions.
- **Edge fns write `user_metadata.role`** (create-user/assign-role). If you stop frontend from _reading_ it but leave it written, that's fine; if you remove the writes, confirm nothing downstream reads `user_metadata.role` for display.

## Assumptions Log

| #   | Claim                                                                          | Section         | Risk if Wrong                                                                  |
| --- | ------------------------------------------------------------------------------ | --------------- | ------------------------------------------------------------------------------ |
| A1  | `supervisor`/`user` metadata→`users.role` mapping is a product decision        | Item 4 backfill | Backfilling wrong rows grants real admin access                                |
| A2  | Prod activity producers go through `log_activity` (DEFINER), not direct insert | Item 1          | Actor-binding INSERT policy could break an undiscovered direct-insert producer |

## Sources

- **Primary (HIGH):** in-repo file:line (authStore, Sidebar, 8 admin routes, 3 user-mgmt edge fns, audit-logs-viewer, activity migration, briefing-books, export orphan) — all grep/Read verified this session.
- **Live staging facts:** supplied by orchestrator (393 users all viewer; metadata role distribution; client-writable metadata) — treated as ground truth.
- **Backlog/inspection reports:** `escalated-backlog-master-2026-06-10.md` (P2 def), `activity-/audit-logs-/settings-admin-workflow-inspection` (item detail).

## Metadata

- Role inventory: HIGH — every guard grep-located and classified.
- activity_stream: HIGH — policy + sole DEFINER writer confirmed; zero app-code inserts.
- briefing-books: HIGH — all interpolation sites enumerated.
- ExportDialog: HIGH — zero importers proven.
- **Research date:** 2026-06-10 · **Valid until:** ~2026-07-10 (stable; re-confirm live producers/backfill targets before execution).
