# Settings / User Management / Admin Workflow Inspection Report

**Date:** Tue 9 Jun 2026  
**Scope:** Read-only code + contract inspection of System navigation routes `/users`, `/settings`, `/help`, and `/admin`; settings sections and child routes; user-management list/create/edit/disable/role flows; admin guards; help content; theme/language/density persistence; i18n EN+AR registration; RTL and design-token usage  
**Branch:** `quick/260608-c9b-country-dossier-workflow-fixes`  
**Constraint:** No source edits; findings only.  
**Inspector:** codex (substituting for cursor-agent — monthly quota exhausted)

---

## Scope

### Routes traced

| URL                           | Route file                                                            | Page / component                 | Result                                                                            |
| ----------------------------- | --------------------------------------------------------------------- | -------------------------------- | --------------------------------------------------------------------------------- |
| `/settings`                   | `frontend/src/routes/_protected/settings.tsx:5-30`                    | `SettingsPage`                   | Mounted on exact `/settings`; child settings routes render via `Outlet`           |
| `/settings/notifications`     | `frontend/src/routes/_protected/settings/notifications.tsx:4-12`      | `NotificationPreferences`        | Real notification-category/email/push-device surface                              |
| `/settings/email-digest`      | `frontend/src/routes/_protected/settings/email-digest.tsx:4-12`       | `EmailDigestSettings`            | Real table/RPC-backed digest preferences                                          |
| `/settings/integrations`      | `frontend/src/routes/_protected/settings/integrations.tsx:4-12`       | `BotIntegrationsSettings`        | Slack bot link surface is wired; Teams remains coming-soon                        |
| `/settings/webhooks`          | `frontend/src/routes/_protected/settings/webhooks.tsx:14-29`          | `WebhooksPage`                   | Real edge-function repository surface                                             |
| `/settings/calendar-sync`     | `frontend/src/routes/_protected/settings/calendar-sync.tsx:9-14`      | `CalendarSyncSettings`           | UI mounted, but imports stub/no-op calendar hooks                                 |
| `/settings/calendar/callback` | `frontend/src/routes/_protected/settings/calendar/callback.tsx:23-90` | `CalendarOAuthCallback`          | Callback mounted, but completion mutation is a stub                               |
| `/users`                      | `frontend/src/routes/_protected/users.tsx:4-6`                        | `UsersPage` -> `UsersListPage`   | User list only; create/view routes navigated to by buttons do not exist           |
| `/admin`                      | `frontend/src/routes/_protected/admin/index.tsx:3-8`                  | Redirect to `/admin/ai-settings` | Root redirects without its own admin check; child route guards run after redirect |
| `/admin/ai-settings`          | `frontend/src/routes/_protected/admin/ai-settings.tsx:47-58`          | `AISettingsPage`                 | Child route has metadata/app-metadata admin guard                                 |
| `/admin/system`               | `frontend/src/routes/_protected/admin/system.tsx:28-44`               | `AdminSystemPage`                | Child route has metadata/app-metadata admin guard                                 |
| `/help`                       | `frontend/src/routes/_protected/help/index.tsx:4-6`                   | `HelpPage`                       | Real FAQ + one real commitments guide; several support/resource actions are stubs |

Nav wiring:

- Requested System category is defined in `frontend/src/components/modern-nav/navigationData.ts:290-325`: `/users`, `/settings`, `/help`, `/admin`, with only `/admin` marked `adminOnly`.
- The current protected app shell renders `Sidebar`, not the modern-nav `NavigationShell`, via `frontend/src/components/layout/AppShell.tsx:172-225`.
- The current sidebar gates its Administration group from `public.users.role` via `frontend/src/components/layout/Sidebar.tsx:58-64` and `frontend/src/components/layout/navigation-config.ts:166-214`.

### Child components & hooks

| Surface                   | Files                                                                                                                                                             | Role                                                                                           | Current wiring                                                                                                    |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Main settings shell       | `frontend/src/pages/settings/SettingsPage.tsx`                                                                                                                    | Form state, section navigation, save button, user-settings query/mutation                      | Reads/writes `public.users`; most referenced columns are absent from generated DB types                           |
| Profile                   | `frontend/src/components/settings/sections/ProfileSettingsSection.tsx`                                                                                            | Display name, job title, department, phone, bio, avatar upload                                 | Avatar upload targets Storage bucket `avatars`; text fields save through invalid main `users` mapping             |
| General                   | `frontend/src/components/settings/sections/GeneralSettingsSection.tsx`                                                                                            | Language, timezone, date format, start of week                                                 | `language_preference` and `timezone` exist on `users`; `date_format` and `start_of_week` do not                   |
| Appearance                | `frontend/src/components/settings/sections/AppearanceSettingsSection.tsx`                                                                                         | Design direction, mode, accent hue, density                                                    | Direct `DesignProvider` hooks; persists to `localStorage`, not the settings form/DB                               |
| Notifications             | `frontend/src/components/settings/sections/NotificationsSettingsSection.tsx`                                                                                      | Basic notification toggles                                                                     | Saves through invalid main `users` mapping                                                                        |
| Notification center prefs | `frontend/src/components/notifications/NotificationPreferences.tsx`, `frontend/src/hooks/useNotificationCenter.ts`, `frontend/src/hooks/useEmailNotifications.ts` | Category prefs, email prefs, push devices                                                      | Real Supabase tables: `notification_category_preferences`, `email_notification_preferences`, `push_device_tokens` |
| Email digest              | `frontend/src/components/email/EmailDigestSettings.tsx`                                                                                                           | Digest cadence/content                                                                         | Real `email_notification_preferences` upsert + `get_watchlist_summary` RPC                                        |
| Bot integrations          | `frontend/src/components/settings/BotIntegrationsSettings.tsx`                                                                                                    | Slack/Teams bot link display, verification, unlink, notification prefs                         | Real RPC/table/Slack OAuth surface, but verification expects nullable `bot_user_links.user_id`                    |
| Data & privacy            | `frontend/src/components/settings/sections/DataPrivacySettingsSection.tsx`                                                                                        | Export data, global sign-out, account delete                                                   | Export/delete reference absent tables/columns; session list is local/current-session only                         |
| Security                  | `frontend/src/components/settings/sections/SecuritySettingsSection.tsx`                                                                                           | Password update, MFA flag, session timeout                                                     | Password update is real; MFA setup and session-timeout persistence are incomplete                                 |
| User management           | `frontend/src/pages/users/UsersListPage.tsx`                                                                                                                      | Search/filter/paginated list                                                                   | Read-only list; create/view navigations point at missing routes                                                   |
| Admin child pages         | `frontend/src/routes/_protected/admin/*`                                                                                                                          | AI settings, system utilities, field permissions, approvals, retention, preview layouts, usage | Child route guards exist, but use auth metadata/app metadata rather than profile-table role                       |
| Help                      | `frontend/src/pages/help/HelpPage.tsx`, `frontend/src/pages/help/CommitmentsHelpPage.tsx`                                                                         | FAQ, feature guides, support cards, resources                                                  | Commitments guide is real; other guides/resources/support actions are incomplete                                  |

### Backend / Supabase surfaces

| Surface                                                                 | Role                                                         | Wired from workflow?                                                                                                                               |
| ----------------------------------------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Table `public.users`                                                    | Auth profile, role, active flag, language/timezone, MFA flag | Yes: `/settings` and `/users`; settings references many absent columns                                                                             |
| Storage bucket `avatars`                                                | Profile avatar uploads                                       | Yes from profile section; bucket/policy existence is **VERIFY vs live**                                                                            |
| Table `public.email_notification_preferences`                           | Email notification and digest preferences                    | Yes from notification preferences and email digest; columns confirmed in generated types                                                           |
| RPC `get_watchlist_summary`                                             | Watchlist counts for digest preview                          | Yes from `EmailDigestSettings`; RPC signature confirmed in generated types                                                                         |
| Table `public.notification_category_preferences`                        | Notification-center category preferences                     | Yes from `useNotificationCenter`                                                                                                                   |
| Table `public.push_device_tokens`                                       | Push device registration/removal                             | Yes from `useNotificationCenter`                                                                                                                   |
| Table `public.bot_user_links`                                           | Bot account links and preferences                            | Yes from integrations; pending-link flow conflicts with generated non-null `user_id`                                                               |
| RPC `get_user_bot_links`                                                | Bot links list                                               | Yes from integrations; RPC signature confirmed in generated types                                                                                  |
| Edge `slack-bot`                                                        | Slack OAuth                                                  | Yes, URL is constructed from `VITE_SUPABASE_URL/functions/v1/slack-bot/oauth`; deployment is **VERIFY vs live**                                    |
| Edge `webhooks`                                                         | Webhook CRUD/test/stats/templates                            | Yes via `frontend/src/domains/import/repositories/import.repository.ts:26-65` and `api-client` edge base at `frontend/src/lib/api-client.ts:36-54` |
| Edge `calendar-sync`                                                    | Calendar status/events/connect/disconnect/settings           | Repository exists, but visible settings page imports stub hooks; not effectively wired from `/settings/calendar-sync`                              |
| Tables `user_settings`, `activity_log`                                  | Data export source                                           | Referenced by Data & Privacy export, but absent from generated `database.types.ts`; `audit_logs` exists instead                                    |
| Edge `create-user`, `assign-role`, `deactivate-user`, `reactivate-user` | User-management write/admin flows                            | Present on disk, but not wired from `/users`; some functions have schema/role-source mismatches                                                    |
| RLS policy `users_select_active`                                        | User list visibility                                         | Local migration permits authenticated users to read active users; hosted policy is **VERIFY vs live**                                              |
| Express backend                                                         | `/health` only in this inspection                            | No settings/user/admin Express workflow found in traced frontend paths                                                                             |

### i18n namespaces

| Namespace                                                    | Routes / components                     | EN                                              | AR                                              | Registered in `i18n/index.ts`      | Notes                                                                       |
| ------------------------------------------------------------ | --------------------------------------- | ----------------------------------------------- | ----------------------------------------------- | ---------------------------------- | --------------------------------------------------------------------------- |
| `translation` / `common`                                     | Shell nav, modern nav, common UI        | `frontend/src/i18n/en/common.json`              | `frontend/src/i18n/ar/common.json`              | `index.ts:255-257,382-383`         | `navigation.system` is missing in both EN and AR                            |
| `settings`                                                   | Main `/settings` sections               | `frontend/src/i18n/en/settings.json`            | `frontend/src/i18n/ar/settings.json`            | `index.ts:343,469`                 | EN/AR key parity passed                                                     |
| `notification-center`                                        | `/settings/notifications`               | `frontend/src/i18n/en/notification-center.json` | `frontend/src/i18n/ar/notification-center.json` | `index.ts:285,411`                 | Registered                                                                  |
| `push-notifications`                                         | Push-device UI                          | `frontend/src/i18n/en/push-notifications.json`  | `frontend/src/i18n/ar/push-notifications.json`  | `index.ts:375,501`                 | Registered                                                                  |
| `email-digest`                                               | Email digest settings                   | `frontend/src/i18n/en/email-digest.json`        | `frontend/src/i18n/ar/email-digest.json`        | `index.ts:329,455`                 | EN/AR key parity passed                                                     |
| `integrations`                                               | Bot integrations                        | `frontend/src/i18n/en/integrations.json`        | `frontend/src/i18n/ar/integrations.json`        | `index.ts:332,458`                 | EN/AR key parity passed                                                     |
| `webhooks`                                                   | Webhooks settings child route           | `frontend/src/i18n/en/webhooks.json`            | `frontend/src/i18n/ar/webhooks.json`            | `index.ts:291,417`                 | EN/AR key parity passed                                                     |
| `calendar-sync`                                              | Calendar sync settings/callback         | `frontend/src/i18n/en/calendar-sync.json`       | `frontend/src/i18n/ar/calendar-sync.json`       | `index.ts:292,418`                 | EN/AR key parity passed                                                     |
| `user-management`                                            | `/users`                                | `frontend/src/i18n/en/user-management.json`     | `frontend/src/i18n/ar/user-management.json`     | `index.ts:325,451`                 | EN/AR key parity passed; one `translation:loading` fallback remains         |
| `admin`                                                      | `/admin/system`, `/admin/approvals`     | `frontend/src/i18n/en/admin.json`               | `frontend/src/i18n/ar/admin.json`               | `index.ts:366,492`                 | EN/AR key parity passed; approvals route uses default namespace incorrectly |
| `ai-admin`                                                   | `/admin/ai-settings`, AI usage surfaces | `frontend/src/i18n/en/ai-admin.json`            | `frontend/src/i18n/ar/ai-admin.json`            | `index.ts:367,493`                 | EN/AR key parity passed                                                     |
| `field-permissions`, `preview-layouts`, `retention-policies` | Admin child pages                       | EN/AR files present                             | EN/AR files present                             | `index.ts:331,373,376,457,499,502` | Registered                                                                  |
| Help page                                                    | `/help`                                 | Inline strings                                  | Inline strings                                  | No page namespace                  | Manual `isRTL ? ar : en`; not a registered namespace                        |

Key parity probe: scoped EN/AR JSON files for `settings`, `user-management`, `email-digest`, `integrations`, `calendar-sync`, `webhooks`, `admin`, `ai-admin`, `field-permissions`, and `retention-policies` all returned `missingAr=0 missingEn=0`.

---

## Environment

| Check                       | Result                                                                                                                             |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Backend health              | `GET http://127.0.0.1:5001/health` -> **200** `{"status":"ok","timestamp":"2026-06-09T20:08:47.013Z","environment":"development"}` |
| Frontend `/settings` shell  | `GET http://127.0.0.1:5175/settings` -> **200** SPA HTML                                                                           |
| Frontend `/users` shell     | `GET http://127.0.0.1:5175/users` -> **200** SPA HTML                                                                              |
| Frontend `/admin` shell     | `GET http://127.0.0.1:5175/admin` -> **200** SPA HTML                                                                              |
| Frontend `/help` shell      | `GET http://127.0.0.1:5175/help` -> **200** SPA HTML                                                                               |
| Authenticated browser UAT   | Not performed; inspection stayed source/read-only and sent no write requests                                                       |
| Live Supabase DB/RPC/schema | Not probed with auth; DB/RPC deployment-specific claims are **VERIFY vs live**                                                     |
| Typecheck / tests           | Not run; avoided toolchain commands that may write build/cache artifacts under the hard write constraint                           |

---

## Findings

### 1. Main `/settings` save path writes many columns that do not exist on `public.users`

**Severity:** CRITICAL  
**Location:** `frontend/src/pages/settings/SettingsPage.tsx:98-153,172-217`, `frontend/src/types/database.types.ts:27684-27719,27755-27789`

**Root cause:** `SettingsPage` reads `users.select('*')` and maps settings fields including `display_name`, `job_title`, `bio`, `date_format`, `start_of_week`, `color_mode`, `theme`, `display_density`, `notifications_*`, accessibility booleans, and `session_timeout`. Its save mutation upserts the same fields into `public.users`. The generated `users` type only confirms profile/role/auth columns such as `full_name`, `job_title_en`, `job_title_ar`, `language_preference`, `timezone`, `mfa_enabled`, and `is_active`; most settings fields are absent. A first-save create is also invalid because `users.Insert` requires `email`, `full_name`, and `username`.

**Suggested fix:** Move user preferences to a typed preferences table/view or add a deliberate migration for the required settings columns, then replace the `users` catch-all mapper with explicit profile/preference mappers. Map existing columns correctly (`full_name`/`name_en`/`name_ar`, `job_title_en`/`job_title_ar`) instead of using non-existent aliases. Confirm hosted schema before migration: **VERIFY vs live**.

---

### 2. Appearance controls persist only through `DesignProvider` localStorage, not account settings

**Severity:** HIGH  
**Location:** `frontend/src/components/settings/sections/AppearanceSettingsSection.tsx:12-42,57-140`, `frontend/src/design-system/DesignProvider.tsx:31-39,159-191,253-285`, `frontend/src/pages/settings/SettingsPage.tsx:189-240`

**Root cause:** The appearance section intentionally ignores the `react-hook-form` `form` prop and binds direction/mode/hue/density directly to `DesignProvider` hooks. `DesignProvider` persists those values under `id.dir`, `id.theme`, `id.hue`, and `id.density` in `localStorage`, and applies tokens/root classes. Meanwhile `SettingsPage` still attempts to save legacy `color_mode`, `theme`, and `display_density` into missing `users` columns. The UI toggle works locally, but it is device/browser-scoped and not saved as an account preference.

**Suggested fix:** Decide whether design direction/mode/hue/density are account-level or device-level. If account-level, add a typed persistence contract and hydrate `DesignProvider` from it; if device-level, remove legacy DB save fields from `SettingsPage` and label this as local preference behavior.

---

### 3. `/users` create/view/edit/disable/role-assignment flows are not mounted

**Severity:** HIGH  
**Location:** `frontend/src/pages/users/UsersListPage.tsx:188-194,221-240`, `frontend/src/routes/_protected/users.tsx:4-6`

**Root cause:** `UsersListPage` navigates to `/users/create` and `/users/${userId}`, but route discovery found only `frontend/src/routes/_protected/users.tsx` for the user-management area. The list page has no create modal, edit form, disable/reactivate action, or role-assignment action. Edge functions for `create-user`, `assign-role`, `deactivate-user`, and `reactivate-user` exist on disk, but are not wired from this workflow.

**Suggested fix:** Either add the missing `/users/create` and `/users/$userId` routes with create/edit/disable/role-assignment UI, or remove/disable the buttons until those flows are implemented. Wire user-management mutations through one role/source-of-truth contract and validate the edge functions before exposing them.

---

### 4. `/users` is not admin-gated, and local RLS appears to expose active users to all authenticated users

**Severity:** HIGH  
**Location:** `frontend/src/components/modern-nav/navigationData.ts:297-303`, `frontend/src/routes/_protected/users.tsx:4-6`, `frontend/src/routes/_protected.tsx:39-64`, `frontend/src/pages/users/UsersListPage.tsx:92-99`, `supabase/migrations/011_rls_policies.sql:13-26`

**Root cause:** The System nav item for `/users` is not marked `adminOnly`, the `/users` route has no route-level role check beyond the parent authenticated-session guard, and the local migration permits any authenticated user to read active users through `users_select_active`. That may be intentional for collaboration, but it means "User Management" is not admin-only at route/RLS level. Hosted RLS state remains **VERIFY vs live**.

**Suggested fix:** Decide whether `/users` is an employee directory or an admin management console. If admin-only, add route guard, nav metadata, and RLS that match that policy. If directory access is intended, split a read-only directory route from admin-only user-management write flows.

---

### 5. Admin route guards and rendered admin nav use different role sources

**Severity:** HIGH  
**Location:** `frontend/src/components/layout/Sidebar.tsx:58-64`, `frontend/src/store/authStore.ts:57-64,137-149`, `frontend/src/routes/_protected/admin/index.tsx:3-8`, `frontend/src/routes/_protected/admin/ai-settings.tsx:49-56`, `frontend/src/routes/_protected/admin/system.tsx:30-40`

**Root cause:** The current app shell shows admin navigation from `useAuthStore().user.role`, populated from `public.users.role`. Admin child route guards check `session.user.user_metadata.role` or `session.user.app_metadata.role`. `/admin` itself only redirects to `/admin/ai-settings`. If profile-table roles and auth metadata are not synchronized, an admin can see links but be blocked by child routes, or the reverse. Whether JWT/app metadata is populated in production is **VERIFY vs live**.

**Suggested fix:** Centralize admin checks in a shared `requireAdmin` guard that uses the same source as the nav, or guarantee auth-claim synchronization from `public.users.role` and document it. Prefer redirects/403 pages over thrown generic errors for unauthorized admin routes.

---

### 6. Modern-nav `adminOnly` metadata is not enforced by its renderer

**Severity:** MEDIUM  
**Location:** `frontend/src/components/modern-nav/navigationData.ts:292-324`, `frontend/src/components/modern-nav/ExpandedPanel/ExpandedPanel.tsx:63-65,102-104`, `frontend/src/components/modern-nav/ExpandedPanel/NavigationSection.tsx:12-17,92-173`

**Root cause:** `navigationData.ts` marks the System `/admin` item as `adminOnly`, but `ExpandedPanel` passes all category items straight to `NavigationSection`, and `NavigationSection` maps `items` without filtering on `adminOnly` or receiving a role. This does not currently affect `AppShell` because it renders `Sidebar`, but the scoped modern nav data is unsafe if used directly.

**Suggested fix:** Add role-aware filtering before rendering modern-nav items, or remove security-signaling metadata from a nav renderer that cannot enforce it. Keep route/RLS enforcement as the real security boundary.

---

### 7. Calendar sync settings are a visible no-op despite repository and edge function surfaces

**Severity:** HIGH  
**Location:** `frontend/src/routes/_protected/settings/calendar-sync.tsx:9-14`, `frontend/src/components/calendar/CalendarSyncSettings.tsx:153-157,680-710`, `frontend/src/domains/briefings/hooks/useCalendarSync.ts:94-165`, `frontend/src/domains/briefings/repositories/briefings.repository.ts:33-55`, `frontend/src/routes/_protected/settings/calendar/callback.tsx:43-82`

**Root cause:** `CalendarSyncSettings` imports `useCalendarSync`, `useExternalCalendars`, and the callback route imports `useCompleteOAuthCallback`. The hook file explicitly labels these as stub hooks; it returns empty connections/conflicts/subscriptions, async no-ops, `Promise.resolve([])`, and a callback mutation that resolves success without calling the repository. Real `calendar-sync` repository calls exist but are not used by the visible settings workflow.

**Suggested fix:** Replace stub imports with repository-backed hooks (`useCalendarStatus`, `useConnectCalendar`, `useDisconnectCalendar`, `useUpdateCalendarSettings`, etc.) or hide the route until the sync flow is wired. Validate deployed `calendar-sync` edge behavior separately: **VERIFY vs live**.

---

### 8. Data & Privacy export/delete references absent tables and columns

**Severity:** HIGH  
**Location:** `frontend/src/components/settings/sections/DataPrivacySettingsSection.tsx:111-115,186-196`, `frontend/src/types/database.types.ts:27684-27719`, `frontend/src/types/database.types.ts:3090`

**Root cause:** Export reads `user_settings` and `activity_log`, but generated DB types do not contain those tables; the closest confirmed table is `audit_logs`. Delete account updates `users.status` and `users.deleted_at`, but generated `users` has `is_active` and `deleted_by`, not `status` or `deleted_at`. These flows are therefore stale against the checked-in database contract. Live hosted schema remains **VERIFY vs live**.

**Suggested fix:** Rebuild Data & Privacy against the actual schema: export from confirmed profile/preferences/audit tables, and implement account deletion with the real soft-delete columns and auth lifecycle. If `user_settings`/`activity_log` exist only in hosted DB, regenerate types and add migrations.

---

### 9. MFA setting is a profile flag, not a Supabase MFA flow

**Severity:** MEDIUM  
**Location:** `frontend/src/components/settings/sections/SecuritySettingsSection.tsx:144-166`, `frontend/src/pages/settings/SettingsPage.tsx:212-214`, `frontend/src/types/database.types.ts:27705-27707,27775-27777`

**Root cause:** The security section toggles `mfa_enabled` in form state and shows a setup-required card, but the setup button has no handler and no Supabase Auth MFA enrollment/challenge/verification flow is called. The settings save only attempts to write a profile flag, and the broader settings save is already affected by invalid columns.

**Suggested fix:** Implement a full enroll/verify/disable flow using the chosen auth provider, then store only status metadata in profile fields. Until then, render MFA status as read-only or disabled with clear server-derived state.

---

### 10. Bot verification expects pending bot links with `user_id = null`, but the generated table requires `user_id`

**Severity:** MEDIUM  
**Location:** `frontend/src/components/settings/BotIntegrationsSettings.tsx:66-94,213-218,270-282`, `frontend/src/types/database.types.ts:3958-4003`, `frontend/src/types/database.types.ts:35109-35120`

**Root cause:** The integration settings list uses `get_user_bot_links`, and Slack OAuth is linked to the `slack-bot` edge function. However, manual verification searches `bot_user_links` with `.is('user_id', null)`, while generated `bot_user_links.Row` and `Insert` mark `user_id` as required `string`. That makes the pending-link model incompatible with the generated schema. Teams is explicitly coming-soon.

**Suggested fix:** Either make pending links nullable in the schema/type generation or move pending verification codes into a separate pending-link table/RPC that claims the link transactionally. Confirm the live table nullability before changing behavior: **VERIFY vs live**.

---

### 11. Help has real content, but several visible actions are stubs and it bypasses namespace i18n

**Severity:** MEDIUM  
**Location:** `frontend/src/pages/help/HelpPage.tsx:52-110,258-263,291-294,314-317,395-446,460-475`, `frontend/src/routes/_protected/help/index.tsx:4-6`

**Root cause:** `/help` renders real inline FAQ content and a real commitments guide link. Other feature guides are marked coming-soon, "View all questions" has no handler, email/phone support buttons have no `mailto:`/`tel:` or click handlers, and resource cards show `cursor-pointer`/external-link icon without links. The page uses inline `isRTL ? ar : en` strings instead of a registered help namespace.

**Suggested fix:** Add real routes/links for visible support/resources, remove pointer affordances from inert cards, and migrate help strings to a `help` namespace with EN/AR parity. Keep coming-soon items visually non-actionable.

---

### 12. i18n usage has dot-form/default-namespace leaks despite EN/AR namespace parity

**Severity:** MEDIUM  
**Location:** `frontend/src/components/modern-nav/navigationData.ts:292-295`, `frontend/src/i18n/en/common.json:136-211`, `frontend/src/i18n/ar/common.json:136-211`, `frontend/src/routes/_protected/admin/approvals.tsx:97-160`, `frontend/src/i18n/en/admin.json:1-55`, `frontend/src/i18n/index.ts:512-530`

**Root cause:** `navigationData.ts` uses `navigation.system`, but common EN/AR navigation keys include `settings`, `admin`, `systemSettings`, etc. and no `system`, so modern nav can display the raw key. Admin approvals uses `useTranslation()` and keys like `admin.approvals.title`, but the registered `admin` namespace stores `approvals.title` at top level. Because no `defaultNS` is set and fallback language is English, Arabic users will see default English strings for those calls rather than namespace translations.

**Suggested fix:** Add `navigation.system` to common EN/AR or change the tooltip key. In approvals, call `useTranslation('admin')` and use `approvals.*` keys, or move the JSON shape to match `admin.approvals.*`.

---

### 13. Scoped RTL/design-token compliance gaps remain in System surfaces

**Severity:** LOW  
**Location:** `frontend/src/components/modern-nav/IconRail/IconRail.tsx:160-168`, `frontend/src/pages/help/HelpPage.tsx:395-400,461-475`, `frontend/src/components/settings/sections/AccessibilitySettingsSection.tsx:118-132`

**Root cause:** The scoped files mostly use semantic tokens and logical props, but there are still violations: modern-nav icon rail uses arbitrary raw HSL gradient values and raw RGBA shadow utilities; help cards use `transition-all`, `hover:shadow-lg`, and `hover:shadow-md`; the accessibility focus-indicator choices attach `onClick` to a `div` inside a radio group instead of making the label/control itself the activation target. These are not the primary workflow blockers, but they fail the requested design-token/no-card-shadow/accessibility compliance pass.

**Suggested fix:** Replace raw arbitrary colors/shadows with design tokens, remove hover card shadows, narrow `transition-all` to specific properties, and use labels/buttons/radio controls directly for selectable settings rows.

---

## Final

### (A) Safe to auto-fix

| Finding ID | Scope                                         | Why                                                        |
| ---------- | --------------------------------------------- | ---------------------------------------------------------- |
| 6          | Modern-nav adminOnly filtering                | Local renderer-level change; does not require DB migration |
| 11         | Help no-op links and help namespace migration | Mostly UI/link/i18n cleanup if routes/URLs are known       |
| 12         | i18n key usage leaks                          | Small key/namespace fixes with low blast radius            |
| 13         | RTL/design-token cleanup                      | Mechanical UI compliance cleanup                           |

### (B) Needs planned phase

| Finding ID | Scope                                    | Why                                                                          |
| ---------- | ---------------------------------------- | ---------------------------------------------------------------------------- |
| 1          | Settings persistence schema              | Requires product/schema decision and migration or new preference table       |
| 2          | Account-vs-device appearance preferences | Requires persistence contract decision across `DesignProvider` and settings  |
| 3          | User-management write flows              | Requires new routes/modals, edge integration, validation, and audit behavior |
| 4          | `/users` admin gating/RLS policy         | Requires access-control decision and live RLS verification                   |
| 5          | Admin role-source mismatch               | Requires unified auth/profile role model and possible JWT/app metadata sync  |
| 7          | Calendar sync wiring                     | Requires replacing stubs with real edge-backed hooks and OAuth validation    |
| 8          | Data & Privacy export/delete             | Requires schema-aligned privacy/export/delete design                         |
| 9          | MFA setup                                | Requires full auth-provider MFA enrollment/verification flow                 |
| 10         | Bot link verification model              | Requires schema/RPC decision for pending links                               |

Summary: the System workflow has several real surfaces, but the account-level settings contract is the largest blocker: `/settings` writes a preference model that does not match generated `public.users` types. User management is currently a read-only list with missing write/detail routes. Admin enforcement exists on child routes, but role sources are inconsistent between navigation and guards. Help is partly useful but still includes visible no-op actions. Recommended phase order: first settle the profile/preferences schema and DesignProvider persistence model, then unify admin/user role enforcement, then implement user-management write flows, then wire calendar/privacy/MFA/bot edge cases, and finally run the i18n/help/design-token cleanup pass.
