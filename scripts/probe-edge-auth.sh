#!/usr/bin/env bash
#
# Phase 92 / AUTH-02 — deployed-artifact edge-function auth probe (RESEARCH Pattern 3).
#
# Mints a real user JWT from .env.test credentials and calls each named edge function
# on DEPLOYED staging, printing one "<fn> -> <http-status>" line per function.
#
# D-21: the probe targets deployed artifacts, never repo source — Supabase bundles
# dependencies at deploy time, so a caret-pinned function's auth client floats on
# every deploy and source grep cannot see it.
#
# D-16 verdict rule (401 = auth rejected; any other status = the request passed the
# getUser gate) is stated in 92-PROBE-BASELINE.md ABOVE the recorded data.
#
# P95 / DEAD-02: a bare "<fn> -> 404" cannot distinguish a NOT-DEPLOYED function
# (gateway 404) from a DEPLOYED function answering 404 itself — an ambiguity that
# let "assignments-queue is not deployed" survive research while the platform had
# it ACTIVE at version 11. On a 404 the probe now prints ONE extra indented line
#   "    404-kind: gateway|function  body: <first 160 bytes>"
# classified from the body. The "<fn> -> <status>" line format is UNCHANGED (every
# consumer greps "-> [0-9]{3}" on it); the kind line is purely additive.
#
# HOUSE RULE: this script never echoes the JWT, the password, or any env value.
# Credentials are passed to curl over stdin (not argv) so they do not appear in `ps`.
#
# Usage: scripts/probe-edge-auth.sh [fn-name ...]
set -euo pipefail

cd "$(dirname "$0")/.."

if [ ! -f .env.test ]; then
  echo "FATAL: .env.test not found in $(pwd)" >&2
  exit 1
fi

set -a
# shellcheck disable=SC1091
. ./.env.test
set +a

for v in SUPABASE_URL SUPABASE_ANON_KEY TEST_USER_EMAIL TEST_USER_PASSWORD; do
  if [ -z "$(eval "printf '%s' \"\${$v:-}\"")" ]; then
    echo "FATAL: $v is unset or empty in .env.test" >&2
    exit 1
  fi
done

JWT=$(
  python3 -c 'import json,os;print(json.dumps({"email":os.environ["TEST_USER_EMAIL"],"password":os.environ["TEST_USER_PASSWORD"]}))' |
    curl -s -X POST "$SUPABASE_URL/auth/v1/token?grant_type=password" \
      -H "apikey: $SUPABASE_ANON_KEY" \
      -H "Content-Type: application/json" \
      --data-binary @- |
    python3 -c 'import json,sys
try:
    print(json.load(sys.stdin).get("access_token", ""))
except Exception:
    print("")'
)

if [ -z "$JWT" ]; then
  # Deliberately does not print the response body — it is an auth response.
  echo "FATAL: token mint failed against $SUPABASE_URL (no access_token returned)" >&2
  exit 1
fi

if [ "$#" -gt 0 ]; then
  FNS=("$@")
else
  # One deployed representative per set:
  #   A∩B pinned + bare getUser()  : audit-logs-viewer data-retention field-permissions my-delegations
  #   A\B pinned + getUser(token)  : dossiers-update
  #   B\A @2 + bare getUser()      : tasks-get
  FNS=(audit-logs-viewer data-retention field-permissions my-delegations dossiers-update tasks-get)
fi

# Classifies a 404 response body. The platform's not-deployed 404 names the
# function-routing miss ("Requested function was not found"); a house error
# envelope is the function's own 404. Anything else is NOT classified silently.
classify_404() {
  case "$1" in
    *'Requested function was not found'*) printf 'gateway' ;;
    *'"error"'* | *'"message_en"'* | *'"message"'*) printf 'function' ;;
    *) printf 'unknown' ;;
  esac
}

BODY_FILE=$(mktemp)
trap 'rm -f "$BODY_FILE"' EXIT

for fn in "${FNS[@]}"; do
  # curl prints 000 and exits non-zero on a connection failure; record it rather than abort.
  status=$(curl -s -o "$BODY_FILE" -w '%{http_code}' "$SUPABASE_URL/functions/v1/$fn" \
    -H "Authorization: Bearer $JWT" \
    -H "apikey: $SUPABASE_ANON_KEY" || printf '000')
  printf '%s -> %s\n' "$fn" "$status"
  if [ "$status" = "404" ]; then
    body=$(head -c 160 "$BODY_FILE" | tr -d '\r\n')
    printf '    404-kind: %s  body: %s\n' "$(classify_404 "$body")" "$body"
  fi
done
