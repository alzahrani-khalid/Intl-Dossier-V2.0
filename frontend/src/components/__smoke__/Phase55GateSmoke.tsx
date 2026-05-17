// PHASE 55 MERGE-02 SMOKE — DO NOT MERGE. Evidence captured in 55-SMOKE-PR-EVIDENCE.{json,png}.
//
// This component plants 4 simultaneous violations to prove the 8-context branch protection
// on `main` blocks merges (D-09 multi-violation rationale). The 4 violations map to required
// contexts (Pitfall 12 — must be required, not non-required, to produce BLOCKED not UNSTABLE):
//
//   (1) Raw hex literal `#abcdef`                  → Lint + Design Token Check
//   (2) Static import of bad-design-token fixture  → Lint + Design Token Check (transitive)
//   (3) `const badType: number = '...'` (string)   → type-check
//   (4) Heavy static import (recharts entire pkg) → Bundle Size Check (size-limit)
//
// This file is NOT wired into any route, App, or test. It is isolated in __smoke__/
// and removed when the smoke branch is deleted post-evidence-capture (D-12).

// Violation 2: pull the bad-design-token fixture into lint surface via static import
// (relative path from frontend/src/components/__smoke__/ to tools/eslint-fixtures/)
import '../../../../tools/eslint-fixtures/bad-design-token'

// Violation 4: heavy import to bust the 450 KB initial-bundle ceiling.
// recharts is ~3 MB unminified; importing the whole namespace + referencing a
// top-level component forces it into this leaf component's chunk.
import * as Recharts from 'recharts'

// Violation 1: raw hex literal (no design-token usage)
const planted = { color: '#abcdef' }

// Violation 3: type-check violation — string assigned to number
const badType: number = 'this is not a number'

export const Phase55GateSmoke = (): null => {
  // Reference the heavy import + planted values so tree-shaking can't elide them.
  void planted
  void badType
  void Recharts.LineChart
  void Recharts.AreaChart
  void Recharts.BarChart
  void Recharts.ResponsiveContainer
  return null
}
