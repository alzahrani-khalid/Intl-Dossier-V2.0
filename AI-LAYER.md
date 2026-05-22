# Intl-Dossier AI Layer

The harness around Claude Code in this repo — the configuration, context, and reusable workflows that make an agent productive _in this codebase specifically_. Adapted from Anthropic's article [_How Claude Code works in large codebases: best practices and where to start_](https://claude.com/blog/how-claude-code-works-in-large-codebases-best-practices-and-where-to-start) and Cole Medin's [`coleam00/helpline`](https://github.com/coleam00/helpline) companion repo.

**Article thesis:** the harness — the ecosystem built around the model — determines how Claude Code performs more than the model alone.

## Extension points — article → artifact

| Extension point                 | Article guidance                                                                                                                      | Built here                                                                                                                                                                                                                                                    | Location                                                                                                                                |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| **CLAUDE.md hierarchy**         | Loaded first; lean root, subdirectory files load additively as Claude walks the tree                                                  | Lean root (~5KB) + 5 per-workspace files                                                                                                                                                                                                                      | `CLAUDE.md`, `backend/CLAUDE.md`, `frontend/CLAUDE.md`, `supabase/CLAUDE.md`, `tests/CLAUDE.md`, `frontend/src/design-system/CLAUDE.md` |
| **Hooks**                       | Self-improving setup, not just prevention. A Stop hook can reflect on a session and propose CLAUDE.md updates while context is fresh. | `SessionStart` prints dynamic orientation. `Stop` splits into a cheap trigger (`propose`) and a detached LLM reflector (`reflect`) that writes proposed edits to `.claude/claude-md-review.md`. Recursion guard + fingerprint dedup + deterministic fallback. | `.claude/hooks/session-start-context.mjs`, `propose-claude-md.mjs`, `reflect-claude-md.mjs`                                             |
| **Skills**                      | On-demand expertise, progressive disclosure, scoped to specific paths                                                                 | 4 skills, each with `paths:` frontmatter + `references/` for deep detail                                                                                                                                                                                      | `.claude/skills/supabase-migration-safety/`, `edge-function-add/`, `dossier-centric-link/`, `scoped-tests/`                             |
| **Subagents**                   | Split exploration from editing — read-only mapper, separate context window                                                            | `explorer` — `tools: Read, Grep, Glob` only. Returns a structured report.                                                                                                                                                                                     | `.claude/agents/explorer.md`                                                                                                            |
| **Codebase map + ignore rules** | Make the codebase navigable; cut noise from search                                                                                    | `CODEBASE_MAP.md` (find-a-feature index) + extended `.claudeignore`                                                                                                                                                                                           | `CODEBASE_MAP.md`, `.claudeignore`                                                                                                      |
| **LSP**                         | Symbol-level precision instead of text-pattern false positives                                                                        | Existing TS toolchain via IDE tsserver — no separate setup needed                                                                                                                                                                                             | (IDE-provided)                                                                                                                          |
| **MCP**                         | Expose structured search as callable tools                                                                                            | Existing MCP coverage (`auggie__codebase-retrieval`, `plugin_supabase_supabase`, etc.)                                                                                                                                                                        | `.mcp.json`                                                                                                                             |
| **Plugins**                     | Bundle skills/hooks/MCP into installable packages                                                                                     | Not adopted — solo project, no team distribution need                                                                                                                                                                                                         | n/a                                                                                                                                     |

## Configuration patterns (from the article, applied here)

### Pattern 1 — Make the codebase navigable

- **Lean root CLAUDE.md** (~5KB pointers) + 5 per-workspace files
- **`CODEBASE_MAP.md`** — find where a feature lives before reading files
- **`.claudeignore`** — excludes generated artifacts, lockfiles, agent worktrees
- **Scoped test commands** — the `scoped-tests` skill picks the narrowest pnpm command instead of the full suite

### Pattern 2 — Actively maintain CLAUDE.md as models evolve

- The **`Stop` hook** is the proactive half. `propose-claude-md.mjs` cheaply detects which areas changed; `reflect-claude-md.mjs` asks headless `claude -p` to reflect on the diff against current CLAUDE.mds and draft concrete edits into `.claude/claude-md-review.md`. Recursion guard via `INTL_DOSSIER_REFLECT_LOCK`. Deterministic fallback if `claude` is unavailable.
- **Review cadence:** a full `CLAUDE.md` / skills / hooks review every **3–6 months**, and after any major model release. Rules written for an older model's limits become drag once newer models can handle more — delete them when that happens.

### Pattern 3 — Ownership

Solo project — single DRI is the project owner. No plugin marketplace needed; configuration lives in version control and travels with the repo.

## Manual verification

After any AI Layer change, run these by hand:

```bash
node .claude/hooks/session-start-context.mjs < /dev/null     # prints orientation block
node .claude/hooks/propose-claude-md.mjs < /dev/null         # exits 0 cleanly
node .claude/hooks/__tests__/session-start-context.test.mjs  # smoke test
node .claude/hooks/__tests__/propose-claude-md.test.mjs      # smoke tests
node -e "JSON.parse(require('fs').readFileSync('.claude/settings.json'))" && echo "settings.json valid"
```

**Verify referenced links resolve:**

```bash
for path in CLAUDE.md backend/CLAUDE.md frontend/CLAUDE.md supabase/CLAUDE.md tests/CLAUDE.md frontend/src/design-system/CLAUDE.md CODEBASE_MAP.md .claudeignore .claude/hooks/session-start-context.mjs .claude/hooks/propose-claude-md.mjs .claude/hooks/reflect-claude-md.mjs .claude/agents/explorer.md .claude/skills/supabase-migration-safety .claude/skills/edge-function-add .claude/skills/dossier-centric-link .claude/skills/scoped-tests; do
  test -e "$path" && echo "✓ $path" || echo "✗ $path"
done
```

Expected: 16 `✓` lines, zero `✗`. Any `✗` means a prior phase did not produce the expected artifact — STOP and report BLOCKED with the missing path.
