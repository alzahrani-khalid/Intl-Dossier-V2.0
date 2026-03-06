# Database Foreign Key Constraint Policy

## Overview

This document defines the foreign key constraint strategy used across all PostgreSQL tables in the Intl-Dossier system.

## Constraint Types

### CASCADE — Child Records Dependent on Parent

Use `ON DELETE CASCADE` when child records have no meaning without their parent.

**Examples:**

- `after_action_decisions.after_action_id` → deleting an after-action removes its decisions
- `work_item_dossiers.work_item_id` → deleting a work item removes its dossier links
- `dossier_relationships.source_dossier_id` → deleting a dossier removes its relationships
- `commitment_follow_ups.commitment_id` → follow-ups only exist under a commitment

### SET NULL — Survivable References

Use `ON DELETE SET NULL` when the referencing record should survive parent deletion, but the link becomes optional.

**Examples:**

- `work_items.assignee_id` → if a user is removed, the work item remains unassigned
- `documents.uploaded_by` → document survives even if uploader account is removed
- `intelligence_signals.created_by` → signal record persists

### RESTRICT — Protected References

Use `ON DELETE RESTRICT` (or no action) when deletion of the parent should be blocked because dependent data is critical.

**Examples:**

- `dossiers.id` referenced by active work items → prevent deleting dossiers with open tasks
- `users.id` referenced by active sessions → prevent deleting users with active work

## Decision Guide

| Question                                             | If YES                      | If NO               |
| ---------------------------------------------------- | --------------------------- | ------------------- |
| Does the child record make sense without the parent? | SET NULL or RESTRICT        | CASCADE             |
| Should deleting the parent be blocked?               | RESTRICT                    | CASCADE or SET NULL |
| Is the FK column nullable?                           | SET NULL is an option       | CASCADE or RESTRICT |
| Is this an audit/history table?                      | SET NULL (preserve history) | Depends on context  |

## Migration Convention

Always specify the constraint explicitly in migrations:

```sql
ALTER TABLE child_table
  ADD CONSTRAINT fk_child_parent
  FOREIGN KEY (parent_id) REFERENCES parent_table(id)
  ON DELETE CASCADE;  -- or SET NULL / RESTRICT
```
