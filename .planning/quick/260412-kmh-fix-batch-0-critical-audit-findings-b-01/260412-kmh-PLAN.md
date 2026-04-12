---
phase: quick-260412-kmh
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - frontend/src/lib/api-client.ts
  - frontend/.env.development
  - frontend/src/components/ui/heroui-button.tsx
  - frontend/src/components/ui/button.tsx
  - frontend/src/store/authStore.ts
  - frontend/src/components/auth/AuthListenerManager.tsx
  - frontend/src/App.tsx
  - frontend/public/locales/ar/translation.json
autonomous: true
must_haves:
  truths:
    - 'No 401 console errors from wrong API port on page load'
    - 'Button components accept ref prop for focus management'
    - 'Auth listener is cleaned up on unmount — no memory leak or lock contention'
    - 'Arabic UI shows no raw translation keys on any page'
  artifacts:
    - path: 'frontend/.env.development'
      provides: 'Explicit empty VITE_API_URL for dev proxy'
    - path: 'frontend/src/components/ui/heroui-button.tsx'
      provides: 'forwardRef-wrapped HeroUI button'
      contains: 'forwardRef'
    - path: 'frontend/src/components/ui/button.tsx'
      provides: 'forwardRef-wrapped re-export button'
      contains: 'forwardRef'
    - path: 'frontend/src/components/auth/AuthListenerManager.tsx'
      provides: 'App-level auth listener with useEffect cleanup'
    - path: 'frontend/public/locales/ar/translation.json'
      provides: 'Complete Arabic translations matching EN keys'
  key_links:
    - from: 'frontend/src/lib/api-client.ts'
      to: 'vite proxy'
      via: 'relative URL when VITE_API_URL is empty'
      pattern: "VITE_API_URL.*\\|\\|.*''"
    - from: 'frontend/src/components/auth/AuthListenerManager.tsx'
      to: 'frontend/src/store/authStore.ts'
      via: 'onAuthStateChange subscription with cleanup'
      pattern: 'onAuthStateChange.*useEffect'
---

<objective>
Fix the 4 remaining Batch 0 critical audit findings (B-01, C-01+C-02, D-01, R-01+R-10).

Note: D-02 (protected route race), D-03 (floating promise), and N-02 (admin index route) were
verified as ALREADY FIXED during planning — they are excluded from this plan.

Purpose: Unblock all downstream batches by resolving the true-critical blockers.
Output: 4 atomic fixes, each independently committable.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@docs/audit/FIX-PLAN.md
@frontend/src/lib/api-client.ts
@frontend/src/components/ui/heroui-button.tsx
@frontend/src/components/ui/button.tsx
@frontend/src/store/authStore.ts
@frontend/src/App.tsx
@frontend/public/locales/en/translation.json
@frontend/public/locales/ar/translation.json
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix B-01 — API calls hitting wrong port via VITE_API_URL</name>
  <files>frontend/.env.development, frontend/src/lib/api-client.ts</files>
  <action>
  **Finding B-01 (CRITICAL)**

The `resolveUrl()` function in `api-client.ts:36-39` reads `VITE_API_URL`. When this env var
is set to a wrong value (e.g., `http://localhost:5001`), all Express-targeted calls fail with 401.

1. Create `frontend/.env.development` with:

   ```
   # B-01 fix: Leave VITE_API_URL empty so resolveUrl() returns relative paths
   # that go through Vite's dev proxy (vite.config.ts proxy → localhost:5000)
   VITE_API_URL=
   ```

2. In `frontend/src/lib/api-client.ts`, improve `resolveUrl()` to be more defensive:
   - At line ~37-38, change the express branch to:
     ```typescript
     if (options?.baseUrl === 'express') {
       const expressBase = import.meta.env.VITE_API_URL || ''
       // In dev, empty string = relative path through Vite proxy
       // In prod, should be set to the Express origin (e.g., /api or full URL)
       return `${expressBase}${path}`
     }
     ```
   - Add a dev-mode warning if VITE_API_URL contains a port different from the proxy target:
     ```typescript
     if (
       import.meta.env.DEV &&
       expressBase &&
       !expressBase.includes('localhost:5000') &&
       !expressBase.startsWith('/')
     ) {
       console.warn(
         '[api-client] VITE_API_URL may bypass Vite proxy. Expected empty or localhost:5000, got:',
         expressBase,
       )
     }
     ```

3. Update `deploy/.env.example` to document the pattern:
   - Add comment: `# Leave empty for dev (uses Vite proxy). Set to Express origin for prod.`
     </action>
     <verify>
     <automated>cd frontend && npx tsc --noEmit --pretty 2>&1 | head -20</automated>
     </verify>
     <done>

- `frontend/.env.development` exists with empty VITE_API_URL
- `resolveUrl()` has defensive dev-mode warning
- No TypeScript errors
  </done>
  </task>

<task type="auto">
  <name>Task 2: Fix C-01+C-02 — Button forwardRef broken</name>
  <files>frontend/src/components/ui/heroui-button.tsx, frontend/src/components/ui/button.tsx</files>
  <action>
  **Findings C-01, C-02 (CRITICAL)**

Neither button file uses `React.forwardRef`, breaking ref-based focus management for 100+ consumers.

1. **heroui-button.tsx** (lines 83-108):
   - Read the current component signature (it's a plain function component)
   - Wrap with `React.forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => { ... })`
   - Pass `ref` to the underlying `<button>` or `<Slot>` element
   - Add `HeroUIButton.displayName = 'Button'` after the component
   - Ensure the `asChild` / `Slot` path also forwards the ref

2. **button.tsx** (lines 42-59):
   - This file re-exports from heroui-button. Wrap its own export with `React.forwardRef` as well
   - Ensure the re-exported `Button` passes ref through to the HeroUI button
   - Add `Button.displayName = 'Button'` after the component

3. Keep all existing props, variants, and `buttonVariants` export unchanged.
   Do NOT change the cva definitions or the Slot/asChild logic — only add ref forwarding.
   </action>
   <verify>
   <automated>cd frontend && npx tsc --noEmit --pretty 2>&1 | head -30</automated>
   </verify>
   <done>

- Both button files use `React.forwardRef<HTMLButtonElement, ...>`
- Both have `displayName` set
- `pnpm typecheck` passes
- Existing button consumers compile without changes
  </done>
  </task>

<task type="auto">
  <name>Task 3: Fix D-01 — Auth listener no production cleanup</name>
  <files>frontend/src/store/authStore.ts, frontend/src/components/auth/AuthListenerManager.tsx, frontend/src/App.tsx</files>
  <action>
  **Finding D-01 (CRITICAL) + B-02 (lock contention)**

The `onAuthStateChange` listener at `authStore.ts:209-222` runs at module scope. The HMR
cleanup (lines 218-222) only works in dev. In production, duplicate listeners accumulate
on navigation/remounts, causing memory leaks and `NavigatorLockAcquireTimeoutError`.

1. **authStore.ts** — Remove the module-scope listener (lines 209-222):
   - Delete the entire block from `const { data: { subscription: _authSubscription } }` through
     the `import.meta.hot` block
   - Export a new function for use by the manager component:
     ```typescript
     export function subscribeToAuthChanges(): () => void {
       const {
         data: { subscription },
       } = supabase.auth.onAuthStateChange((event, session) => {
         useAuthStore.getState().handleAuthStateChange(event, session)
       })
       return () => subscription.unsubscribe()
     }
     ```

2. **Create `frontend/src/components/auth/AuthListenerManager.tsx`**:

   ```tsx
   import { useEffect } from 'react'
   import { subscribeToAuthChanges } from '@/store/authStore'

   /**
    * App-level component that manages the Supabase auth state listener.
    * Must be rendered once at the top level (App.tsx) to ensure proper
    * cleanup on unmount — fixes D-01 memory leak and B-02 lock contention.
    */
   export function AuthListenerManager(): null {
     useEffect(() => {
       const unsubscribe = subscribeToAuthChanges()
       return unsubscribe
     }, [])
     return null
   }
   ```

3. **App.tsx** — Add `<AuthListenerManager />` inside the top-level providers:
   - Import `AuthListenerManager` from `@/components/auth/AuthListenerManager`
   - Place it as the first child inside the outermost provider (before Router)
   - This ensures a single listener with proper React lifecycle cleanup
     </action>
     <verify>
     <automated>cd frontend && npx tsc --noEmit --pretty 2>&1 | head -20</automated>
     </verify>
     <done>

- Module-scope `onAuthStateChange` removed from authStore.ts
- `subscribeToAuthChanges()` exported as a function
- `AuthListenerManager` component created with useEffect cleanup
- `App.tsx` renders `AuthListenerManager` once at top level
- No NavigatorLockAcquireTimeoutError in console after multiple navigations
  </done>
  </task>

<task type="auto">
  <name>Task 4: Fix R-01+R-10 — Missing 500+ Arabic translations</name>
  <files>frontend/public/locales/ar/translation.json</files>
  <action>
  **Findings R-01 (CRITICAL), R-10 (CRITICAL)**

Arabic users see raw translation keys because hundreds of keys exist in EN but not AR.

1. **Diff EN vs AR keys** — Write a script or use jq to extract all leaf keys from
   `frontend/public/locales/en/translation.json` that are missing in
   `frontend/public/locales/ar/translation.json`.

2. **Add missing translations** — For each missing key, add the Arabic translation to AR file.
   Priority namespaces (from FIX-PLAN.md):
   - `tabs.*` (R-10 — entire tab bar untranslated)
   - `dossierLinks.*`
   - `briefs.*`
   - `dataLibrary.*`
   - `reports.*`
   - `calendar.*`
   - Dossier statistics text (e.g., "of total active dossiers %")
   - Any other keys present in EN but missing in AR

3. **Translation quality rules:**
   - Use proper Arabic translations (not transliterations)
   - Use diplomatic/formal register appropriate for the domain
   - Keep interpolation variables intact: `{{count}}`, `{{name}}`, etc.
   - For technical terms with no standard Arabic equivalent, use the accepted Arabic
     technical term (e.g., "Dashboard" = "لوحة المعلومات")

4. **Verify structural parity** — After adding translations, confirm that the AR JSON
   has the same nested key structure as EN. Every leaf key in EN must exist in AR.
   Use a script like:

   ```bash
   node -e "
     const en = require('./frontend/public/locales/en/translation.json');
     const ar = require('./frontend/public/locales/ar/translation.json');
     function getLeafKeys(obj, prefix = '') {
       return Object.entries(obj).flatMap(([k, v]) =>
         typeof v === 'object' && v !== null
           ? getLeafKeys(v, prefix ? prefix + '.' + k : k)
           : [prefix ? prefix + '.' + k : k]
       );
     }
     const enKeys = new Set(getLeafKeys(en));
     const arKeys = new Set(getLeafKeys(ar));
     const missing = [...enKeys].filter(k => !arKeys.has(k));
     console.log('Missing in AR:', missing.length);
     if (missing.length > 0) { missing.slice(0, 20).forEach(k => console.log(' -', k)); }
   "
   ```

5. **Do NOT remove any existing AR keys** — only add missing ones.
   </action>
   <verify>
   <automated>node -e "const en=require('./frontend/public/locales/en/translation.json');const ar=require('./frontend/public/locales/ar/translation.json');function g(o,p=''){return Object.entries(o).flatMap(([k,v])=>typeof v==='object'&&v!==null?g(v,p?p+'.'+k:k):[p?p+'.'+k:k]);}const m=[...new Set(g(en))].filter(k=>!new Set(g(ar)).has(k));console.log('Missing:',m.length);process.exit(m.length>0?1:0)"</automated>
   </verify>
   <done>

- Zero missing keys when diffing EN vs AR leaf keys
- Arabic UI shows proper translations on all pages (no raw keys)
- All interpolation variables preserved
- Existing AR translations unchanged
  </done>
  </task>

</tasks>

<threat_model>

## Trust Boundaries

| Boundary        | Description                                                              |
| --------------- | ------------------------------------------------------------------------ |
| client env vars | VITE_API_URL controls where API calls go — wrong value = data exfil risk |
| auth state      | Module-scope listener can cause stale auth, granting access after logout |

## STRIDE Threat Register

| Threat ID | Category               | Component            | Disposition | Mitigation Plan                                                                   |
| --------- | ---------------------- | -------------------- | ----------- | --------------------------------------------------------------------------------- |
| T-b0-01   | Tampering              | VITE_API_URL         | mitigate    | Dev-mode warning when URL bypasses proxy; .env.development pins empty value       |
| T-b0-02   | Elevation of Privilege | authStore listener   | mitigate    | Move to useEffect with cleanup; stale auth state cleared on session check failure |
| T-b0-03   | Information Disclosure | Missing translations | accept      | UI text only; no secrets exposed by raw keys                                      |

</threat_model>

<verification>
1. `pnpm typecheck` passes with zero errors
2. No 401 errors in browser console on page load (B-01)
3. Button refs work: `<Button ref={myRef}>` compiles and `myRef.current` is an HTMLButtonElement (C-01+C-02)
4. Single auth listener in React DevTools; no NavigatorLockAcquireTimeoutError after 10+ navigations (D-01)
5. Switch to Arabic — scan all main pages for raw translation keys (R-01+R-10)
</verification>

<success_criteria>

- All 4 fixes pass their individual verify commands
- `pnpm typecheck` clean
- No regressions in existing functionality
- Each fix is independently committable
  </success_criteria>

<output>
After completion, create `.planning/quick/260412-kmh-fix-batch-0-critical-audit-findings-b-01/260412-kmh-SUMMARY.md`
</output>
