/* FOUC-safe bootstrap — Plans 33-03 + 34-05.
 * Sets first-paint tokens + lang/dir/classification from localStorage BEFORE any stylesheet parses.
 * Palette literals MUST byte-match frontend/src/design-system/tokens/directions.ts (PALETTES).
 * Keys: id.dir / id.theme / id.hue / id.density / id.classif / id.locale (with legacy i18nextLng migration).
 * ES5-safe — no arrows, const/let, template literals, optional chaining.
 */
(function () {
  try {
    var d = localStorage.getItem('id.dir') || 'bureau';
    var m = localStorage.getItem('id.theme') || 'light';
    var h = parseInt(localStorage.getItem('id.hue') || '32', 10);
    if (isNaN(h)) h = 32;
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
    var P = {
      chancery: {
        light:{bg:'#f7f3ec',surface:'#fdfaf3',surfaceRaised:'#ffffff',ink:'#1a1814',inkMute:'#5a5246',inkFaint:'#8f8575',line:'#e6ddc9',lineSoft:'#efe8d6',sidebar:'#ece5d2',sidebarInk:'#1a1814',rSm:'2px',r:'2px',rLg:'2px'},
        dark:{bg:'#14120f',surface:'#1c1a16',surfaceRaised:'#23201b',ink:'#f3ede1',inkMute:'#c9c0ae',inkFaint:'#8a8377',line:'#2f2b24',lineSoft:'#242019',sidebar:'#100e0b',sidebarInk:'#ddd4c2',rSm:'2px',r:'2px',rLg:'2px'}
      },
      situation: {
        light:{bg:'#f4f6f9',surface:'#ffffff',surfaceRaised:'#ffffff',ink:'#0b1220',inkMute:'#425066',inkFaint:'#7a8699',line:'#dde3ec',lineSoft:'#eaeef4',sidebar:'#0b1220',sidebarInk:'#d6deeb',rSm:'2px',r:'3px',rLg:'4px'},
        dark:{bg:'#07090c',surface:'#0e1218',surfaceRaised:'#141a22',ink:'#e6edf5',inkMute:'#8a96a8',inkFaint:'#566274',line:'#1e2733',lineSoft:'#141c26',sidebar:'#05070a',sidebarInk:'#c9d4e2',rSm:'2px',r:'3px',rLg:'4px'}
      },
      ministerial: {
        light:{bg:'#f5f7f4',surface:'#ffffff',surfaceRaised:'#ffffff',ink:'#0d1a14',inkMute:'#4a5a52',inkFaint:'#7a8a82',line:'#e1e8e1',lineSoft:'#ecf1ec',sidebar:'#0f2a22',sidebarInk:'#e6ede8',rSm:'6px',r:'10px',rLg:'14px'},
        dark:{bg:'#0b1310',surface:'#111915',surfaceRaised:'#16211c',ink:'#e9efeb',inkMute:'#9fb0a6',inkFaint:'#6b7d73',line:'#1d2a24',lineSoft:'#162019',sidebar:'#081110',sidebarInk:'#c8d6cd',rSm:'6px',r:'10px',rLg:'14px'}
      },
      bureau: {
        light:{bg:'#f7f6f4',surface:'#ffffff',surfaceRaised:'#ffffff',ink:'#1a1714',inkMute:'#6b6459',inkFaint:'#9a9082',line:'#e8e4dc',lineSoft:'#efece3',sidebar:'#ffffff',sidebarInk:'#2a2520',rSm:'8px',r:'12px',rLg:'16px'},
        dark:{bg:'#161310',surface:'#1d1915',surfaceRaised:'#24201b',ink:'#f2ece3',inkMute:'#b8ac9c',inkFaint:'#857c6e',line:'#2a2520',lineSoft:'#201c18',sidebar:'#100d0a',sidebarInk:'#ddd3c4',rSm:'8px',r:'12px',rLg:'16px'}
      }
    };
    /* Per-direction font triplets — MUST byte-match
       frontend/src/design-system/tokens/directions.ts (FONTS). Without this
       the first paint uses browser-default serif until DesignProvider mounts. */
    var F = {
      chancery:    {display:"'Fraunces', serif",                      body:"'Inter', system-ui, sans-serif",       mono:"'JetBrains Mono', ui-monospace, monospace"},
      situation:   {display:"'Space Grotesk', system-ui, sans-serif", body:"'IBM Plex Sans', system-ui, sans-serif", mono:"'IBM Plex Mono', ui-monospace, monospace"},
      ministerial: {display:"'Public Sans', system-ui, sans-serif",   body:"'Public Sans', system-ui, sans-serif",  mono:"'JetBrains Mono', ui-monospace, monospace"},
      bureau:      {display:"'Inter', system-ui, sans-serif",         body:"'Inter', system-ui, sans-serif",        mono:"'JetBrains Mono', ui-monospace, monospace"}
    };
    var r = document.documentElement;
    r.classList.toggle('dark', m === 'dark');
    r.setAttribute('data-direction', d);
    r.setAttribute('data-density', dn);
    /* Handoff CSS uses .dir-{direction} class selectors. Apply pre-paint so
       FOUC-window styles match. ES5-safe — no template literals. */
    r.classList.remove('dir-chancery', 'dir-situation', 'dir-ministerial', 'dir-bureau');
    r.classList.add('dir-' + d);
    var p = (P[d] && P[d][m]) || P.bureau.light;
    var f = F[d] || F.bureau;
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
    r.style.setProperty('--accent', 'oklch(58% 0.14 ' + h + ')');
    r.style.setProperty('--accent-fg', 'oklch(99% 0.01 ' + h + ')');
    r.style.setProperty('--accent-ink', (m === 'dark' ? 'oklch(72% 0.12 ' : 'oklch(42% 0.15 ') + h + ')');
    r.style.setProperty('--accent-soft', (m === 'dark' ? 'oklch(25% 0.08 ' : 'oklch(92% 0.05 ') + h + ')');
    r.style.setProperty('--danger', m === 'dark' ? 'oklch(70% 0.16 25)' : 'oklch(52% 0.18 25)');
    r.style.setProperty('--danger-soft', m === 'dark' ? 'oklch(25% 0.09 25)' : 'oklch(95% 0.04 25)');
    r.style.setProperty('--warn', m === 'dark' ? 'oklch(78% 0.14 75)' : 'oklch(51% 0.14 75)');
    r.style.setProperty('--warn-soft', m === 'dark' ? 'oklch(25% 0.08 75)' : 'oklch(95% 0.05 75)');
    r.style.setProperty('--ok', m === 'dark' ? 'oklch(72% 0.14 155)' : 'oklch(49% 0.12 155)');
    r.style.setProperty('--ok-soft', m === 'dark' ? 'oklch(22% 0.06 155)' : 'oklch(94% 0.04 155)');
    r.style.setProperty('--info', m === 'dark' ? 'oklch(72% 0.13 230)' : 'oklch(48% 0.14 230)');
    r.style.setProperty('--info-soft', m === 'dark' ? 'oklch(22% 0.07 230)' : 'oklch(94% 0.04 230)');
    r.style.setProperty('--radius-sm', p.rSm);
    r.style.setProperty('--radius', p.r);
    r.style.setProperty('--radius-lg', p.rLg);
    r.style.setProperty('--shadow-sm', '0 1px 2px rgba(20, 18, 15, 0.04)');
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
