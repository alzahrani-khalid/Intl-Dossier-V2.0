---
phase: 100-security-posture
plan: 04
status: complete
completed: 2026-09-10
requirements: [DBSEC-01, DBSEC-02]
---

# P100-04: auth.users view exposure summary

## Result

`public.entity_comments_with_details` now reads `public.users`, retains its client grant, and uses
`security_invoker=true`. `public.upcoming_milestones` is no longer readable by `anon` or
`authenticated`. No migration-ledger row was created.

## Migration applies and replay safety

The first attempted apply exposed that the old `author_email` output is `character varying(255)`, not
unbounded `character varying`. PostgreSQL rejected the replacement before any statement was applied:

```bash
PATH="/opt/homebrew/bin:$PATH"
set -a
. ./.env.test
set +a
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/migrations/20260908000004_p100_auth_users_exposure.sql
```

```text
psql:supabase/migrations/20260908000004_p100_auth_users_exposure.sql:46: ERROR:  cannot change data type of view column "author_email" from character varying(255) to character varying
exit 3
```

The migration was corrected to cast `public.users.email` to `character varying(255)`. Both required
applies then completed successfully. First apply, exit status 0:

```text
CREATE VIEW
ALTER VIEW
REVOKE
```

Second apply (the idempotency replay), exit status 0:

```text
CREATE VIEW
ALTER VIEW
REVOKE
```

Both successful applies used the same command shown above. `CREATE OR REPLACE VIEW`, `ALTER VIEW ...
SET`, and `REVOKE` are safe to replay and the second run proves that property on staging.

## Fresh post-apply state oracle

Command:

```bash
PATH="/opt/homebrew/bin:$PATH"; set -a; . ./.env.test 2>/dev/null; set +a
PQ() { PSQL_OUT=$(psql "$SUPABASE_DB_URL" -Atq -v ON_ERROR_STOP=1 -c "$1" 2>&1); PSQL_RC=$?; }
PQ_OK() { PQ "$1"; [ "$PSQL_RC" = "0" ] || { echo "INSTRUMENT-CANNOT-RUN: psql exited $PSQL_RC for $2 :: $PSQL_OUT"; exit 3; }; }
PQ_OK "select c.relname||' invoker='||(case when 'security_invoker=true' = any(coalesce(c.reloptions,'{}')) then 'true' else 'false' end)||' client_readable='||has_table_privilege('authenticated',c.oid,'SELECT')||' reads_public_users='||(exists (select 1 from pg_rewrite r join pg_depend d on d.objid=r.oid and d.classid='pg_rewrite'::regclass join pg_class t on t.oid=d.refobjid join pg_namespace tn on tn.oid=t.relnamespace where r.ev_class=c.oid and tn.nspname='public' and t.relname='users'))||' reads_auth_users='||(exists (select 1 from pg_rewrite r join pg_depend d on d.objid=r.oid and d.classid='pg_rewrite'::regclass join pg_class t on t.oid=d.refobjid join pg_namespace tn on tn.oid=t.relnamespace where r.ev_class=c.oid and tn.nspname='auth' and t.relname='users')) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname in ('entity_comments_with_details','upcoming_milestones') order by 1" "the criterion-2 view state"
STATE=$PSQL_OUT
printf '%s\n' "$STATE" | sed 's/^/  STATE /'
E=$(printf '%s\n' "$STATE" | grep -c '^entity_comments_with_details invoker=true client_readable=true reads_public_users=true reads_auth_users=false$')
U=$(printf '%s\n' "$STATE" | grep -c '^upcoming_milestones invoker=false client_readable=false reads_public_users=false reads_auth_users=true$')
PQ_OK "select count(distinct c.relname) from pg_class c join pg_namespace n on n.oid=c.relnamespace join pg_rewrite r on r.ev_class=c.oid join pg_depend d on d.objid=r.oid and d.classid='pg_rewrite'::regclass join pg_class t on t.oid=d.refobjid join pg_namespace tn on tn.oid=t.relnamespace where n.nspname='public' and c.relkind in ('v','m') and tn.nspname='public' and t.relname='dossiers'" "the dependency-detector control"
CTL=$PSQL_OUT
echo "P100-04-STATE entity_comments_row_matches=$E upcoming_milestones_row_matches=$U dependency_detector_control=$CTL expected 1 1 18"
[ "$CTL" = "18" ] || exit 3
[ "$E" = "1" ] && [ "$U" = "1" ] || exit 1
echo "PASS criterion-2 state"
```

Verbatim output, exit status 0:

```text
  STATE entity_comments_with_details invoker=true client_readable=true reads_public_users=true reads_auth_users=false
  STATE upcoming_milestones invoker=false client_readable=false reads_public_users=false reads_auth_users=true
P100-04-STATE entity_comments_row_matches=1 upcoming_milestones_row_matches=1 dependency_detector_control=18 expected 1 1 18
PASS criterion-2 state
```

This is a positive end-state test: both complete catalog rows match. The separate dependency-walk
control found 18 views depending on `public.dossiers`, proving the instrument can observe TRUE; a false
dependency result cannot masquerade as a repair. At HEAD, neither named catalog row matched.

## Authenticated behavioral pair

The oracle resolved `kazahrani@stats.gov.sa` and `test.user@gmail.com` from `auth.users`, then ran each
read in a transaction after `SET LOCAL ROLE authenticated` and setting the caller's JWT claims. Its
read classifier accepts only a numeric answer or the specific PostgreSQL `permission denied for`
failure; malformed output or any unrelated database failure exits 3.

The exercised SQL shape for each view was:

```bash
printf 'begin;\nset local role authenticated;\nset local request.jwt.claims = %s;\nselect count(*) from %s;\ncommit;\n' \
  "'{\"sub\":\"$CALLER_UID\",\"role\":\"authenticated\"}'" "$VIEW" \
  | psql "$SUPABASE_DB_URL" -Atq -v ON_ERROR_STOP=1
```

Verbatim oracle output, exit status 0:

```text
P100-04 reads: entity_comments_with_details=0(empty-on-staging) upcoming_milestones=denied
PASS reads
```

The zero-row comment view therefore still **answered** its authenticated edge-function caller. This
distinguishes the repair from the plausible-wrong invoker conversion that retains an `auth.users` join
and fails with `permission denied for table users`. The zero-row milestone view was **denied**, as
required; neither conclusion relies on a row-count difference.

## Edge-function output contract

The edge function reads the view with `.select('*')`:

```text
222:            .from('entity_comments_with_details')
223:            .select('*')
```

Consequently every output column is part of its read contract. This command compared the post-apply
catalog schema, ordinal by ordinal, against the pre-re-point names and types:

```bash
psql "$SUPABASE_DB_URL" -At -v ON_ERROR_STOP=1 -F '|' -c "
with expected(ordinal_position, column_name, data_type) as (
  values
    (1,'id','uuid'), (2,'entity_type','commentable_entity_type'),
    (3,'entity_id','uuid'), (4,'parent_id','uuid'), (5,'thread_root_id','uuid'),
    (6,'thread_depth','integer'), (7,'content','text'), (8,'content_html','text'),
    (9,'visibility','comment_visibility'), (10,'is_edited','boolean'),
    (11,'edited_at','timestamp with time zone'), (12,'edit_count','integer'),
    (13,'created_at','timestamp with time zone'), (14,'updated_at','timestamp with time zone'),
    (15,'author_id','uuid'), (16,'author_email','character varying(255)'),
    (17,'author_name','text'), (18,'author_avatar','text'), (19,'reply_count','integer'),
    (20,'reactions','jsonb'), (21,'mentions','jsonb')
), actual as (
  select a.attnum ordinal_position, a.attname::text column_name,
         format_type(a.atttypid,a.atttypmod) data_type
  from pg_attribute a
  where a.attrelid='public.entity_comments_with_details'::regclass
    and a.attnum > 0 and not a.attisdropped
)
select e.ordinal_position||' '||e.column_name||' expected='||e.data_type||
       ' actual='||coalesce(a.data_type,'MISSING')||
       ' same_name_and_type='||(a.column_name=e.column_name and a.data_type=e.data_type)
from expected e left join actual a using (ordinal_position) order by e.ordinal_position;"
```

Verbatim output, exit status 0:

```text
1 id expected=uuid actual=uuid same_name_and_type=true
2 entity_type expected=commentable_entity_type actual=commentable_entity_type same_name_and_type=true
3 entity_id expected=uuid actual=uuid same_name_and_type=true
4 parent_id expected=uuid actual=uuid same_name_and_type=true
5 thread_root_id expected=uuid actual=uuid same_name_and_type=true
6 thread_depth expected=integer actual=integer same_name_and_type=true
7 content expected=text actual=text same_name_and_type=true
8 content_html expected=text actual=text same_name_and_type=true
9 visibility expected=comment_visibility actual=comment_visibility same_name_and_type=true
10 is_edited expected=boolean actual=boolean same_name_and_type=true
11 edited_at expected=timestamp with time zone actual=timestamp with time zone same_name_and_type=true
12 edit_count expected=integer actual=integer same_name_and_type=true
13 created_at expected=timestamp with time zone actual=timestamp with time zone same_name_and_type=true
14 updated_at expected=timestamp with time zone actual=timestamp with time zone same_name_and_type=true
15 author_id expected=uuid actual=uuid same_name_and_type=true
16 author_email expected=character varying(255) actual=character varying(255) same_name_and_type=true
17 author_name expected=text actual=text same_name_and_type=true
18 author_avatar expected=text actual=text same_name_and_type=true
19 reply_count expected=integer actual=integer same_name_and_type=true
20 reactions expected=jsonb actual=jsonb same_name_and_type=true
21 mentions expected=jsonb actual=jsonb same_name_and_type=true
```

Thus `id`, `entity_type`, `entity_id`, `parent_id`, `thread_root_id`, `thread_depth`, `content`,
`content_html`, `visibility`, `is_edited`, `edited_at`, `edit_count`, `created_at`, `updated_at`,
`author_id`, `author_email`, `author_name`, `author_avatar`, `reply_count`, `reactions`, and `mentions`
all survive the re-point with the same name, ordinal position, and type.

## Two-identity `public.users` census and privacy bound

The §5 census was freshly re-run with producer status captured before extracting each numeric value:

```bash
resolve_uid() {
  UID_OUT=$(psql "$SUPABASE_DB_URL" -Atq -v ON_ERROR_STOP=1 -c "select id from auth.users where email = '$1'" 2>&1)
  UID_RC=$?
  [ "$UID_RC" = "0" ] || exit 3
  RESOLVED_UID=$(printf '%s' "$UID_OUT" | tail -1)
}
count_public_users() {
  COUNT_OUT=$(printf 'begin;\nset local role authenticated;\nset local request.jwt.claims = %s;\nselect count(*) from public.users;\ncommit;\n' \
    "'{\"sub\":\"$2\",\"role\":\"authenticated\"}'" \
    | psql "$SUPABASE_DB_URL" -Atq -v ON_ERROR_STOP=1 2>&1)
  COUNT_RC=$?
  [ "$COUNT_RC" = "0" ] || exit 3
  COUNT=$(printf '%s' "$COUNT_OUT" | tail -1)
  case "$COUNT" in *[!0-9]*|"") exit 3;; esac
  echo "$1 public.users=$COUNT"
}
resolve_uid kazahrani@stats.gov.sa; OWNER_UID=$RESOLVED_UID
resolve_uid test.user@gmail.com; OTHER_UID=$RESOLVED_UID
count_public_users kazahrani@stats.gov.sa "$OWNER_UID"
count_public_users test.user@gmail.com "$OTHER_UID"
```

Verbatim output, exit status 0:

```text
kazahrani@stats.gov.sa public.users=415
test.user@gmail.com public.users=415
```

This is the two-identity **415/415** `public.users` row census carried from `100-RESEARCH.md` §5.
Because every authenticated census identity can already read every one of those rows, this plan removes
the `auth.users` exposure and does **NOT** narrow who can see a colleague's display name.
