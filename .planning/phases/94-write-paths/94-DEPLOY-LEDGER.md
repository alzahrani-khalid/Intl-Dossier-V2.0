# Phase 94 — Deploy Ledger (plan 94-10)

Deploy evidence for the 27 edge audit writers repaired by plan `94-10` (D-19: a fixed
function that is not redeployed has not been fixed). One row per `supabase functions
deploy <name>` against staging `zkrcjzdemdmwhearhfgg`.

## Row format — a CROSS-PLAN CONTRACT, positive-controlled before first use

Rows are **`| <fn> | <ISO timestamp> | OK |`** — the verdict cell is **LAST**. Plan
`94-11`'s counting gate greps a verdict-last shape; GATE-STANDARD **C9a** instance
`92-04` is what happens when a producing plan closes green while quietly emitting a
different column order that only a downstream gate ever reads.

**Positive control, run BEFORE any real row was written** (C9a: "the consuming gate's
parse must be positive-controlled against a synthetic row in the mandated shape before
either plan runs"). A single synthetic row in the mandated shape was appended to this
file, the counter run, and the row then deleted:

```
$ grep -cE '\| *OK *\|[[:space:]]*$' 94-DEPLOY-LEDGER.md      # header-only baseline
0
$ printf '| synthetic-control | 2026-01-01T00:00:00Z | OK |\n' >> 94-DEPLOY-LEDGER.md
$ grep -cE '\| *OK *\|[[:space:]]*$' 94-DEPLOY-LEDGER.md
1
$ # negative half of the same control, same file, six-column 92-04 shape:
$ printf '| synthetic-six-col | 2026-01-01T00:00:00Z | OK | why deployed |\n' >> 94-DEPLOY-LEDGER.md
$ grep -cE '\| *OK *\|[[:space:]]*$' 94-DEPLOY-LEDGER.md
1
$ grep -v '^| synthetic-' … # both synthetic rows removed
$ grep -cE '\| *OK *\|[[:space:]]*$' 94-DEPLOY-LEDGER.md
0
```

Both directions observed: the counter **counts** a verdict-last row and **does not
count** a row whose verdict cell is not last. Both synthetic rows were then removed;
the count returned to `0` before the real deploy round began. The clause is therefore
known to be able to go up AND to stay put, rather than merely having returned a number
once.

## Deploy rows

<!-- prettier-ignore -->
| function | deployed at (UTC) | result |
| --- | --- | --- |
| activate-account | 2026-08-16T15:37:59Z | OK |
| approve-role-change | 2026-08-16T15:38:08Z | OK |
| assign-role | 2026-08-16T15:38:14Z | OK |
| assignments-manual-override | 2026-08-16T15:38:18Z | OK |
| attachments-delete | 2026-08-16T15:38:23Z | OK |
| auth-biometric-setup | 2026-08-16T15:38:30Z | OK |
| auth-refresh-token | 2026-08-16T15:38:37Z | OK |
| auth-step-up-complete | 2026-08-16T15:38:47Z | OK |
| auth-step-up-initiate | 2026-08-16T15:38:52Z | OK |
| certify-user-access | 2026-08-16T15:38:58Z | OK |
| commitments-update-status | 2026-08-16T15:39:02Z | OK |
| complete-access-review | 2026-08-16T15:39:07Z | OK |
| create-user | 2026-08-16T15:39:14Z | OK |
| deactivate-user | 2026-08-16T15:39:19Z | OK |
| engagements-positions-attach | 2026-08-16T15:39:28Z | OK |
| engagements-positions-detach | 2026-08-16T15:39:35Z | OK |
| generate-access-review | 2026-08-16T15:39:42Z | OK |
| inactive-users | 2026-08-16T15:39:50Z | OK |
| initiate-password-reset | 2026-08-16T15:39:55Z | OK |
| notifications-register-device | 2026-08-16T15:40:02Z | OK |
| positions-unpublish | 2026-08-16T15:40:14Z | OK |
| push-device-register | 2026-08-16T15:40:22Z | OK |
| reactivate-user | 2026-08-16T15:40:30Z | OK |
| reset-password | 2026-08-16T15:40:35Z | OK |
| schedule-access-review | 2026-08-16T15:40:40Z | OK |
| setup-mfa | 2026-08-16T15:40:46Z | OK |
| verify-mfa-setup | 2026-08-16T15:40:51Z | OK |

## Deployed-artifact evidence — `scripts/probe-edge-auth.sh` over all 27

Run after the deploy round. The probe mints a real `TEST_USER` JWT and calls each
DEPLOYED function, printing one `<fn> -> <http-status>` line. **The verdict rule is
"does the deployed artifact answer": any status other than `000` (connection failure)
or `404` (route absent) proves the function is live.** It is a GET with no body against
handlers that mostly demand POST/PATCH, so `405` is the expected healthy answer.

```
$ scripts/probe-edge-auth.sh activate-account approve-role-change assign-role \
    assignments-manual-override attachments-delete auth-biometric-setup auth-refresh-token \
    auth-step-up-complete auth-step-up-initiate certify-user-access commitments-update-status \
    complete-access-review create-user deactivate-user engagements-positions-attach \
    engagements-positions-detach generate-access-review inactive-users initiate-password-reset \
    notifications-register-device positions-unpublish push-device-register reactivate-user \
    reset-password schedule-access-review setup-mfa verify-mfa-setup
activate-account -> 405
approve-role-change -> 405
assign-role -> 405
assignments-manual-override -> 404
attachments-delete -> 405
auth-biometric-setup -> 500
auth-refresh-token -> 500
auth-step-up-complete -> 405
auth-step-up-initiate -> 405
certify-user-access -> 405
commitments-update-status -> 405
complete-access-review -> 405
create-user -> 500
deactivate-user -> 500
engagements-positions-attach -> 400
engagements-positions-detach -> 400
generate-access-review -> 405
inactive-users -> 200
initiate-password-reset -> 405
notifications-register-device -> 500
positions-unpublish -> 405
push-device-register -> 405
reactivate-user -> 500
reset-password -> 405
schedule-access-review -> 405
setup-mfa -> 503
verify-mfa-setup -> 500
```

27 lines, `000` count **0**, `404` count **1**.

**The one 404 is NOT a missing deployment, and it was checked rather than assumed.**
`assignments-manual-override` returns its own `{"error":"User profile not found"}` with
status 404 at `index.ts:81-85` when the caller has no `staff_profiles` row; the TEST_USER
has none. Independently confirmed against the platform's own function list: it is
`status=ACTIVE`, `version=12`, `updated=2026-08-16T15:38:17Z` — matching this ledger's
deploy row for it to the second. All 27 are ACTIVE with versions bumped by this round.

## The AUDIT-ZERO-01 transition, and who actually made it

`public.audit_logs` was measured at **0 rows** at the start of this leg. It is now
non-zero. Stated precisely, because the obvious reading is wrong:

- **The first row in the table's history was NOT written by the probe script.** It was
  written by the deployed, repaired **`inactive-users`** at `2026-08-16T15:42:15Z`,
  during the `probe-edge-auth.sh` run above — that `-> 200` is a real admin query, and
  the repaired function audited it. Row `a020361b-…e64d`:
  `entity_type=user, action=inactive_users_query, user_role=admin`.
- `scripts/probe-audit-row.mjs` then independently demonstrated the delta through a
  different repaired function (`commitments-update-status`, JWT-scoped, so the RLS
  `user_id = auth.uid()` arm is exercised): count **1 → 2**, row `290709a2-…e2fe`.

**That first row also settles the `ip_address` question with a measurement rather than
an argument.** Its recorded header value is
`"176.45.184.246,176.45.184.246, 13.248.105.84"` — a comma-joined `X-Forwarded-For`
list. `SELECT '203.0.113.7, 70.41.3.18'::inet` fails `22P02` on this database (checked
live). Had that value been passed to the typed `inet` column as the pre-repair code did,
**this row would not have landed** and the table would still read 0. The raw header goes
to `new_values.ip_address` (jsonb) for exactly this reason.
