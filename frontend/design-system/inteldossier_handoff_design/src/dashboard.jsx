// dashboard.jsx — the centerpiece. All 8 hero widgets.

function Sparkline({ data, w = 80, h = 22, color = 'var(--danger)' }) {
  const max = Math.max(...data), min = Math.min(...data);
  const range = Math.max(1, max - min);
  const step = w / (data.length - 1);
  const pts = data.map((v, i) => `${i * step},${h - ((v - min) / range) * h}`).join(' ');
  return (
    <svg className="spark" width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx={w - 1} cy={h - ((data[data.length - 1] - min) / range) * h} r="2" fill={color}/>
    </svg>
  );
}

function Donut({ segments, size = 84, stroke = 10 }) {
  const total = segments.reduce((s, x) => s + x.value, 0) || 1;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size/2} cy={size/2} r={r} stroke="var(--line)" strokeWidth={stroke} fill="none"/>
      {segments.map((s, i) => {
        const frac = s.value / total;
        const dash = frac * c;
        const circle = (
          <circle key={i} cx={size/2} cy={size/2} r={r}
            stroke={s.color} strokeWidth={stroke} fill="none"
            strokeDasharray={`${dash} ${c - dash}`}
            strokeDashoffset={-offset}
            transform={`rotate(-90 ${size/2} ${size/2})`}
            strokeLinecap="butt"/>
        );
        offset += dash;
        return circle;
      })}
    </svg>
  );
}

function KpiStrip() {
  const { t, direction, locale } = useApp();
  const kpiMeta = [
    { label: t.kpis.activeEngagements, value: 12, delta: 2,  dir: 'up',   meta: fmt(locale, '5 this week · 3 travel', '٥ هذا الأسبوع · ٣ سفر') },
    { label: t.kpis.openCommitments,   value: 37, delta: -4, dir: 'up',   meta: fmt(locale, '11 due this week', '١١ مستحقة هذا الأسبوع') },
    { label: t.kpis.slaAtRisk,         value: 9,  delta: 2,  dir: 'down', meta: fmt(locale, '4 breached · 5 amber', '٤ متجاوزة · ٥ تحذير'), accent: true },
    { label: t.kpis.weekAhead,         value: 5,  delta: 1,  dir: 'up',   meta: fmt(locale, '2 VIP visits · 1 travel', 'زيارتان لكبار · رحلة واحدة') },
  ];
  return (
    <div className="kpi-strip">
      {kpiMeta.map((k, i) => (
        <div key={i} className={`kpi ${k.accent ? 'kpi-accent' : ''}`}>
          <div className="kpi-label">{k.label}</div>
          <div className="kpi-value">
            <span>{n(locale, k.value)}</span>
            <span className={`kpi-delta ${k.dir}`} dir="ltr">{k.delta > 0 ? '+' : '−'}{n(locale, Math.abs(k.delta))}</span>
          </div>
          <div className="kpi-meta">{k.meta}</div>
        </div>
      ))}
    </div>
  );
}

function WeekAhead({ onOpenDossier }) {
  const { locale } = useApp();
  return (
    <div className="card" style={{padding: 0}}>
      <div className="card-head" style={{padding: 'var(--pad)', paddingBottom: 0}}>
        <div>
          <div className="card-title">{locale === 'en' ? 'The week ahead' : 'الأسبوع القادم'}</div>
          <div className="card-sub">{locale === 'en' ? '20 – 26 April · 5 engagements, 1 travel leg' : '٢٠ – ٢٦ أبريل · ٥ مشاركات، رحلة واحدة'}</div>
        </div>
        <button className="card-link">{locale === 'en' ? 'All engagements' : 'جميع المشاركات'} <Icon name="arrow-right" size={12}/></button>
      </div>
      <div className="week-list" style={{margin: 'var(--pad)', marginTop: 'calc(var(--pad) * 0.75)'}}>
        {WEEK_AHEAD.map((e) => {
          const dayLabels = locale === 'en'
            ? { MON:'MON',TUE:'TUE',WED:'WED',THU:'THU',FRI:'FRI',SAT:'SAT',SUN:'SUN' }
            : { MON:'الإثنين',TUE:'الثلاثاء',WED:'الأربعاء',THU:'الخميس',FRI:'الجمعة',SAT:'السبت',SUN:'الأحد' };
          return (
          <div key={e.id} className="week-row" onClick={() => onOpenDossier(e.dossier)}>
            <div className="week-date">
              <div className="week-day">{dayLabels[e.day]}</div>
              <div className="week-dd">{n(locale, e.date)}</div>
              <div className="week-time" dir="ltr">{e.time}</div>
            </div>
            <div className="week-body">
              <div className="week-title">{e.title}</div>
              <div className="week-meta">
                <DossierGlyph flag={e.flag} type={e.dossierType} size={16}/>
                <span>{e.counterpart}</span>
                <span className="sep">·</span>
                <span>{e.location}</span>
              </div>
            </div>
            <div className="week-right">
              {e.status === 'travel' && <span className="chip chip-warn"><Icon name="plane" size={10}/> {fmt(locale, 'Travel', 'سفر')}</span>}
              {e.status === 'pending' && <span className="chip">{fmt(locale, 'Pending', 'معلّق')}</span>}
              {e.status === 'confirmed' && <span className="chip chip-ok">{fmt(locale, 'Confirmed', 'مؤكد')}</span>}
              <span className="chip mono" style={{fontSize: 9.5}}>{e.brief === 'ready' ? fmt(locale, 'Brief ✓', 'ملخص ✓') : fmt(locale, 'Brief draft', 'مسودة ملخص')}</span>
            </div>
          </div>
        );})}
      </div>
    </div>
  );
}

function OverdueCommitments({ onOpenDossier }) {
  const { locale } = useApp();
  const [expanded, setExpanded] = React.useState({ [OVERDUE[0].dossier]: true, [OVERDUE[1].dossier]: true });
  return (
    <div className="card">
      <div className="card-head">
        <div>
          <div className="card-title">{locale === 'en' ? 'Overdue commitments' : 'الالتزامات المتأخرة'}</div>
          <div className="card-sub">{locale === 'en' ? '11 open across 5 dossiers · grouped by counterpart' : '١١ مفتوحًا عبر ٥ ملفات'}</div>
        </div>
        <span className="chip chip-danger mono">{n(locale, 11)} {fmt(locale, 'OPEN', 'مفتوح')}</span>
      </div>
      <div>
        {OVERDUE.map((g) => (
          <div key={g.dossier} className="overdue-group">
            <div className="overdue-head">
              <button className="overdue-head-left" onClick={() => setExpanded({...expanded, [g.dossier]: !expanded[g.dossier]})}>
                <span className="overdue-flag"><DossierGlyph flag={g.flag} type={g.type} size={20}/></span>
                <span>{g.dossier}</span>
                <span className="overdue-dossier-type">{g.type}</span>
              </button>
              <button className="card-link" onClick={() => onOpenDossier(g.dossier)}>
                <Icon name="arrow-up-right" size={11}/>
              </button>
            </div>
            {expanded[g.dossier] && g.items.map((it) => (
              <div key={it.id} className="overdue-item">
                <span className={`overdue-sev ${it.severity}`}/>
                <span style={{overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap'}}>{it.title}</span>
                <span className="overdue-days" dir="ltr">{n(locale, it.days)}{fmt(locale,'d','ي')}</span>
                <span className="overdue-owner">{it.owner}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function SlaHealth() {
  const { locale } = useApp();
  const s = SLA_HEALTH;
  const segments = [
    { value: s.breached, color: 'var(--sla-bad)' },
    { value: s.atRisk,   color: 'var(--sla-risk)' },
    { value: s.onTrack,  color: 'var(--sla-ok)' },
  ];
  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title">{locale === 'en' ? 'SLA health' : 'صحة اتفاقية الخدمة'}</div>
        <span className="chip">{n(locale, s.total)} {fmt(locale, 'total', 'إجمالي')}</span>
      </div>
      <div className="sla-donut">
        <div style={{position:'relative'}}>
          <Donut segments={segments}/>
          <div style={{position:'absolute', inset:0, display:'grid', placeItems:'center', textAlign:'center', pointerEvents:'none'}}>
            <div style={{maxWidth: '70%'}}>
              <div style={{fontFamily:'var(--font-display)', fontSize:20, fontWeight:600, lineHeight:1, letterSpacing:'-0.02em'}}>{n(locale, Math.round(s.onTrack/s.total*100))}%</div>
              <div style={{fontSize:8.5, textTransform:'uppercase', letterSpacing:'0.06em', color:'var(--ink-faint)', fontWeight:600, marginTop:3, lineHeight:1.1, whiteSpace:'nowrap'}}>{fmt(locale, 'on track', 'على المسار')}</div>
            </div>
          </div>
        </div>
        <div className="sla-numbers">
          <div className="sla-row"><span className="dot" style={{background:'var(--sla-ok)'}}/>{fmt(locale,'On track','على المسار')} <span className="sla-count">{n(locale, s.onTrack)}</span></div>
          <div className="sla-row"><span className="dot" style={{background:'var(--sla-risk)'}}/>{fmt(locale,'At risk','عرضة للخطر')} <span className="sla-count">{n(locale, s.atRisk)}</span></div>
          <div className="sla-row"><span className="dot" style={{background:'var(--sla-bad)'}}/>{fmt(locale,'Breached','متجاوز')} <span className="sla-count">{n(locale, s.breached)}</span></div>
          <div className="sla-row" style={{marginTop:6, borderTop:'1px solid var(--line)', paddingTop:6}}>
            <span className="label" style={{padding:0}}>{fmt(locale,'14-day trend','اتجاه ١٤ يوم')}</span>
            <span style={{marginInlineStart:'auto'}}><Sparkline data={s.trend}/></span>
          </div>
        </div>
      </div>
    </div>
  );
}

function VipVisits() {
  const { locale } = useApp();
  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title">{locale === 'en' ? 'Upcoming VIP visits' : 'زيارات كبار الشخصيات'}</div>
        <button className="card-link">{locale === 'en' ? 'All' : 'الكل'}</button>
      </div>
      <div className="vip-list">
        {VIP_VISITS.map((v, i) => (
          <div key={i} className="vip-row">
            <div className="vip-countdown">
              <div className="vip-countdown-n" dir="ltr">{v.days === 0 ? fmt(locale,'NOW','الآن') : `T−${n(locale, v.days)}`}</div>
              <div className="vip-countdown-l">{v.days === 0 ? fmt(locale,'today','اليوم') : fmt(locale,'days','أيام')}</div>
            </div>
            <div>
              <div className="vip-name" style={{display:'flex', alignItems:'center', gap:8}}><DossierGlyph flag={v.flag} size={18}/> {v.who}</div>
              <div className="vip-role">{v.role}</div>
            </div>
            <div className="vip-when">{v.when}<br/><span style={{color:'var(--ink-faint)'}}>{v.where}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MyTasks() {
  const { locale } = useApp();
  const [done, setDone] = React.useState({});
  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title">{locale === 'en' ? 'My desk' : 'مكتبي'}</div>
        <span className="chip">{n(locale, MY_TASKS.length - Object.values(done).filter(Boolean).length)} {fmt(locale,'pending','معلّق')}</span>
      </div>
      <div className="tasks-list">
        {MY_TASKS.map((t) => (
          <div key={t.id} className="task-row" style={{opacity: done[t.id] ? 0.45 : 1}}>
            <div className={`task-box ${done[t.id] ? 'done' : ''}`} onClick={() => setDone({...done, [t.id]: !done[t.id]})}>
              {done[t.id] && <svg width="14" height="14" viewBox="0 0 14 14"><path d="M3 7l3 3 5-6" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </div>
            <span className="task-flag"><DossierGlyph flag={t.flag} size={18}/></span>
            <div className="task-title" style={{textDecoration: done[t.id] ? 'line-through' : 'none'}}>{t.title}</div>
            <span className={`task-due ${t.due === 'today' ? 'today' : ''} ${t.priority}`}>{locale==='en' ? t.due : (t.due==='today'?'اليوم':t.due==='tomorrow'?'غدًا':toArDigits(t.due))}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Digest() {
  const { locale } = useApp();
  const [busy, setBusy] = React.useState(false);
  const refresh = () => {
    if (busy) return;
    setBusy(true);
    setTimeout(() => setBusy(false), 1800);
  };
  return (
    <div className="card">
      <div className="card-head">
        <div>
          <div className="card-title">{locale === 'en' ? 'Intelligence digest' : 'موجز الاستخبارات'}</div>
          <div className="card-sub">{locale === 'en' ? 'Curated for you · 5 items' : 'مختار لك · ٥ عناصر'}</div>
        </div>
        <button className="card-link" onClick={refresh} data-busy={busy}>
          {busy ? <GlobeSpinner size={12}/> : <Icon name="sparkle" size={12}/>}
          {' '}{busy ? (locale === 'en' ? 'Refreshing' : 'جاري التحديث') : (locale === 'en' ? 'Refresh' : 'تحديث')}
        </button>
      </div>
      <div style={{position:'relative'}}>
        {busy && (
          <div style={{position:'absolute', inset:0, background:'color-mix(in srgb, var(--surface) 70%, transparent)', backdropFilter:'blur(1px)', display:'grid', placeItems:'center', zIndex:2, borderRadius:'inherit'}}>
            <GlobeSpinner size={28}/>
          </div>
        )}
        {DIGEST.map((d, i) => (
          <div key={i} className="digest-item">
            <div className="digest-tag">{d.tag}</div>
            <div>
              <div className="digest-head">{d.headline}</div>
              <div className="digest-source">{d.source}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentDossiers({ onOpenDossier }) {
  const { locale } = useApp();
  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title">{locale === 'en' ? 'Recently updated' : 'آخر التحديثات'}</div>
        <button className="card-link">{locale === 'en' ? 'Following' : 'متابَع'}</button>
      </div>
      <div className="recent-list">
        {RECENT_DOSSIERS.map((d, i) => (
          <button key={i} className="recent-row" onClick={() => onOpenDossier(d.name)} style={{textAlign:'start', border:0, background:'transparent'}}>
            <span className="recent-flag"><DossierGlyph flag={d.flag} type={d.type} size={22}/></span>
            <div>
              <div className="recent-name">{d.name}</div>
              <div className="recent-change">{d.change} · <span style={{color:'var(--ink-faint)'}}>{d.by}</span></div>
            </div>
            <span className="recent-when">{d.updated}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function ForumsStrip() {
  const { locale } = useApp();
  return (
    <div className="card">
      <div className="card-head">
        <div className="card-title">{locale === 'en' ? 'Forums & summits' : 'المنتديات والقمم'}</div>
        <button className="card-link">{locale === 'en' ? 'Calendar' : 'التقويم'}</button>
      </div>
      <div className="forums-list">
        {FORUMS.slice(0, 4).map((f, i) => (
          <div key={i} className="forum-row" style={{gridTemplateColumns:'auto 1fr auto'}}>
            <div className="forum-short">{f.short}</div>
            <div>
              <div className="forum-name">{f.name}</div>
              <div style={{fontSize: 11.5, color:'var(--ink-mute)', marginTop:2}}>Role: <span style={{color:'var(--ink)'}}>{f.role}</span></div>
            </div>
            <div style={{textAlign:'end'}}>
              <div className="forum-when">{f.when}</div>
              <span className={`chip ${f.status === 'upcoming' ? 'chip-accent' : f.status === 'planned' ? '' : 'chip-ok'}`} style={{marginTop:4}}>{f.status}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Dashboard({ onOpenDossier }) {
  const { t, locale } = useApp();
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1 className="page-title">{t.greeting}</h1>
          <div className="page-sub">{t.today} · {locale === 'en' ? 'Portfolio overview' : 'نظرة عامة على المحفظة'}</div>
        </div>
        <div style={{display:'flex', gap:8}}>
          <button className="btn"><Icon name="plus" size={14}/> {locale === 'en' ? 'New request' : 'طلب جديد'}</button>
          <button className="btn btn-primary"><Icon name="plus" size={14}/> {locale === 'en' ? 'New engagement' : 'مشاركة جديدة'}</button>
        </div>
      </div>

      <KpiStrip/>

      <div className="dash-grid">
        <div className="dash-col">
          <WeekAhead onOpenDossier={onOpenDossier}/>
          <OverdueCommitments onOpenDossier={onOpenDossier}/>
          <Digest/>
        </div>
        <div className="dash-col">
          <SlaHealth/>
          <VipVisits/>
          <MyTasks/>
          <RecentDossiers onOpenDossier={onOpenDossier}/>
          <ForumsStrip/>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { Dashboard, Sparkline, Donut });
