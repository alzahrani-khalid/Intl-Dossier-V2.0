# 94-STAGE-PARITY — the client `STAGE_TO_STATUS` map vs the live `sync_task_status_from_workflow_stage` CASE

**Derived 2026-08-16** by plan `94-08` Task 3, against staging `zkrcjzdemdmwhearhfgg`.
Discharges `D-34` / `P94-TRIGGER-SWEEP` §F1.

`WorkBoard.tsx`'s `STAGE_TO_STATUS` is a **second copy of a database rule that nothing keeps in
sync**. The two agree today by authorship, not by construction. This file is the evidence that they
agree today, and it names the seam so a future divergence is a finding rather than a surprise.

---

## The derivation — both copies, live, never quoted from a document

**DB side** (Supabase MCP `execute_sql`):

```sql
SELECT prosrc FROM pg_proc WHERE proname = 'sync_task_status_from_workflow_stage';
```

Attachment, derived in the same pass:

```sql
SELECT t.tgname, pg_get_triggerdef(t.oid)
FROM pg_trigger t
WHERE t.tgrelid = 'public.tasks'::regclass AND NOT t.tgisinternal;
```

→ `CREATE TRIGGER trg_sync_task_status BEFORE UPDATE ON public.tasks FOR EACH ROW EXECUTE FUNCTION sync_task_status_from_workflow_stage()`

**Client side**, pinned to a sha rather than to "HEAD" (HEAD moves; this tree has concurrent lanes):

```bash
git show 7f8946ab8d14acaef4562ff66e6556618678a792:frontend/src/pages/WorkBoard/WorkBoard.tsx
# STAGE_TO_STATUS is at lines 83–89
```

---

## Population definition

**The population is the five `workflow_stage` keys** — `todo`, `in_progress`, `review`, `done`,
`cancelled` — compared cell-for-cell in both directions. That is the whole key set of the client
`Record<WorkflowStage, string>` and the whole `WHEN` list of the DB `CASE`; neither side carries a
sixth key.

**What falls OUTSIDE the population, stated rather than discovered later:**

1. **The `completed_at` side effect.** The DB's `done` branch also stamps
   `NEW.completed_at := NOW()` when it is NULL. The client map has **no equivalent** — it is a
   stage→status dictionary and cannot express a second column write. This is not a mismatch; it is a
   cell the client map structurally cannot hold. It is called out because a naive "the two agree"
   claim would imply the DB does nothing else, and it does.
2. **The `ELSE NULL` branch.** An unknown stage leaves `status` unchanged in the DB. The client
   `Record<WorkflowStage, string>` is total over the union type, so it has no unknown-stage case at
   all. Out of population on both sides.
3. **The `IF NEW.workflow_stage IS DISTINCT FROM OLD.workflow_stage` guard.** The DB re-derives
   `status` only when the stage actually changes; a status-only UPDATE passes through untouched. The
   client map is a pure lookup with no notion of a previous value.
4. **`aa_commitments`.** Commitments have no `workflow_stage` and are not governed by this trigger.
   Their own mapping lives in `frontend/src/pages/WorkBoard/commitment-stage-guard.ts`
   (`COMMITMENT_STAGE_TO_STATUS`, three cells) and is a separate subject.

---

## The two tables, side by side

<!-- prettier-ignore -->
| `workflow_stage` | DB — `sync_task_status_from_workflow_stage` | client — `STAGE_TO_STATUS` | cell |
| --- | --- | --- | --- |
| `todo`        | `NEW.status := 'pending'`     | `todo: 'pending'`             | MATCH |
| `in_progress` | `NEW.status := 'in_progress'` | `in_progress: 'in_progress'`  | MATCH |
| `review`      | `NEW.status := 'review'`      | `review: 'review'`            | MATCH |
| `done`        | `NEW.status := 'completed'` (+ `completed_at := NOW()` if NULL) | `done: 'completed'` | MATCH (status cell; the `completed_at` stamp is out of population — see 1 above) |
| `cancelled`   | `NEW.status := 'cancelled'`   | `cancelled: 'cancelled'`      | MATCH |

Live `prosrc`, verbatim, as the record of what was compared:

```plpgsql
BEGIN
  -- Only sync when workflow_stage changes
  IF NEW.workflow_stage IS DISTINCT FROM OLD.workflow_stage THEN
    CASE NEW.workflow_stage
      WHEN 'todo' THEN
        NEW.status := 'pending';
      WHEN 'in_progress' THEN
        NEW.status := 'in_progress';
      WHEN 'review' THEN
        NEW.status := 'review';
      WHEN 'done' THEN
        NEW.status := 'completed';
        -- Also set completed_at if not already set
        IF NEW.completed_at IS NULL THEN
          NEW.completed_at := NOW();
        END IF;
      WHEN 'cancelled' THEN
        NEW.status := 'cancelled';
      ELSE
        -- No change for unknown stages
        NULL;
    END CASE;
  END IF;

  RETURN NEW;
END;
```

Client copy, verbatim at `7f8946ab8d14acaef4562ff66e6556618678a792`:

```ts
// Map workflow stage → task_status enum value (per useUnifiedKanban DB notes).
const STAGE_TO_STATUS: Record<WorkflowStage, string> = {
  todo: 'pending',
  in_progress: 'in_progress',
  review: 'review',
  done: 'completed',
  cancelled: 'cancelled',
}
```

---

## The standing consequence (D-34)

**No `WRITE-04` oracle asserts that a client task-status payload reached the row.** For tasks,
`status` is DB-derived from `workflow_stage` by `trg_sync_task_status`, which runs `BEFORE UPDATE`
and overwrites whatever the client sent. An oracle asserting "the status we posted is the status
stored" would pass for the wrong reason — it would be reading the trigger's output and crediting the
client. Task-side oracles in this phase assert `workflow_stage`, which is the value the client
actually owns.

`WorkBoard.tsx` still sends `newStatus: STAGE_TO_STATUS[targetStage]` alongside
`newWorkflowStage`. That payload is redundant for tasks — the trigger derives the same value — and
it is **not removed here**: whether the client should stop sending a column the database owns is a
product call about the seam, not a parity finding. Phase 96 owns the seam's future
(`COUNT-03` / `COUNT-04`).

**If this file ever reads `PARITY: MISMATCH`, that is a STOP, not a footnote.** Which copy is right
is a product decision; neither may be adapted to the other silently.

---

PARITY: MATCH
