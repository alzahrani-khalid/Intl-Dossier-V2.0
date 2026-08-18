#!/usr/bin/env python3
"""
THE INSTRUMENT OF RECORD for the dynamic-prefix raw-value MASK CLASS.

Part A, widened instrument (RULING-P98A2-09: population by BEHAVIOUR, not token).

The stated Part A regex finds `{x.status}` — raw renders in JSX child position.
It is blind to the SECOND way a DB value reaches the screen: a dynamic t() call
whose key PATH does not exist in the bundle, where a raw-value defaultValue then
renders the DB value verbatim. 98-RESEARCH's own exclusion carves these back IN:
"values already inside t() with the value as defaultValue ... are the P99 mask
class, not this criterion -- UNLESS THE KEY IS MISSING".

This resolves each dynamic key prefix against the real en bundle and reports the
ones that cannot resolve.

PROVENANCE
  Authored by the Phase 98 `98-05` execution seat while deriving criterion 1's
  Part A population. Made THE INSTRUMENT OF RECORD for this class by
  RULING-P98A2-12 condition 2, which also established WHY it has to exist:
  BOTH of Phase 99's committed AR-04a/AR-04b acceptance greps are blind to
  variable-second-arg dynamic-prefix sites BY CONSTRUCTION (proven by direct
  test in that ruling). Phase 99 CONSUMES this instrument; it does not replace
  it with a grep. Committed to `scripts/` by RULING-P98A2-15 (98-09), because
  until then it existed only in a gitignored preservation directory and reached
  no clone.

USAGE
  python3 scripts/partA_maskfinder.py <repo-root>              # the derivation
  python3 scripts/partA_maskfinder.py <repo-root> --control    # both polarities

  The repo root is a REQUIRED ARGUMENT — this script is cwd-independent and
  hardcodes no absolute path.

  At `13d5094ea` and re-derived at `8697f65de` it reports
  `24 total (19 mask a raw value; 5 render a raw key)`. That figure is an
  OBSERVATION OF A TREE, not a constant: re-derive, never re-quote (D-04).
  `--control` must print True / True / False / False, in that order. A run whose
  controls do not discriminate has proved nothing about its count.

NEGATIVE SCOPE — what this instrument CANNOT see, and what covers it
  1. STATIC keys. Only DYNAMIC prefixes (`t(`p.${x}`)` / `t('p.' + x)`) are
     matched. A plain `t('a.b.c')` that misses is the raw-KEY class — covered by
     `scripts/i18n-mask-audit.mjs` and the `98-copy02` DOM detector.
  2. ANY TREE OUTSIDE `frontend/src`. Edge functions, the backend and `tests/`
     are never walked (RULING-P98A2-16's search-space finding). NOTHING
     automated covers copy in those trees; `EDGECOPY-01` (P102) is the queue
     entry, and its closure requires repair + DEPLOY + artifact verification.
  3. THE `ar` BUNDLE. Only `frontend/src/i18n/en` is loaded, so an EN-resolving
     prefix absent from `ar` is not reported here. Covered by
     `scripts/resolve-check.mjs`, which runs both locales with `fallbackLng`
     DISABLED on `ar`.
  4. REACHABILITY. Dead code is scanned exactly like live code — a hit in a
     component with zero importers is still reported. Covered by an importer
     census plus the rendered `98-copy0N` oracles, and by nothing else.
  5. NAMESPACE BINDING BEYOND THE THREE SHAPES IT PARSES. `useTranslation()`,
     `useTranslation('ns')`, `useTranslation(['a','b'])` and `TFunction<'ns'>`
     are understood; a `t` passed down through any other prop shape is resolved
     against the file's own hooks and can misattribute. Covered by nothing
     automated — read the site before acting on a row.
  6. WHETHER A REPORTED SITE ACTUALLY RENDERS THE MASK. It reports that the key
     prefix does not resolve and that a second argument is present; the rendered
     proof is a driven surface's job.
"""
import json
import os
import re
import sys

REPO = sys.argv[1]
SRC = os.path.join(REPO, 'frontend/src')
I18N_EN = os.path.join(SRC, 'i18n/en')

# t(`prefix.${expr}` ...)   |   t('prefix.' + expr ...)
TPL = re.compile(r"\bt\(\s*`([^`$]*?)\.\$\{")
CAT = re.compile(r"\bt\(\s*'([^']*?)\.'\s*\+")
# does the call carry a raw-value defaultValue? (2nd positional arg, or defaultValue:)
HAS_DEFAULT = re.compile(r"\bt\(\s*(?:`[^`]*`|'[^']*'(?:\s*\+\s*[^,()]+)?)\s*,")

NS_HOOK = re.compile(r"useTranslation\(\s*(\[[^\]]*\]|'[^']*'|\"[^\"]*\")?\s*\)")


def load_bundles():
    b = {}
    for fn in os.listdir(I18N_EN):
        if fn.endswith('.json'):
            with open(os.path.join(I18N_EN, fn), encoding='utf-8') as f:
                b[fn[:-5]] = json.load(f)
    return b


def file_namespaces(text):
    """Namespaces this file's `t` is bound to, in lookup order."""
    out = []
    for m in NS_HOOK.finditer(text):
        raw = m.group(1)
        if raw is None:
            out.append('common')  # defaultNS
        elif raw.startswith('['):
            out += re.findall(r"['\"]([^'\"]+)['\"]", raw)
        else:
            out.append(raw.strip('\'"'))
    # a `t` arriving as a PROP: TFunction<'ns'>
    out += re.findall(r"TFunction<'([^']+)'>", text)
    return out or ['common']


def resolves(bundles, ns, path):
    node = bundles.get(ns)
    if node is None:
        return False
    for seg in path.split('.'):
        if not isinstance(node, dict) or seg not in node:
            return False
        node = node[seg]
    return isinstance(node, dict)  # a dynamic prefix must land on an OBJECT


def scan(bundles):
    hits = []
    for root, _dirs, files in os.walk(SRC):
        if '__tests__' in root or '/i18n/' in root or '.understand-anything' in root:
            continue
        for fn in files:
            if not fn.endswith(('.tsx', '.ts')) or '.test.' in fn:
                continue
            p = os.path.join(root, fn)
            with open(p, encoding='utf-8') as f:
                text = f.read()
            nss = file_namespaces(text)
            for lineno, line in enumerate(text.splitlines(), 1):
                for rx in (TPL, CAT):
                    for m in rx.finditer(line):
                        key = m.group(1)
                        if ':' in key:
                            ns, path = key.split(':', 1)
                            cands = [ns]
                        else:
                            path, cands = key, nss
                        if any(resolves(bundles, ns, path) for ns in cands):
                            continue
                        hits.append({
                            'file': os.path.relpath(p, REPO),
                            'line': lineno,
                            'prefix': key,
                            'ns_candidates': cands,
                            'masked': bool(HAS_DEFAULT.search(line)),
                            'text': line.strip()[:150],
                        })
    return hits


if __name__ == '__main__':
    bundles = load_bundles()

    if '--control' in sys.argv:
        # Both polarities on a known-present pair, proving the resolver discriminates.
        print('CONTROL resolves(intelligence-signals, "severity") =',
              resolves(bundles, 'intelligence-signals', 'severity'), '(expect True)')
        print('CONTROL resolves(common, "waitingQueue.statuses")  =',
              resolves(bundles, 'common', 'waitingQueue.statuses'), '(expect True)')
        print('CONTROL resolves(common, "waitingQueue.status")    =',
              resolves(bundles, 'common', 'waitingQueue.status'), '(expect False)')
        print('CONTROL resolves(common, "waitingQueue.priority")  =',
              resolves(bundles, 'common', 'waitingQueue.priority'), '(expect False)')
        sys.exit(0)

    hits = scan(bundles)
    masked = [h for h in hits if h['masked']]
    bare = [h for h in hits if not h['masked']]
    print('UNRESOLVED dynamic t() key prefixes: %d total  '
          '(%d mask a raw value -> criterion 1; %d render a RAW KEY -> criterion 2)'
          % (len(hits), len(masked), len(bare)))
    for tag, group in (('MASKED-RAW-VALUE', masked), ('RAW-KEY', bare)):
        for h in sorted(group, key=lambda x: (x['file'], x['line'])):
            print('%-17s %s:%d  prefix=%r ns=%s' %
                  (tag, h['file'], h['line'], h['prefix'], '|'.join(h['ns_candidates'])))
