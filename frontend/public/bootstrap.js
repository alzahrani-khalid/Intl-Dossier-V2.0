/* FOUC-safe bootstrap — Plan 33-03 (option-c: external blocking script).
 * Sets first-paint tokens from localStorage BEFORE any stylesheet parses.
 * Palette literals MUST byte-match frontend/src/design-system/tokens/directions.ts (PALETTES).
 * Keys match design-provider: id.dir / id.theme / id.hue / id.density.
 * ES5-safe — no arrows, const/let, or template literals (except trivial + concat).
 */
(function () {
  try {
    var dir = localStorage.getItem('id.dir') || 'chancery';
    var mode = localStorage.getItem('id.theme') || 'light';
    var hue = parseInt(localStorage.getItem('id.hue') || '22', 10);
    if (isNaN(hue)) hue = 22;
    var density = localStorage.getItem('id.density') || 'regular';
    var P = {
      chancery: {
        light: { bg: '#f7f3ec', surface: '#fdfaf3', surfaceRaised: '#ffffff', ink: '#1a1814', line: '#e6ddc9' },
        dark:  { bg: '#14120f', surface: '#1c1a16', surfaceRaised: '#23201b', ink: '#f3ede1', line: '#2f2b24' }
      },
      situation: {
        light: { bg: '#f4f6f9', surface: '#ffffff', surfaceRaised: '#ffffff', ink: '#0b1220', line: '#dde3ec' },
        dark:  { bg: '#07090c', surface: '#0e1218', surfaceRaised: '#141a22', ink: '#e6edf5', line: '#1e2733' }
      },
      ministerial: {
        light: { bg: '#f5f7f4', surface: '#ffffff', surfaceRaised: '#ffffff', ink: '#0d1a14', line: '#e1e8e1' },
        dark:  { bg: '#0b1310', surface: '#111915', surfaceRaised: '#16211c', ink: '#e9efeb', line: '#1d2a24' }
      },
      bureau: {
        light: { bg: '#f7f6f4', surface: '#ffffff', surfaceRaised: '#ffffff', ink: '#1a1714', line: '#e8e4dc' },
        dark:  { bg: '#161310', surface: '#1d1915', surfaceRaised: '#24201b', ink: '#f2ece3', line: '#2a2520' }
      }
    };
    var r = document.documentElement;
    r.classList.toggle('dark', mode === 'dark');
    r.setAttribute('data-direction', dir);
    r.setAttribute('data-density', density);
    var pal = (P[dir] && P[dir][mode]) || P.chancery.light;
    r.style.setProperty('--bg', pal.bg);
    r.style.setProperty('--surface', pal.surface);
    r.style.setProperty('--surface-raised', pal.surfaceRaised);
    r.style.setProperty('--ink', pal.ink);
    r.style.setProperty('--line', pal.line);
    r.style.setProperty('--accent', 'oklch(58% 0.14 ' + hue + ')');
    r.style.setProperty('--accent-fg', 'oklch(99% 0.01 ' + hue + ')');
  } catch (e) { /* localStorage blocked — CSS :root defaults take over */ }
})();
