/* FOUC-safe bootstrap — Plans 33-03 + 34-05.
 * Sets first-paint tokens + lang/dir/classification from localStorage BEFORE any stylesheet parses.
 * Palette literals MUST byte-match frontend/src/design-system/tokens/directions.ts (PALETTES).
 * Keys: id.dir / id.theme / id.hue / id.density / id.classif / id.locale (with legacy i18nextLng migration).
 * ES5-safe — no arrows, const/let, template literals, optional chaining.
 */
(function () {
  try {
    var d = localStorage.getItem('id.dir') || 'chancery';
    var m = localStorage.getItem('id.theme') || 'light';
    var h = parseInt(localStorage.getItem('id.hue') || '22', 10);
    if (isNaN(h)) h = 22;
    var dn = localStorage.getItem('id.density') || 'regular';
    var P = {
      chancery: {light:{bg:'#f7f3ec',surface:'#fdfaf3',surfaceRaised:'#ffffff',ink:'#1a1814',line:'#e6ddc9'},dark:{bg:'#14120f',surface:'#1c1a16',surfaceRaised:'#23201b',ink:'#f3ede1',line:'#2f2b24'}},
      situation: {light:{bg:'#f4f6f9',surface:'#ffffff',surfaceRaised:'#ffffff',ink:'#0b1220',line:'#dde3ec'},dark:{bg:'#07090c',surface:'#0e1218',surfaceRaised:'#141a22',ink:'#e6edf5',line:'#1e2733'}},
      ministerial:{light:{bg:'#f5f7f4',surface:'#ffffff',surfaceRaised:'#ffffff',ink:'#0d1a14',line:'#e1e8e1'},dark:{bg:'#0b1310',surface:'#111915',surfaceRaised:'#16211c',ink:'#e9efeb',line:'#1d2a24'}},
      bureau:     {light:{bg:'#f7f6f4',surface:'#ffffff',surfaceRaised:'#ffffff',ink:'#1a1714',line:'#e8e4dc'},dark:{bg:'#161310',surface:'#1d1915',surfaceRaised:'#24201b',ink:'#f2ece3',line:'#2a2520'}}
    };
    var r = document.documentElement;
    r.classList.toggle('dark', m === 'dark');
    r.setAttribute('data-direction', d);
    r.setAttribute('data-density', dn);
    var p = (P[d] && P[d][m]) || P.chancery.light;
    r.style.setProperty('--bg', p.bg);
    r.style.setProperty('--surface', p.surface);
    r.style.setProperty('--surface-raised', p.surfaceRaised);
    r.style.setProperty('--ink', p.ink);
    r.style.setProperty('--line', p.line);
    r.style.setProperty('--accent', 'oklch(58% 0.14 ' + h + ')');
    r.style.setProperty('--accent-fg', 'oklch(99% 0.01 ' + h + ')');

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
