# RULING-P99-82 — stop repairing the meta-harness; accept the runtime black-box

**Operator decision:** Simplify to black-box acceptance. Stop extending the 7,111-line selftest and its proof-of-proof criteria. Preserve every round as evidence, remove the optional selftest CLI from the runtime, and judge the shipped wrapper through one real crash/recovery scenario, the real bounded rendered run, and the standalone reviewed gate.

This ruling supersedes the unfinished implementation requirements in RULING-P99-81. It does not waive runtime safety or either real gate.

## 1. Why the strategy changes

The production runtime reached two-vendor no-material-defect convergence at R9 and stayed byte-identical through R17. R10–R18 changed only the selftest and criteria. That selftest grew beyond 7,000 lines and repeatedly introduced new ownership, cleanup, and control defects in code that does not execute in the Playwright wrapper's production path.

The latest checkpoint is decisive evidence: R18 added 465 selftest lines while the criteria remained untouched, and the riskiest new control had never run. Continuing would optimize the proof apparatus rather than the shipped behavior.

## 2. Preserve, then delete the optional meta-harness

Before changing bytes, freeze the complete R18 checkpoint into `.tickmarkr/overseer/freeze-p99r-r18-checkpoint/`:

- `scripts/pw-run-reaped.mjs`;
- `scripts/pw-run-reaped.selftest.mjs`;
- `.tickmarkr/overseer/P99R-REAPER-CRITERIA.md`;
- `P99R-R18-CHECKPOINT.md`;
- `SHA256SUMS.txt` verified 4/4.

Then:

1. remove `scripts/pw-run-reaped.selftest.mjs` from the candidate;
2. remove only the `--selftest` usage text and CLI branch from `scripts/pw-run-reaped.mjs`;
3. leave every production export, `runMode`, `--lease-exec`, `--sweep`, package script, Playwright config, and plan command unchanged.

The runtime diff from the R9/R17 hash must contain only that optional CLI deletion. No replacement unit harness and no new runtime abstraction.

Archive the current criteria before replacing it. Historical rulings/reports/freezes remain untouched.

## 3. One black-box crash/recovery instrument

Create one operator-owned Node script at `.tickmarkr/overseer/P99R-REAPER-BLACKBOX.mjs`. Standard library only. It must exercise the actual CLI and actual Playwright/webServer stack, not import a DI test seam to simulate it.

Scenario:

1. From the repository root, record the exact pre-state of ports 5173/5001, `.pw-leases`, the preserved helper, the three foreign graph-bearing directories, and the eight evidence paths. Refuse if either gate port is occupied or this repository has an existing live wrapper/lease.
2. Spawn the real command through `node scripts/pw-run-reaped.mjs --` against one existing Phase-99 Chromium test filter. Capture its wrapper pid and logs.
3. Wait until the lease whose JSON `wrapperPid` equals that exact wrapper pid exists and is valid. Read its exact lease path, sid, root, pid/pgid/start/cwd. This content is attribution; directory prefix or mtime is not.
4. SIGKILL only the wrapper pid. Confirm the wrapper exited and the leased session remains live from the recorded lease identity.
5. Run the product recovery command `node scripts/pw-run-reaped.mjs --sweep "$PWD"`.
6. Require exit 0, exact lease removal, zero members for the recorded session, ports restored to the exact pre-state, and no protected identity changed.
7. Write a JSON evidence record naming every acted-on pid/sid/path and the before/after observations. Remove only scratch/result files created by this instrument. Never glob `tkr-*`.

The instrument must carry a hard wall-clock ceiling and clean its own spawned process group on any internal error. It never touches the neighboring repository's live run.

Positive control: run the same recovery assertion against a copy of the lease with a deliberately wrong nonce or birth identity and prove the runtime refuses it without signaling the real session. Then clean the real lease through the unmodified product path.

## 4. Minimal criteria

Replace `.tickmarkr/overseer/P99R-REAPER-CRITERIA.md` with a short behavioral artifact containing only:

- `node --check scripts/pw-run-reaped.mjs`;
- the black-box instrument above, with its evidence path;
- exact collection counts and the bounded real rendered commands already present in the Phase-99 plans;
- criteria requiring the black-box evidence to show attributed lease creation, wrapper SIGKILL, live orphan, product `--sweep`, exact zero, foreign/evidence preservation, and positive-control refusal;
- an explicit limit: this proves one real normal environment and one real crash/recovery path, not every errno, power loss, PID reuse, or kernel schedule.

No source-text absence grep, synthetic row count, self-reported PASS total, hand-authored ownership manifest, or generated test-of-test mutant.

## 5. Verification and commit order

The orchestrator writes `.tickmarkr/overseer/P99R-BLACKBOX-HANDOFF.md` ending `ORCH-P99R-BLACKBOX-END`, with:

- checkpoint freeze 4/4;
- exact runtime deletion diff;
- black-box script hash and evidence JSON;
- actual command/log/exit values;
- protected identity proof;
- a proposed exact candidate commit manifest classifying every dirty path and excluding generated/operator-only artifacts.

Stop for OVERSEER ruling. No commit yet.

After release:

1. run the bounded rendered Playwright Phase-99 battery through the production wrapper;
2. OVERSEER commits only the approved candidate manifest;
3. run `tickmarkr verify --base 0413fa1af --criteria .tickmarkr/overseer/P99R-REAPER-CRITERIA.md` with review enabled;
4. on green, recompile Phase 99, confirm P99-01…06 done and P99-07 pending, and start through `morning-start.sh` only.

The black-box instrument and criteria stay operator-owned under `.tickmarkr/`; they are acceptance evidence, not shipped runtime. The runtime fix ships in `scripts/pw-run-reaped.mjs`, package/config/plan paths already named by RULING-P99-50, and project skill guards already in the dirty candidate.

## 6. Role and layout

No replacement R18 implementer. The orchestrator owns this evidence assembly and may use one fresh visible read-only reviewer for the exact runtime deletion plus black-box script before handoff. Do not revive the proof-of-proof reviewers or selftest lineage.

Preserve `tkr-bridge-helper-67472.mjs` unchanged; its missing authority remains historical evidence. Never touch the foreign trio or eight evidence paths.

**Ship/no-ship:** Delete the non-shipping meta-harness. Ship only production wrapper/config/plan changes. Keep the black-box instrument as operator acceptance evidence because it exercises real behavior and does not enter application or package runtime.
