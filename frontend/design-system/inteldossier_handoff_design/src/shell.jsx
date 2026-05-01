// shell.jsx — App shell: sidebar, topbar, layout. Reads theme tokens.

const { useState, useEffect, useMemo, useRef, createContext, useContext } = React;

const AppCtx = createContext(null);
const useApp = () => useContext(AppCtx);

function AppProvider({ children }) {
  const [direction, setDirection] = useState(() => localStorage.getItem('id.dir') || 'chancery');
  const [theme, setTheme] = useState(() => localStorage.getItem('id.theme') || DIRECTIONS['chancery'].defaultTheme);
  const [density, setDensity] = useState(() => localStorage.getItem('id.density') || 'comfortable');
  const [hue, setHue] = useState(() => Number(localStorage.getItem('id.hue')) || DIRECTIONS['chancery'].defaultAccentHue);
  const [locale, setLocale] = useState(() => localStorage.getItem('id.locale') || 'en');
  const [classification, setClassification] = useState(() => localStorage.getItem('id.classif') !== 'off');
  const [page, setPage] = useState(() => localStorage.getItem('id.page') || 'dashboard');
  const [glyphVariant, setGlyphVariant] = useState(() => localStorage.getItem('id.glyph') || 'stamp');
  const [detail, setDetail] = useState(null); // {type, key}
  const [menuOpen, setMenuOpen] = useState(false);

  // Persist
  useEffect(() => { localStorage.setItem('id.dir', direction); }, [direction]);
  useEffect(() => { localStorage.setItem('id.theme', theme); }, [theme]);
  useEffect(() => { localStorage.setItem('id.density', density); }, [density]);
  useEffect(() => { localStorage.setItem('id.hue', String(hue)); }, [hue]);
  useEffect(() => { localStorage.setItem('id.locale', locale); }, [locale]);
  useEffect(() => { localStorage.setItem('id.classif', classification ? 'on' : 'off'); }, [classification]);
  useEffect(() => { localStorage.setItem('id.page', page); }, [page]);
  useEffect(() => { localStorage.setItem('id.glyph', glyphVariant); window.__GLYPH_VARIANT = glyphVariant; }, [glyphVariant]);

  // When direction changes, reset theme + hue to that direction's defaults
  const changeDirection = (d) => {
    setDirection(d);
    setTheme(DIRECTIONS[d].defaultTheme);
    setHue(DIRECTIONS[d].defaultAccentHue);
  };

  const tokens = useMemo(() => buildTokens({ direction, theme, density, hue }), [direction, theme, density, hue]);
  const t = i18n[locale];

  const value = {
    direction, setDirection: changeDirection,
    theme, setTheme,
    density, setDensity,
    hue, setHue,
    locale, setLocale,
    classification, setClassification,
    page, setPage,
    glyphVariant, setGlyphVariant,
    detail, setDetail,
    menuOpen, setMenuOpen,
    tokens, t,
  };

  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}

// ---------- Sidebar ----------
function Sidebar() {
  const { t, page, setPage, direction, locale, menuOpen, setMenuOpen } = useApp();
  const dir = DIRECTIONS[direction];

  const items = [
    { group: t.nav.operations, rows: [
      { k: 'dashboard',   icon: 'grid',      label: t.nav.dashboard },
      { k: 'engagements', icon: 'briefcase', label: t.nav.engagements },
      { k: 'afterActions',icon: 'notebook',  label: t.nav.afterActions },
      { k: 'tasks',       icon: 'check',     label: t.nav.tasks },
      { k: 'calendar',    icon: 'calendar',  label: t.nav.calendar },
      { k: 'briefs',      icon: 'book',      label: t.nav.briefs },
      { k: 'activity',    icon: 'pulse',     label: t.nav.activity },
    ]},
    { group: t.nav.dossiers, rows: [
      { k: 'countries',      icon: 'globe',    label: t.nav.countries },
      { k: 'organizations',  icon: 'building', label: t.nav.organizations },
      { k: 'persons',        icon: 'people',   label: t.nav.persons },
      { k: 'forums',         icon: 'chat',     label: t.nav.forums },
      { k: 'topics',         icon: 'tag',      label: t.nav.topics },
      { k: 'workingGroups',  icon: 'group',    label: t.nav.workingGroups },
    ]},
    { group: t.nav.admin, rows: [
      { k: 'settings', icon: 'cog', label: t.nav.settings },
      { k: 'help',     icon: 'help', label: t.nav.help },
    ]},
  ];

  return (
    <>
      {menuOpen && <div className="sb-backdrop" onClick={() => setMenuOpen(false)} />}
    <aside className={`sidebar dir-${direction} ${menuOpen ? 'is-open' : ''}`}>
      <div className="sb-brand">
        <div className="sb-mark">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <rect x="1" y="1" width="20" height="20" rx="3" fill="var(--accent)"/>
            <path d="M6 14V8l5 6V8M16 8v6" stroke="var(--accent-fg)" strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </div>
        <div className="sb-brand-text">
          <div className="sb-app">{t.appName}</div>
          <div className="sb-ws">{t.workspace}</div>
        </div>
      </div>

      <div className="sb-user">
        <div className="avatar">KA</div>
        <div className="sb-user-text">
          <div className="sb-user-name">{locale === 'en' ? 'Khalid Alzahrani' : 'خالد الزهراني'}</div>
          <div className="sb-user-role">{locale === 'en' ? 'Head of International Partnerships' : 'مدير الشراكات الدولية'}</div>
        </div>
      </div>

      <nav className="sb-nav">
        {items.map((section, i) => (
          <div key={i} className="sb-section">
            <div className="sb-group">{section.group}</div>
            {section.rows.map((r) => (
              <button
                key={r.k}
                className={`sb-item ${page === r.k ? 'active' : ''}`}
                onClick={() => { setPage(r.k); setMenuOpen(false); }}
              >
                <Icon name={r.icon} size={16} />
                <span>{r.label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>

      <div className="sb-foot">
        <div className="sb-foot-line">
          {locale === 'en' ? 'v2.0 · ' : 'الإصدار ٢٫٠ · '}
          <span style={{color: 'var(--ok)'}}>●</span>
          {locale === 'en' ? ' Synced' : ' متزامن'}
        </div>
      </div>
    </aside>
    </>
  );
}

// ---------- Topbar ----------
function Topbar({ onOpenTweaks }) {
  const { t, locale, setLocale, theme, setTheme, direction, setDirection, menuOpen, setMenuOpen } = useApp();

  return (
    <header className="topbar">
      <button className="tb-menu" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu">
        <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M3 6h14M3 10h14M3 14h14"/></svg>
      </button>
      <div className="tb-search">
        <Icon name="search" size={16} />
        <input placeholder={t.search} />
        <kbd dir="ltr">⌘K</kbd>
      </div>

      <div className="tb-right">
        <div className="tb-dir">
          {Object.entries(DIRECTIONS).map(([k, v]) => (
            <button
              key={k}
              className={`tb-dir-btn ${direction === k ? 'active' : ''}`}
              onClick={() => setDirection(k)}
              title={v.tagline}
            >
              {locale === 'en' ? v.label : (v.labelAr || v.label)}
            </button>
          ))}
        </div>

        <button className="tb-icon-btn" title="Notifications">
          <Icon name="bell" size={16} />
          <span className="tb-badge">3</span>
        </button>

        <button className="tb-icon-btn" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Theme">
          <Icon name={theme === 'dark' ? 'sun' : 'moon'} size={16} />
        </button>

        <div className="tb-locale">
          <button lang="en" className={locale === 'en' ? 'active' : ''} onClick={() => setLocale('en')}>EN</button>
          <button lang="ar" className={locale === 'ar' ? 'active' : ''} onClick={() => setLocale('ar')}>ع</button>
        </div>

        <button className="tb-tweaks" onClick={onOpenTweaks}>
          <Icon name="sliders" size={14} /> {locale === 'en' ? 'Tweaks' : 'تخصيص'}
        </button>
      </div>
    </header>
  );
}

// ---------- Classification ribbon ----------
function ClassificationBar({ level = 'restricted' }) {
  const { classification, direction, locale } = useApp();
  if (!classification) return null;
  const style = DIRECTIONS[direction].classificationStyle;
  const label = locale === 'en'
    ? `GASTAT · RESTRICTED · Handle via secure channels · Session: 20 Apr 2026 · KA`
    : `الهيئة العامة للإحصاء · مقيد · يُتداول عبر قنوات آمنة · الجلسة: ٢٠ أبريل ٢٠٢٦ · خ.أ.`;

  if (style === 'ribbon') {
    return <div className="cls-ribbon">{label}</div>;
  }
  if (style === 'marginalia') {
    return <div className="cls-marginalia">— {label} —</div>;
  }
  return <div className="cls-chip">● {label}</div>;
}

Object.assign(window, { AppProvider, useApp, Sidebar, Topbar, ClassificationBar });
