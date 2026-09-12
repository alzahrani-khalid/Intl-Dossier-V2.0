# ATTESTATION — P100-09 leaked-password protection (staging zkrcjzdemdmwhearhfgg)

**Who enabled the setting:** Khalid Alzahrani (operator), in the Supabase dashboard
(Authentication → Sign In / Providers → Email → "Prevent use of leaked passwords"), saved on the second
attempt after the first save did not take effect.

**When it became effective:** between 2026-09-10T13:57:5xZ (last overseer probe that was accepted, http 200)
and **2026-09-10T13:58:52Z** (first overseer probe rejected: http 422 `weak_password` reasons=["pwned"]).
Overseer probes used `p100-09-overseer-probe-<ts>@example.invalid`; the two accepted probe accounts were
deleted from auth.users immediately; the rejected probe created none. Recorded in
`OVERSEER-RULING-P100-09-HUMAN-GATE.md`; dispatch approval `task-approved` 13:58:58Z.

**Operator's answer on the D-31 bound (asked and answered 2026-09-10 ~18:0x local):**
**D-31 is CLOSED.** The breach-specific discriminator is now observable: `reasons=["pwned"]` is the
leaked-password rule's own reason string, distinct from `length` and from any other `weak_password`
rule. Criterion 5's Auth half is recorded as closed on the observed `pwned` reason plus this attestation.
No residual bound is carried into the phase completion text for the Auth half.

**The worker's duty:** quote this file verbatim in `100-09-SUMMARY.md`; do not restate it.
ATTESTATION-END
