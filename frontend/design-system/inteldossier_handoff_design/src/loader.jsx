// GlobeLoader — spinning orthographic globe with country outlines + whirl rings.
// Theme-aware: strokes/fills use var(--ink) so it inverts on dark surfaces.
//
// Usage:
//   <GlobeLoader size={120} />              // inline, just the globe
//   <FullscreenLoader open={isLoading} />   // full-screen overlay w/ backdrop

// Lazy-load d3 + topojson + world atlas the FIRST time a loader mounts,
// then cache the countries GeoJSON on window.
let _worldPromise = null;
function ensureWorld() {
  if (_worldPromise) return _worldPromise;
  _worldPromise = (async () => {
    // Load libs in parallel
    const loadScript = (src) => new Promise((res, rej) => {
      if (document.querySelector(`script[data-lib="${src}"]`)) return res();
      const s = document.createElement('script');
      s.src = src; s.dataset.lib = src;
      s.onload = res; s.onerror = rej;
      document.head.appendChild(s);
    });
    await Promise.all([
      loadScript('https://unpkg.com/d3@7.8.5/dist/d3.min.js'),
      loadScript('https://unpkg.com/topojson-client@3.1.0/dist/topojson-client.min.js'),
    ]);
    const world = await fetch('https://unpkg.com/world-atlas@2.0.2/countries-110m.json')
      .then(r => r.json());
    const countries = window.topojson.feature(world, world.objects.countries);
    const graticule = window.d3.geoGraticule10();
    return { countries, graticule, d3: window.d3 };
  })();
  return _worldPromise;
}

function GlobeLoader({ size = 120, speed = 16 }) {
  const hostRef = React.useRef(null);

  React.useEffect(() => {
    let raf = null, cancelled = false;
    (async () => {
      const { countries, graticule, d3 } = await ensureWorld();
      if (cancelled || !hostRef.current) return;

      const host = hostRef.current;
      host.innerHTML = '';
      const svg = d3.select(host).append('svg')
        .attr('viewBox', '-100 -100 200 200')
        .attr('width', '100%').attr('height', '100%');

      const projection = d3.geoOrthographic()
        .scale(96).translate([0, 0]).clipAngle(90);
      const path = d3.geoPath(projection);

      const sphere = svg.append('path').datum({ type: 'Sphere' }).attr('class', 'globe-sphere');
      const grat   = svg.append('path').datum(graticule).attr('class', 'globe-graticule');
      const land   = svg.append('g').attr('class', 'globe-land')
        .selectAll('path')
        .data(countries.features)
        .enter().append('path')
        .attr('class', 'globe-country');

      const start = performance.now();
      function tick(now) {
        if (cancelled) return;
        const t = (now - start) / 1000;
        const lambda = (t * speed) % 360 - 180;
        projection.rotate([lambda, -18]);
        sphere.attr('d', path);
        grat.attr('d', path);
        land.attr('d', path);
        raf = requestAnimationFrame(tick);
      }
      raf = requestAnimationFrame(tick);
    })();

    return () => {
      cancelled = true;
      if (raf) cancelAnimationFrame(raf);
    };
  }, [speed]);

  const outer = Math.round(size * 1.67);  // 200 at default 120
  const whirls = [
    { cls: 'r1', r: 88, dash: '3 7',  sw: 1.2, op: 0.38 },
    { cls: 'r2', r: 72, dash: '1 4',  sw: 0.8, op: 0.26 },
    { cls: 'r3', r: 58, dash: '14 6', sw: 0.7, op: 0.20 },
  ];

  return (
    <div className="globe-loader" style={{width: outer, height: outer}}>
      {whirls.map(w => (
        <div key={w.cls} className={`globe-whirl ${w.cls}`}>
          <svg viewBox="-100 -100 200 200">
            <circle className="globe-ring" r={w.r}
              strokeWidth={w.sw} strokeDasharray={w.dash}
              opacity={w.op} strokeLinecap="round"/>
          </svg>
        </div>
      ))}
      <div ref={hostRef} className="globe-host" style={{width: size, height: size}}/>
    </div>
  );
}

function FullscreenLoader({ open, label }) {
  if (!open) return null;
  return (
    <div className="globe-fullscreen" role="status" aria-live="polite">
      <div className="globe-fs-inner">
        <GlobeLoader size={120}/>
        {label && <div className="globe-fs-label">{label}</div>}
      </div>
    </div>
  );
}

// Small inline spinner — pure SVG/CSS, no d3 needed.
// At <48px country outlines aren't legible, so we use a stylized globe:
// circle + 2 ellipses (meridian + equator) + a single whirl arc.
// Sizes: 16, 20, 24, 32, 48.
function GlobeSpinner({ size = 20 }) {
  const s = size;
  return (
    <span className="globe-spinner" style={{width: s, height: s}}
          role="status" aria-label="Loading">
      <svg viewBox="0 0 40 40" width={s} height={s}>
        {/* whirl arc — outer, rotating */}
        <g className="gs-whirl">
          <circle cx="20" cy="20" r="18" fill="none"
            stroke="currentColor" strokeWidth="1.4"
            strokeLinecap="round"
            strokeDasharray="14 90"
            opacity="0.55"/>
        </g>
        {/* globe — inner, counter-rotating meridian */}
        <g className="gs-globe">
          <circle cx="20" cy="20" r="11" fill="none" stroke="currentColor" strokeWidth="1.2" opacity="0.85"/>
          <ellipse cx="20" cy="20" rx="11" ry="4.5" fill="none" stroke="currentColor" strokeWidth="0.9" opacity="0.55"/>
          <ellipse cx="20" cy="20" rx="4.5" ry="11" fill="none" stroke="currentColor" strokeWidth="0.9" opacity="0.55"/>
        </g>
      </svg>
    </span>
  );
}

Object.assign(window, { GlobeLoader, FullscreenLoader, GlobeSpinner });
