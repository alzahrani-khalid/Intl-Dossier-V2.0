---
phase: 100-security-posture
plan: 7
status: complete
requirement: DBSEC-04
completed: 2026-09-10
---

# P100-07 — RLS no-policy intent

The migration closes criterion 4 with exactly one `p100_service_role_only` policy on each target table.
Both policies are PERMISSIVE, apply to ALL commands for `service_role`, and carry `USING (true)` and
`WITH CHECK (true)`. The migration was applied directly with `psql`; no migration-ledger row was added.

## Separate intents

### `public.intelligence_email_queue`

This table's sole application writer is
`backend/src/adapters/intelligence/smtp-adapter.ts`, which writes through `supabaseAdmin`. Before this
change, `anon` and `authenticated` held table grants but RLS had no policy for them. An authenticated
caller therefore received an empty 200: the request was classified **ANSWERED with 0 rows**, which was
indistinguishable from an empty table. The migration revokes all privileges from both client roles, so
the same request is now classified **DENIED**. Adding the service-role policy while leaving those grants
in place would still answer with zero rows and fails the behavioural criterion; the revoke is the part
that changes the client-visible result.

### `events.idempotency_keys`

This table already granted nothing to `anon` or `authenticated` and had no tracked application reader
or writer outside its creating migration. Its client-role behavior was already **DENIED**, so the
migration deliberately does not revoke anything. Its new policy records the already-enforced
service-role-only intent and clears the `rls_enabled_no_policy` advisor class without pretending a
client grant previously existed.

## Per-role reach, before and after

`grant` is the result of `has_table_privilege(role, table, 'SELECT')`. `result` is a live `SELECT
count(*)` classified using the producer exit status (`ANSWERED` at exit 0, `DENIED` only for exit 3 plus
the PostgreSQL permission-denied diagnostic).

| table | role | before grant | before result | after grant | after result |
| --- | --- | ---: | --- | ---: | --- |
| `public.intelligence_email_queue` | `anon` | true | ANSWERED, 0 rows | false | DENIED |
| `public.intelligence_email_queue` | `authenticated` | true | ANSWERED, 0 rows | false | DENIED |
| `public.intelligence_email_queue` | `service_role` | true | ANSWERED, 0 rows | true | ANSWERED, 0 rows |
| `events.idempotency_keys` | `anon` | false | DENIED | false | DENIED |
| `events.idempotency_keys` | `authenticated` | false | DENIED | false | DENIED |
| `events.idempotency_keys` | `service_role` | true | ANSWERED, 0 rows | true | ANSWERED, 0 rows |

A service-role policy does not restrict the service role, which bypasses RLS: it records intent and
clears the advisor class, and anyone holding the service key still reads everything. The successful
`service_role` reads above prove retention of that access; they do not establish that possession of the
service key is constrained elsewhere.

## Recorded execution

### Baseline at HEAD (RED)

The baseline catalog and runtime probe was run before applying the migration. Its verbatim output was:

```text
POLICY|events.idempotency_keys|count=0
POLICY|public.intelligence_email_queue|count=0
REACH|events.idempotency_keys|anon=false|authenticated=false|service_role=true
REACH|public.intelligence_email_queue|anon=true|authenticated=true|service_role=true
ACL|events.idempotency_keys|postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
ACL|public.intelligence_email_queue|anon=DELETE,anon=INSERT,anon=MAINTAIN,anon=REFERENCES,anon=SELECT,anon=TRIGGER,anon=TRUNCATE,anon=UPDATE,authenticated=DELETE,authenticated=INSERT,authenticated=MAINTAIN,authenticated=REFERENCES,authenticated=SELECT,authenticated=TRIGGER,authenticated=TRUNCATE,authenticated=UPDATE,postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE
READ|public.intelligence_email_queue|anon|ANSWERED|rows=0|exit=0
READ|public.intelligence_email_queue|authenticated|ANSWERED|rows=0|exit=0
READ|public.intelligence_email_queue|service_role|ANSWERED|rows=0|exit=0
READ|events.idempotency_keys|anon|DENIED|exit=3
READ|events.idempotency_keys|authenticated|DENIED|exit=3
READ|events.idempotency_keys|service_role|ANSWERED|rows=0|exit=0
```

This is RED because neither table carries any policy. It also records the discriminating queue
behavior: an authenticated caller is ANSWERED with zero rows at HEAD.

### First apply and replay

Both invocations used:

```bash
PATH="/opt/homebrew/bin:$PATH"; set -a; . ./.env.test; set +a
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 \
  -f supabase/migrations/20260908000007_p100_rls_no_policy_intent.sql
```

First apply, verbatim output and captured status:

```text
BEGIN
REVOKE
DO
COMMENT
DO
COMMENT
COMMIT
FIRST_APPLY_EXIT=0
```

Second apply, verbatim output and captured status:

```text
BEGIN
REVOKE
DO
COMMENT
DO
COMMENT
COMMIT
SECOND_APPLY_EXIT=0
```

### Fresh post-apply policy rows and complete grant sets

The policy oracle renders schema/table, name, permissive mode, command, every role, USING, and WITH
CHECK. It then renders every ACL grantee and pairs that result with `has_table_privilege` for both
client roles. Verbatim output (command exit 0):

```text
  POLICY events.idempotency_keys|p100_service_role_only|PERMISSIVE|*|service_role|true|true
  POLICY public.intelligence_email_queue|p100_service_role_only|PERMISSIVE|*|service_role|true|true
  GRANTS events.idempotency_keys :: postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE anon=false auth=false
  GRANTS public.intelligence_email_queue :: postgres=DELETE,postgres=INSERT,postgres=MAINTAIN,postgres=REFERENCES,postgres=SELECT,postgres=TRIGGER,postgres=TRUNCATE,postgres=UPDATE,service_role=DELETE,service_role=INSERT,service_role=MAINTAIN,service_role=REFERENCES,service_role=SELECT,service_role=TRIGGER,service_role=TRUNCATE,service_role=UPDATE anon=false auth=false
P100-POLICY total_target_policies=2 queue_row=1 keys_row=1 queue_grants_ok=1 keys_grants_ok=1 expected total=2 and 1 for each
PASS policy rows
EXIT=0
```

The total is exactly two policies across the two tables. Matching the entire row is material: a policy
with the right name but `USING (false)`, `WITH CHECK (false)`, RESTRICTIVE mode, another command, or a
different role list renders a different value and fails. The queue and idempotency table each list
`postgres` and `service_role` as their only grantees, with all eight privileges retained for both.

### Fresh post-apply behavior and reach

The task's authenticated queue-read oracle produced:

```text
P100-07 reads: intelligence_email_queue=denied
PASS reads
EXIT=0
```

The complete per-role post-apply probe produced:

```text
REACH|events.idempotency_keys|anon=false|authenticated=false|service_role=true
REACH|public.intelligence_email_queue|anon=false|authenticated=false|service_role=true
READ|public.intelligence_email_queue|anon|DENIED|exit=3
READ|public.intelligence_email_queue|authenticated|DENIED|exit=3
READ|public.intelligence_email_queue|service_role|ANSWERED|rows=0|exit=0
READ|events.idempotency_keys|anon|DENIED|exit=3
READ|events.idempotency_keys|authenticated|DENIED|exit=3
READ|events.idempotency_keys|service_role|ANSWERED|rows=0|exit=0
EXIT=0
```

P100-14 owns the later fresh re-proof of these policy rows and behavioral reads after all database
changes in the phase have landed.
