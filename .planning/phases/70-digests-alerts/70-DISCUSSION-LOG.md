# Phase 70: Digests + Alerts - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-06-15
**Phase:** 70-Digests + Alerts
**Areas discussed:** Digest content & format, Alert trigger scope (v1), External channel + payload, Surfaces & subscriptions, generate_digest scoping

---

## Gray-area selection

All four offered gray areas were selected for discussion: Digest content & format, Alert
trigger scope (v1), External channel + payload, Surfaces & subscriptions.

---

## Digest content & format

### Content composition

| Option                      | Description                                                           | Selected |
| --------------------------- | --------------------------------------------------------------------- | -------- |
| Signals rollup (structured) | New/updated signals in the period, structured list, no LLM            |          |
| Signals + dossier activity  | Signals PLUS new engagements / commitments-due / relationship changes | ✓        |
| AI-written narrative        | LLM-composed prose summary (not feasible on-prem this phase)          |          |

**User's choice:** Signals + dossier activity
**Notes:** Implies the cron generator pulls several data planes (signals, engagement_dossiers,
aa_commitments, relationships) and clearance-gates each per subscriber. Deterministic this phase
(no on-prem LLM until P72).

### Frequency presets

| Option                   | Description                                 | Selected |
| ------------------------ | ------------------------------------------- | -------- |
| Daily + weekly           | Reuse the existing scheduler's two cadences |          |
| Daily + weekly + monthly | Add a monthly preset                        | ✓        |
| Custom per subscription  | Arbitrary interval/cron per subscription    |          |

**User's choice:** Daily + weekly + monthly

### Subscription target

| Option                        | Description                                                | Selected                |
| ----------------------------- | ---------------------------------------------------------- | ----------------------- |
| A single dossier (any type)   | One subscription = one dossier, topic = topic-type dossier | ✓ (Claude's discretion) |
| Dossier + 'my tracked' rollup | Also a combined digest spanning everything tracked         |                         |
| Dossier + saved signal filter | Also subscribe to a saved filter                           |                         |

**User's choice:** "you decide" → Claude chose **a single dossier (any of the 8 types, incl. topic)**.
**Notes:** Simplest, matches DIGEST-01 literally, reuses the polymorphic junction. Rollup +
saved-filter deferred (new models).

---

## Alert trigger scope (v1)

### Trigger types

| Option                          | Description                                                             | Selected                |
| ------------------------------- | ----------------------------------------------------------------------- | ----------------------- |
| New signal (+ severity filter)  | Fire on new signal on a subscribed dossier; optional high/urgent filter | ✓ (Claude's discretion) |
| + count threshold (N in window) | Rate-based rules; needs windowed aggregation                            |                         |
| Signal + other dossier events   | Also fire on engagements / commitments / relationship changes           |                         |

**User's choice:** "you decide the best for the project" → Claude chose **new signal + optional
severity filter**.
**Notes:** "Threshold" in ALERT-01 satisfied by the severity filter; rule condition stored as
structured config so count/window + other events can be added later without rework. Those are deferred.

### Alert object model

| Option                   | Description                                                              | Selected |
| ------------------------ | ------------------------------------------------------------------------ | -------- |
| Independent alert rule   | Standalone object (target + condition + channels), separate from digests | ✓        |
| Toggle on a subscription | Alerts as a flag on a digest subscription                                |          |

**User's choice:** Independent alert rule

### Delivery

| Option                           | Description                                                  | Selected |
| -------------------------------- | ------------------------------------------------------------ | -------- |
| Immediate, with coalescing guard | Per-event immediate, coalesce dupes/bursts in a short window | ✓        |
| Strictly immediate per event     | One delivery per event, no coalescing                        |          |

**User's choice:** Immediate, with coalescing guard

---

## External channel + payload

### Adapter structure

| Option                            | Description                                                             | Selected                |
| --------------------------------- | ----------------------------------------------------------------------- | ----------------------- |
| New adapter interface, 3 adapters | ChannelAdapter for in_app + SMTP + webhook, reusing existing send paths | ✓ (Claude's discretion) |
| Webhook adapter beside existing   | Leave in_app/email hardcoded; add only webhook                          |                         |

**User's choice:** "you decide the best for the project" → Claude chose **new ChannelAdapter
interface, 3 adapters**, isolated from the v4.0 personal-notification dispatch (no regression).

### External format

| Option                         | Description                                                   | Selected |
| ------------------------------ | ------------------------------------------------------------- | -------- |
| Generic JSON + Teams formatter | Small JSON envelope to configured URL + Teams-compatible card | ✓        |
| Teams card only                | Only a Teams Adaptive/MessageCard                             |          |
| Generic JSON only              | Plain JSON, no Teams shaping                                  |          |

**User's choice:** Generic JSON + Teams formatter
**Notes:** Endpoint URL still TBD with customer (open todo).

### Payload contents (ALERT-04)

| Option                         | Description                                                | Selected |
| ------------------------------ | ---------------------------------------------------------- | -------- |
| Deep-link + generic label only | No dossier name/title/severity/counts; authenticate in-app | ✓        |
| + non-sensitive metadata       | Also dossier name + count + severity badge                 |          |
| Configurable per endpoint      | Operator chooses verbosity                                 |          |

**User's choice:** Deep-link + generic label only
**Notes:** Hard contract — even a dossier name can leak tracking interest in a diplomatic context.
No verbosity knob.

---

## Surfaces & subscriptions

### Placement

| Option                      | Description                                                           | Selected |
| --------------------------- | --------------------------------------------------------------------- | -------- |
| Fold into /intelligence hub | Digests + Alerts as tabs joining P69 Signals + Reports                | ✓        |
| Settings                    | Manage next to existing NotificationPreferences / EmailDigestSettings |          |
| Hybrid                      | Read in /intelligence; configure channels in Settings                 |          |

**User's choice:** Fold into /intelligence hub

### Entry point

| Option                          | Description                                                           | Selected |
| ------------------------------- | --------------------------------------------------------------------- | -------- |
| From the dossier + central list | Subscribe/Add-alert on the dossier + management list in /intelligence | ✓        |
| Central form only               | Create everything from a form in /intelligence                        |          |
| From the dossier only           | Only from the dossier page                                            |          |

**User's choice:** From the dossier + central list

### Ownership

| Option               | Description                                     | Selected |
| -------------------- | ----------------------------------------------- | -------- |
| Personal only        | Subscription/alert belongs to its creating user | ✓        |
| Personal + team/role | Allow subscribing a team or role                |          |

**User's choice:** Personal only

---

## generate_digest scoping (DIGEST-04)

| Option                           | Description                                                      | Selected |
| -------------------------------- | ---------------------------------------------------------------- | -------- |
| Tool now + manual 'Generate now' | RPC + manual analyst preview→confirm→publish; agent wraps in P72 | ✓        |
| Tool/RPC only, no manual UI      | Define + direct-test RPC; no on-demand button this phase         |          |
| Defer DIGEST-04 to P72           | Don't build in P70; move to P72 with the agent                   |          |

**User's choice:** Tool now + manual 'Generate now'
**Notes:** Mirrors P69 D-14 (read_signals defined now, agent wraps in P72). The bilingual
generative-UI HITL confirmation card is P73.

---

## Claude's Discretion

- Subscription target granularity → single dossier (any type, incl. topic).
- v1 alert trigger set → new signal + optional severity filter; structured condition for forward-compat.
- Channel adapter structure → new 3-adapter interface isolated from the personal-notification dispatch.
- Digest body storage shape, coalescing window length, monthly cadence implementation, and the
  per-subscriber clearance generation mechanism → planner/researcher.

## Deferred Ideas

- AI-written digest narrative → P72/P73.
- Count/window threshold alerts + non-signal event triggers → post-v1.
- "My tracked dossiers" combined digest + saved-filter subscriptions → future.
- Team/role-owned subscriptions + fan-out → future (v1 personal-only).
- Per-endpoint configurable external verbosity → rejected for v1 (leak risk).
- Bilingual generative-UI HITL confirmation card for generate_digest → P73.
- Mastra/CopilotKit agent wrapping generate_digest → P72.
