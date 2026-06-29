# Brief — produce the plan for everything left

You are an autonomous PLANNING agent (read-only except writing ONE plan doc). The data-entry quality
sweep is implemented + verified (gate green) and **PR #72** is open on branch
`fix/prod-quality-sweep-260627`. Your job: write a complete, actionable plan for **everything still
outstanding**, so the user can decide and execute.

## Inputs (read)

- `.planning/data-entry-assessment/_LANES.md` → `## NEEDS-DECISION` (10 items) and `## DEFER`.
- `_BACKLOG.md` and `findings-*.md` for detail on any item you cite.
- `git diff e72b928d..HEAD --name-only` to see everything the sweep changed.
- `CLAUDE.md` "Deployment Configuration" (staging `zkrcjzdemdmwhearhfgg`; droplet 138.197.195.242).

## Write `.planning/data-entry-assessment/_PLAN-REMAINING.md` covering ALL of:

1. **10 NEEDS-DECISION items.** For each: the decision question; 2-3 options with tradeoffs; your
   **recommendation**; rough effort (S/M/L); the files/areas involved; and what honest-disable
   currently ships so nothing is lying in the meantime. (A-1 dossier edit UI, A-2 dossiers-update
   rewrite, C-3 MoU create, D-9 avatars bucket, D-10 user-mgmt routes, E-8 ConsistencyPanel,
   A-7 country fields, B-18 AA nested edits, D-15 AI multi-admin, D-19 MFA secret at-rest.)

2. **Deferred mechanical sweeps.** E-20 locale digits (mark **IN PROGRESS** — a sibling agent is doing
   it now) and **E-21 i18n ternaries** (33+ files — scope it: how to find them, the target pattern,
   verification). Plus the **33 LOW** deferred items grouped by theme with a one-line disposition each.

3. **⚠ Edge-function DEPLOYMENT (likely the biggest gap).** The sweep edited many
   `supabase/functions/*/index.ts` (list them from the git diff). Edge functions are **committed but
   NOT deployed** — the fixes are inert on staging until deployed. Plan the deploy: which functions,
   the command (Supabase MCP `deploy_edge_function` or `supabase functions deploy <name>`), the order,
   and a smoke check per function. Flag that several CRITICAL/HIGH fixes (after-actions-create title,
   tasks-create tenant, create-user role, MFA) only take effect after deploy.

4. **Frontend/droplet deploy.** Note the frontend fixes ship via the droplet Docker pipeline on merge
   (per CLAUDE.md Quick Deploy) — list what to verify post-deploy.

5. **PR #72 merge path.** 8 required checks (per project memory), auto-merge disabled; the watch+merge
   commands; and the manual smoke list before merging.

6. **Recommended sequencing** of all the above (what to do first/next), with risk notes.

Keep it concrete and skimmable (tables where useful). Do NOT edit source code. When done print
`PLAN REMAINING DONE`. Work fully autonomously; never ask a question.
