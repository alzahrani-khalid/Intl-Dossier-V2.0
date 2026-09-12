> **WORKER-REACHABLE COPY.** Authoritative original: `.tickmarkr/overseer/RULING-P99-18-C1-CORRECTED.md` (gitignored).
> Copied 2026-08-19 so citations resolve from a worktree; the original governs.

# RULING P99-18 — c1 was UNDER-SPECIFIED by me; b1 landed; price three ways to serialize

2026-08-18, OVERSEER (wK:p7X). Correcting `RULING-P99-17` §4 on contact, before it is built on.

## 1. b1 — DONE, by me, in `playwright.config.ts`

`reuseExistingServer` is now `process.env.PW_REUSE === '1'` — opt-in, never implicit — with the
measurement in a comment beside it so the next reader gets the reason and not just the rule. Human
workflow preserved: `PW_REUSE=1 pnpm exec playwright test` reuses a running dev server exactly as
before. This closes the false-green class permanently rather than only today's instance.

## 2. c1 — my error, stated plainly

I ruled "per-worktree deterministic port" as if the frontend were the only listener. It is not.
`webServer.command` is `pnpm dev`, which is `doppler run -- turbo run dev` across THREE packages:
vite (5173 by default, no port in `frontend/vite.config.ts`), the backend (`PORT || 5001`,
`backend/src/index.ts:33`) and agent-runtime. Engine `concurrency: 3`
(`.tickmarkr/config.yaml:2`). **A per-worktree frontend port therefore does not prevent collision
— two concurrent rendered gates still fight over the backend port**, and the failure would look
like a flaky rendered oracle rather than a port conflict, which is the worst shape it could take.

I am not going to invent a locking protocol and ship it unexercised at the end of a long night.
Price these three; I rule on your numbers:

| #         | approach                                                                                                                      | what I want priced                                                                                                                                                                                                                                                             |
| --------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **c-i**   | **Mutex in the rendered oracles** — each acquires an exclusive lock before invoking Playwright, so only those tasks serialize | the lock primitive that actually exists on this macOS (no `flock`; `mkdir`-atomic or `shlock`), the wait/timeout behaviour when a task blocks, and whether a held lock can outlive a killed gate (a stale lock deadlocks the run — that is the failure mode to design against) |
| **c-ii**  | **Run-level `concurrency: 1`**                                                                                                | measured wall-clock cost across 41 tasks — take the observed per-task times from runs 0010/0011 rather than guessing; zero repo change, zero new machinery, and it is the only option with no new failure mode                                                                 |
| **c-iii** | **Full per-worktree port set** — vite `--port`, backend `PORT`, `baseURL`, all derived together                               | the plumbing through `turbo run dev` (whether args/env reach vite at all), and how many repo files it touches                                                                                                                                                                  |

State which you would choose and why. My prior is c-ii unless its wall-clock is genuinely
prohibitive: it introduces no new mechanism, and every mechanism this phase has added is where the
defects came from. **c-i's stale-lock deadlock is exactly the class we keep meeting** — a guard
whose failure mode is silence.

## 3. Sequencing unchanged

Your five conversions proceed now; they are independent of the c decision. My `playwright.config.ts`
edit and your conversions land in ONE commit before relaunch, after c is ruled and (if it touches
the repo) built.

## 4. Minor, for your statusline

While verifying the halt I noticed the statusline renders `P99-04⚙²@codex 47m` with no run alive —
it is reading the halted run's journal and ageing a worker that no longer exists. Not a defect in
the run; a display that can read as "work in flight" to anyone glancing at the tab. Worth a note in
your record, and possibly an upstream seed if the surface is the shipped one.

RULING-END
