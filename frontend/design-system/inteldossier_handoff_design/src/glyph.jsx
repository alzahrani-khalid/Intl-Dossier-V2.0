// DossierGlyph — small circular SVG flag icons drawn inline.
// Each flag is a hand-drawn simplified SVG clipped to a circle with a thin
// outline. For non-country dossiers (forums, persons, topics, organizations)
// we render a geometric glyph in the same circular frame so everything lines
// up visually.

// ---------- individual flag SVGs ----------
// All designed in a 32x32 viewBox; scaled via <svg> width/height.
// Simplified, recognisable shapes — not geographically exact.

const FlagSVG = {
  // Saudi Arabia — solid green with white horizontal bar + sword (simplified)
  SA: (
    <g>
      <rect width="32" height="32" fill="#006C35"/>
      <rect x="4" y="18" width="24" height="1.5" fill="#fff"/>
      <path d="M6 14 L26 14" stroke="#fff" strokeWidth="1.2" strokeLinecap="round"/>
      <circle cx="16" cy="11" r="1.3" fill="#fff"/>
    </g>
  ),
  // UAE — green, white, black horizontal + red vertical at hoist
  AE: (
    <g>
      <rect width="32" height="10.7" fill="#00732F"/>
      <rect y="10.7" width="32" height="10.6" fill="#fff"/>
      <rect y="21.3" width="32" height="10.7" fill="#000"/>
      <rect width="10" height="32" fill="#FF0000"/>
    </g>
  ),
  // Indonesia — red over white
  ID: (
    <g>
      <rect width="32" height="16" fill="#E70011"/>
      <rect y="16" width="32" height="16" fill="#fff"/>
    </g>
  ),
  // Egypt — red/white/black horizontal with gold eagle (simplified circle)
  EG: (
    <g>
      <rect width="32" height="10.7" fill="#CE1126"/>
      <rect y="10.7" width="32" height="10.6" fill="#fff"/>
      <rect y="21.3" width="32" height="10.7" fill="#000"/>
      <circle cx="16" cy="16" r="2.4" fill="#C09300"/>
    </g>
  ),
  // Qatar — maroon with white serrated band at hoist (simplified 5 points)
  QA: (
    <g>
      <rect width="32" height="32" fill="#8A1538"/>
      <path d="M0 0 L10 0 L7 3.5 L10 7 L7 10.5 L10 14 L7 17.5 L10 21 L7 24.5 L10 28 L7 31.5 L10 32 L0 32 Z" fill="#fff"/>
    </g>
  ),
  // Jordan — black/white/green horizontal with red triangle at hoist
  JO: (
    <g>
      <rect width="32" height="10.7" fill="#000"/>
      <rect y="10.7" width="32" height="10.6" fill="#fff"/>
      <rect y="21.3" width="32" height="10.7" fill="#007A3D"/>
      <path d="M0 0 L14 16 L0 32 Z" fill="#CE1126"/>
      <circle cx="5" cy="16" r="1.4" fill="#fff"/>
    </g>
  ),
  // Bahrain — red with white serrated band at hoist
  BH: (
    <g>
      <rect width="32" height="32" fill="#CE1126"/>
      <path d="M0 0 L12 0 L8 3.2 L12 6.4 L8 9.6 L12 12.8 L8 16 L12 19.2 L8 22.4 L12 25.6 L8 28.8 L12 32 L0 32 Z" fill="#fff"/>
    </g>
  ),
  // Oman — white/red/green with red vertical at hoist and emblem
  OM: (
    <g>
      <rect width="32" height="10.7" fill="#fff"/>
      <rect y="10.7" width="32" height="10.6" fill="#DB161B"/>
      <rect y="21.3" width="32" height="10.7" fill="#007A3D"/>
      <rect width="10" height="32" fill="#DB161B"/>
      <circle cx="5" cy="6" r="1.6" fill="#fff" stroke="#DB161B" strokeWidth="0.5"/>
    </g>
  ),
  // Kuwait — green/white/red horizontal with black trapezoid at hoist
  KW: (
    <g>
      <rect width="32" height="10.7" fill="#007A3D"/>
      <rect y="10.7" width="32" height="10.6" fill="#fff"/>
      <rect y="21.3" width="32" height="10.7" fill="#CE1126"/>
      <path d="M0 0 L10 10.7 L10 21.3 L0 32 Z" fill="#000"/>
    </g>
  ),
  // Pakistan — green with white vertical at hoist, crescent + star
  PK: (
    <g>
      <rect width="32" height="32" fill="#01411C"/>
      <rect width="8" height="32" fill="#fff"/>
      <circle cx="20" cy="16" r="5.5" fill="#fff"/>
      <circle cx="21.6" cy="15" r="4.8" fill="#01411C"/>
      <path d="M26 12 L27 14 L29 14 L27.5 15.3 L28 17 L26 16 L24 17 L24.5 15.3 L23 14 L25 14 Z" fill="#fff"/>
    </g>
  ),
  // Morocco — red with green pentagram (simplified)
  MA: (
    <g>
      <rect width="32" height="32" fill="#C1272D"/>
      <path d="M16 9 L18.5 15 L25 15 L19.8 18.7 L21.7 25 L16 21 L10.3 25 L12.2 18.7 L7 15 L13.5 15 Z" fill="none" stroke="#006233" strokeWidth="1.3"/>
    </g>
  ),
  // Turkey — red with white crescent and star
  TR: (
    <g>
      <rect width="32" height="32" fill="#E30A17"/>
      <circle cx="13" cy="16" r="6" fill="#fff"/>
      <circle cx="15" cy="16" r="5" fill="#E30A17"/>
      <path d="M22 13 L23 15.5 L25.5 15.5 L23.5 17 L24.3 19.5 L22 18 L19.7 19.5 L20.5 17 L18.5 15.5 L21 15.5 Z" fill="#fff"/>
    </g>
  ),
  // China — red with yellow stars (simplified)
  CN: (
    <g>
      <rect width="32" height="32" fill="#DE2910"/>
      <path d="M10 5 L11.8 9.7 L17 10 L13 13.2 L14.2 18 L10 15.2 L5.8 18 L7 13.2 L3 10 L8.2 9.7 Z" fill="#FFDE00"/>
      <circle cx="16" cy="6" r="0.9" fill="#FFDE00"/>
      <circle cx="18" cy="10" r="0.9" fill="#FFDE00"/>
      <circle cx="18" cy="15" r="0.9" fill="#FFDE00"/>
      <circle cx="16" cy="19" r="0.9" fill="#FFDE00"/>
    </g>
  ),
  // Italy — green/white/red vertical
  IT: (
    <g>
      <rect width="10.7" height="32" fill="#008C45"/>
      <rect x="10.7" width="10.6" height="32" fill="#fff"/>
      <rect x="21.3" width="10.7" height="32" fill="#CD212A"/>
    </g>
  ),
  // France — blue/white/red vertical
  FR: (
    <g>
      <rect width="10.7" height="32" fill="#0055A4"/>
      <rect x="10.7" width="10.6" height="32" fill="#fff"/>
      <rect x="21.3" width="10.7" height="32" fill="#EF4135"/>
    </g>
  ),
  // Germany — black/red/gold horizontal
  DE: (
    <g>
      <rect width="32" height="10.7" fill="#000"/>
      <rect y="10.7" width="32" height="10.6" fill="#DD0000"/>
      <rect y="21.3" width="32" height="10.7" fill="#FFCE00"/>
    </g>
  ),
  // UK — simplified Union Jack
  GB: (
    <g>
      <rect width="32" height="32" fill="#012169"/>
      <path d="M0 0 L32 32 M32 0 L0 32" stroke="#fff" strokeWidth="4.5"/>
      <path d="M0 0 L32 32 M32 0 L0 32" stroke="#C8102E" strokeWidth="2"/>
      <path d="M16 0 V32 M0 16 H32" stroke="#fff" strokeWidth="6"/>
      <path d="M16 0 V32 M0 16 H32" stroke="#C8102E" strokeWidth="3"/>
    </g>
  ),
  // USA — stripes + blue canton
  US: (
    <g>
      <rect width="32" height="32" fill="#fff"/>
      {[0,2,4,6,8,10,12].map(i => (
        <rect key={i} y={i * (32/13)} width="32" height={32/13} fill="#B22234"/>
      ))}
      <rect width="14" height={32*7/13} fill="#3C3B6E"/>
    </g>
  ),
  // Japan — white with red disc
  JP: (
    <g>
      <rect width="32" height="32" fill="#fff"/>
      <circle cx="16" cy="16" r="7" fill="#BC002D"/>
    </g>
  ),
  // Korea (South) — simplified
  KR: (
    <g>
      <rect width="32" height="32" fill="#fff"/>
      <circle cx="16" cy="16" r="5.5" fill="#C60C30"/>
      <path d="M16 10.5 A5.5 5.5 0 0 1 16 21.5 A2.75 2.75 0 0 1 16 16 A2.75 2.75 0 0 0 16 10.5" fill="#003478"/>
    </g>
  ),
  // India — saffron/white/green horizontal with blue wheel
  IN: (
    <g>
      <rect width="32" height="10.7" fill="#FF9933"/>
      <rect y="10.7" width="32" height="10.6" fill="#fff"/>
      <rect y="21.3" width="32" height="10.7" fill="#138808"/>
      <circle cx="16" cy="16" r="2.2" fill="none" stroke="#000080" strokeWidth="0.6"/>
    </g>
  ),
  // Brazil — green with yellow diamond and blue circle
  BR: (
    <g>
      <rect width="32" height="32" fill="#009C3B"/>
      <path d="M16 5 L28 16 L16 27 L4 16 Z" fill="#FFDF00"/>
      <circle cx="16" cy="16" r="4.5" fill="#002776"/>
    </g>
  ),
  // EU — blue with ring of yellow stars (simplified)
  EU: (
    <g>
      <rect width="32" height="32" fill="#003399"/>
      {Array.from({length: 12}).map((_, i) => {
        const a = (i / 12) * Math.PI * 2 - Math.PI/2;
        const x = 16 + Math.cos(a) * 8;
        const y = 16 + Math.sin(a) * 8;
        return <circle key={i} cx={x} cy={y} r="1.2" fill="#FFCC00"/>;
      })}
    </g>
  ),
  // UN — light blue with white wreath (simplified)
  UN: (
    <g>
      <rect width="32" height="32" fill="#5B92E5"/>
      <circle cx="16" cy="16" r="7" fill="none" stroke="#fff" strokeWidth="1"/>
      <circle cx="16" cy="16" r="2.5" fill="none" stroke="#fff" strokeWidth="0.8"/>
      <path d="M16 9 V23 M9 16 H23 M11 11 L21 21 M21 11 L11 21" stroke="#fff" strokeWidth="0.5" opacity="0.8"/>
    </g>
  ),
};

// Flag emoji → code lookup (for data where flag is stored as emoji)
const FLAG_CODE = {
  '🇸🇦': 'SA', '🇦🇪': 'AE', '🇮🇩': 'ID', '🇪🇬': 'EG', '🇶🇦': 'QA',
  '🇯🇴': 'JO', '🇧🇭': 'BH', '🇴🇲': 'OM', '🇰🇼': 'KW', '🇵🇰': 'PK',
  '🇲🇦': 'MA', '🇹🇷': 'TR', '🇨🇳': 'CN', '🇮🇹': 'IT', '🇫🇷': 'FR',
  '🇩🇪': 'DE', '🇬🇧': 'GB', '🇺🇸': 'US', '🇯🇵': 'JP', '🇰🇷': 'KR',
  '🇮🇳': 'IN', '🇧🇷': 'BR', '🇪🇺': 'EU', '🇺🇳': 'UN',
};

// Symbol for non-country dossier types (same circular treatment)
function SymbolGlyph({ type, size }) {
  const map = {
    forum:        { sym: '◇', bg: '#eef1f5', fg: '#4a5568' },
    person:       { sym: '●', bg: '#ece8e1', fg: '#6b5b3e' },
    topic:        { sym: '◆', bg: '#f0ede5', fg: '#7a6640' },
    organization: { sym: '▲', bg: '#e8ecf0', fg: '#3b546e' },
  };
  const m = map[type] || { sym: '·', bg: '#eee', fg: '#666' };
  return (
    <span style={{
      width: size, height: size, borderRadius: '50%',
      background: m.bg, color: m.fg,
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      fontSize: Math.round(size * 0.55),
      flexShrink: 0,
      border: '1px solid var(--line-soft)',
      lineHeight: 1,
    }}>{m.sym}</span>
  );
}

function DossierGlyph({ flag, type, size = 20 }) {
  // Resolve country code
  let code = null;
  if (flag && FLAG_CODE[flag]) code = FLAG_CODE[flag];

  // Non-country symbols
  if (!code) {
    if (flag === '🌐') return <SymbolGlyph type="forum" size={size}/>;
    if (flag === '👤') return <SymbolGlyph type="person" size={size}/>;
    if (flag === '🏛') return <SymbolGlyph type="organization" size={size}/>;
    if (flag === '📊') return <SymbolGlyph type="topic" size={size}/>;
    return <SymbolGlyph type={type} size={size}/>;
  }

  const id = `dg-clip-${code}`;
  return (
    <svg width={size} height={size} viewBox="0 0 32 32"
         style={{flexShrink: 0, display: 'inline-block', verticalAlign: 'middle', borderRadius: '50%'}}
         aria-label={code} role="img">
      <defs>
        <clipPath id={id}><circle cx="16" cy="16" r="16"/></clipPath>
      </defs>
      <g clipPath={`url(#${id})`}>
        {FlagSVG[code]}
      </g>
      <circle cx="16" cy="16" r="15.5" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="0.8"/>
    </svg>
  );
}

Object.assign(window, { DossierGlyph, FLAG_CODE, FlagSVG });
