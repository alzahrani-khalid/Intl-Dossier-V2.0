/* FOUC-safe bootstrap — Plans 33-03 + 34-05 + 77-04 (Linear activation).
 * Sets first-paint tokens + lang/dir/classification from localStorage BEFORE any stylesheet parses.
 * Palette literals MUST byte-match frontend/src/design-system/tokens/directions.ts (PALETTES.linear).
 * Keys: id.dir / id.theme / id.density / id.classif / id.locale (with legacy i18nextLng migration).
 * TOKEN-04 (load-bearing migration): every existing user holds a retired id.dir
 *   (bureau/chancery/situation/ministerial); the old per-direction fallback vanished
 *   with the Linear swap, so id.dir is COERCED to 'linear' here (with a try-guarded
 *   one-time write-back) AND in DesignProvider — first paint would otherwise lose ALL
 *   tokens. Default id.theme = 'dark' (Linear-canonical, USER DECISION); an explicitly
 *   persisted id.theme='light' is preserved. The legacy hue key is no longer read
 *   (accent is a verbatim Linear literal, not hue-parameterized).
 * ES5-safe — no arrows, const/let, template literals, optional chaining.
 */
(function () {
  try {
    /* TOKEN-04 coercion: any legacy/absent id.dir → 'linear', with a one-time
       write-back so raw id.dir readers (tests, future features) see 'linear' and
       the coercion does not re-run forever. Write is try-guarded (read-only storage). */
    var d = localStorage.getItem('id.dir');
    if (d !== 'linear') {
      d = 'linear';
      try { localStorage.setItem('id.dir', 'linear'); } catch (eDir) { /* read-only storage */ }
    }
    /* Default dark (Linear-canonical). Explicit 'light' preserved; anything else → dark. */
    var m = localStorage.getItem('id.theme') || 'dark';
    if (m !== 'light' && m !== 'dark') m = 'dark';
    var dn = localStorage.getItem('id.density') || 'comfortable';
    if (dn !== 'comfortable' && dn !== 'compact' && dn !== 'dense') dn = 'comfortable';
    /* Density triplet — MUST byte-match frontend/src/design-system/tokens/densities.ts.
       Without this, first paint reads var(--pad)/var(--gap)/var(--row-h) as nothing
       and `.page-head`, `.page`, `.kpi` etc. render with zero padding. */
    var D = {
      comfortable: {pad:'20px', gap:'16px', rowH:'52px', padBlock:'16px'},
      compact:     {pad:'14px', gap:'12px', rowH:'40px', padBlock:'12px'},
      dense:       {pad:'10px', gap:'8px',  rowH:'32px', padBlock:'8px'}
    };
    /* Linear palette — the sole direction. Core keys + nested extended groups
       (surface3/4, inkTertiary, lineStrong, accent, semantic, sla, status) MUST
       byte-match tokens/directions.ts PALETTES.linear. Enforced by
       scripts/check-bootstrap-parity.mjs (guard v2). */
    var P = {
      linear: {
        light:{bg:'#ffffff',surface:'#f5f6f6',surfaceRaised:'#f6f7f7',ink:'#000000',inkMute:'#4f5359',inkFaint:'#656970',line:'#dddee1',lineSoft:'#eaebed',sidebar:'#f5f6f6',sidebarInk:'#14161a',rSm:'6px',r:'8px',rLg:'12px',surface3:'#eff0f2',surface4:'#e6e8eb',inkTertiary:'#83868e',lineStrong:'#ccced1',accent:{base:'#5e6ad2',hover:'#828fff',fg:'#ffffff',soft:'#e8edff',ink:'#4d57b7'},semantic:{danger:'#be241f',dangerSoft:'#ffeae6',warn:'#8c5500',warnSoft:'#fceed6',ok:'#137738',okSoft:'#e4f6e6',info:'#1664bf',infoSoft:'#e4f1ff'},sla:{ok:'#4d57b7',okSoft:'#eaefff',risk:'#8c5500',riskSoft:'#fceed6',bad:'#be241f',badSoft:'#ffeae6'},status:[{fg:'#3458ac',soft:'#e6f1ff'},{fg:'#00737c',soft:'#daf7f8'},{fg:'#007338',soft:'#e1f7e7'},{fg:'#7c5700',soft:'#f8f0da'},{fg:'#9d381f',soft:'#ffeae3'},{fg:'#873a82',soft:'#fce9fa'}]},
        dark:{bg:'#010102',surface:'#0f1011',surfaceRaised:'#141516',ink:'#f7f8f8',inkMute:'#d0d6e0',inkFaint:'#8a8f98',line:'#23252a',lineSoft:'#1d1e21',sidebar:'#0f1011',sidebarInk:'#d0d6e0',rSm:'6px',r:'8px',rLg:'12px',surface3:'#18191a',surface4:'#191a1b',inkTertiary:'#62666d',lineStrong:'#34343a',accent:{base:'#5e6ad2',hover:'#828fff',fg:'#ffffff',soft:'#5e69d1',ink:'#98a6ea'},semantic:{danger:'#e86154',dangerSoft:'#3c1713',warn:'#e1af4a',warnSoft:'#302103',ok:'#27a644',okSoft:'#102b17',info:'#66a0ee',infoSoft:'#0f2440'},sla:{ok:'#8998e9',okSoft:'#1c2141',risk:'#e1af4a',riskSoft:'#302103',bad:'#e86154',badSoft:'#3c1713'},status:[{fg:'#87adfa',soft:'#16233f'},{fg:'#2ac4cc',soft:'#002c2e'},{fg:'#6ac48c',soft:'#082c18'},{fg:'#cbaa4b',soft:'#2e2200'},{fg:'#ef9179',soft:'#3a1911'},{fg:'#d991d2',soft:'#331931'}]}
      }
    };
    /* Linear font triplet — REGISTERED @fontsource-variable family names (plain
       'Inter'/'JetBrains Mono' are NOT the variable-font families → silent
       system-ui fallback). MUST byte-match tokens/directions.ts FONTS.linear. */
    var F = {
      linear: {display:"'Inter Variable', system-ui, sans-serif", body:"'Inter Variable', system-ui, sans-serif", mono:"'JetBrains Mono Variable', ui-monospace, monospace"}
    };
    var r = document.documentElement;
    r.classList.toggle('dark', m === 'dark');
    r.setAttribute('data-direction', d);
    r.setAttribute('data-density', dn);
    /* Handoff CSS uses .dir-linear class selectors. Apply pre-paint so the
       FOUC-window styles match. ES5-safe — no template literals. */
    r.classList.add('dir-' + d);
    var p = (P.linear && P.linear[m]) || P.linear.dark;
    var f = F.linear;
    r.style.setProperty('--bg', p.bg);
    r.style.setProperty('--surface', p.surface);
    r.style.setProperty('--surface-raised', p.surfaceRaised);
    r.style.setProperty('--ink', p.ink);
    r.style.setProperty('--ink-mute', p.inkMute);
    r.style.setProperty('--ink-faint', p.inkFaint);
    r.style.setProperty('--line', p.line);
    r.style.setProperty('--line-soft', p.lineSoft);
    r.style.setProperty('--sidebar-bg', p.sidebar);
    r.style.setProperty('--sidebar-ink', p.sidebarInk);
    /* Linear extended tiers */
    r.style.setProperty('--surface-3', p.surface3);
    r.style.setProperty('--surface-4', p.surface4);
    r.style.setProperty('--ink-tertiary', p.inkTertiary);
    r.style.setProperty('--line-strong', p.lineStrong);
    /* Accent family — verbatim Linear literals (hue-independent) */
    r.style.setProperty('--accent', p.accent.base);
    r.style.setProperty('--accent-hover', p.accent.hover);
    r.style.setProperty('--accent-fg', p.accent.fg);
    r.style.setProperty('--accent-ink', p.accent.ink);
    r.style.setProperty('--accent-soft', p.accent.soft);
    /* Semantic family (TOKEN-03 derived + verbatim) */
    r.style.setProperty('--danger', p.semantic.danger);
    r.style.setProperty('--danger-soft', p.semantic.dangerSoft);
    r.style.setProperty('--warn', p.semantic.warn);
    r.style.setProperty('--warn-soft', p.semantic.warnSoft);
    r.style.setProperty('--ok', p.semantic.ok);
    r.style.setProperty('--ok-soft', p.semantic.okSoft);
    r.style.setProperty('--info', p.semantic.info);
    r.style.setProperty('--info-soft', p.semantic.infoSoft);
    /* SLA family (derived in the Linear accent band) */
    r.style.setProperty('--sla-ok', p.sla.ok);
    r.style.setProperty('--sla-ok-soft', p.sla.okSoft);
    r.style.setProperty('--sla-risk', p.sla.risk);
    r.style.setProperty('--sla-risk-soft', p.sla.riskSoft);
    r.style.setProperty('--sla-bad', p.sla.bad);
    r.style.setProperty('--sla-bad-soft', p.sla.badSoft);
    /* 6-value status-tag palette → --status-1..6 + --status-1-soft..6-soft */
    for (var si = 0; si < p.status.length; si++) {
      r.style.setProperty('--status-' + (si + 1), p.status[si].fg);
      r.style.setProperty('--status-' + (si + 1) + '-soft', p.status[si].soft);
    }
    r.style.setProperty('--radius-sm', p.rSm);
    r.style.setProperty('--radius', p.r);
    r.style.setProperty('--radius-lg', p.rLg);
    /* Linear: no card shadows (--shadow-sm none); drawer + hovered-row shadows kept. */
    r.style.setProperty('--shadow-sm', 'none');
    r.style.setProperty('--shadow', '0 4px 12px rgba(20, 18, 15, 0.06)');
    r.style.setProperty('--shadow-lg', '-12px 0 40px rgba(20, 18, 15, 0.15)');
    r.style.setProperty('--font-display', f.display);
    r.style.setProperty('--font-body', f.body);
    r.style.setProperty('--font-mono', f.mono);
    var dv = D[dn] || D.comfortable;
    r.style.setProperty('--pad', dv.pad);
    r.style.setProperty('--pad-inline', dv.pad);
    r.style.setProperty('--pad-block', dv.padBlock);
    r.style.setProperty('--gap', dv.gap);
    r.style.setProperty('--row-h', dv.rowH);

    // Phase 34 D-12: one-time i18nextLng -> id.locale migrator.
    // Legacy key is ALWAYS removed on read; canonical is written only if unset AND legacy is valid.
    try {
      var legacy = localStorage.getItem('i18nextLng');
      if (legacy !== null) {
        if (!localStorage.getItem('id.locale') && (legacy === 'en' || legacy === 'ar')) {
          localStorage.setItem('id.locale', legacy);
        }
        localStorage.removeItem('i18nextLng');
      }
    } catch (eMig) { /* silent */ }

    // Phase 34 D-14: apply classif + locale pre-paint.
    var cf = localStorage.getItem('id.classif') === 'true';
    var lc = localStorage.getItem('id.locale') || 'en';
    if (lc !== 'en' && lc !== 'ar') lc = 'en';
    r.lang = lc;
    r.dir = lc === 'ar' ? 'rtl' : 'ltr';
    r.dataset.classification = cf ? 'show' : 'hide';
  } catch (e) { /* localStorage blocked — CSS :root defaults take over */ }
})();
