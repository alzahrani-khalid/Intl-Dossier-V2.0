// pages.jsx — all secondary pages + dossier drawer.

function PageHead({ title, sub, action }) {
  return (
    <div className="page-head">
      <div>
        <h1 className="page-title">{title}</h1>
        {sub && <div className="page-sub">{sub}</div>}
      </div>
      {action}
    </div>
  );
}

function Toolbar({ children }) {
  return <div style={{display:'flex', gap:8, marginBottom: 'var(--gap)', flexWrap:'wrap', alignItems:'center'}}>{children}</div>;
}

function FilterPill({ label, active, onClick, count }) {
  return (
    <button className={`btn ${active ? 'btn-primary' : ''}`} style={{padding:'5px 12px', fontSize:12}} onClick={onClick}>
      {label} {count !== undefined && <span style={{opacity:0.6, marginInlineStart:4}}>{count}</span>}
    </button>
  );
}

// ============ ENGAGEMENTS ============
function EngagementsPage({ onOpenDossier }) {
  const { locale } = useApp();
  const [filter, setFilter] = React.useState('all');
  const [q, setQ] = React.useState('');
  const rows = WEEK_AHEAD.concat([
    { id: 'e6', day: 'TUE', date: 28, month: 'APR', time: '10:00', title: 'UN Statistical Commission prep', counterpart: 'UNSD secretariat', location: 'Virtual', dossier: 'UN Statistics Division', flag: '🇺🇳', status: 'confirmed', brief: 'draft' },
    { id: 'e7', day: 'WED', date: 29, month: 'APR', time: '15:00', title: 'Eurostat data-sharing review', counterpart: 'Luxembourg · hybrid', location: 'Virtual', dossier: 'Eurostat', flag: '🇪🇺', status: 'pending', brief: 'draft' },
    { id: 'e8', day: 'MON', date: 4, month: 'MAY', time: '09:00', title: 'IFAD President reception', counterpart: 'Álvaro Lario', location: 'Rome', dossier: 'IFAD', flag: '🇮🇹', status: 'travel', brief: 'ready' },
  ]).filter(e => (filter === 'all' || e.status === filter) && (q === '' || e.title.toLowerCase().includes(q.toLowerCase())));

  return (
    <div className="page">
      <PageHead
        title={locale === 'en' ? 'Engagements' : 'المشاركات'}
        sub={locale === 'en' ? 'Bilateral meetings, consultations, missions and delegations' : 'الاجتماعات والمشاورات والبعثات'}
        action={<button className="btn btn-primary"><Icon name="plus" size={14}/> {locale === 'en' ? 'Log engagement' : 'تسجيل مشاركة'}</button>}
      />
      <Toolbar>
        <div className="tb-search" style={{flex:'0 1 320px'}}>
          <Icon name="search" size={14}/>
          <input value={q} onChange={e => setQ(e.target.value)} placeholder={locale === 'en' ? 'Search engagements…' : 'ابحث…'}/>
        </div>
        <FilterPill label={locale === 'en' ? 'All' : 'الكل'} active={filter === 'all'} onClick={() => setFilter('all')} count={8}/>
        <FilterPill label={locale === 'en' ? 'Confirmed' : 'مؤكّد'} active={filter === 'confirmed'} onClick={() => setFilter('confirmed')} count={4}/>
        <FilterPill label={locale === 'en' ? 'Travel' : 'سفر'} active={filter === 'travel'} onClick={() => setFilter('travel')} count={2}/>
        <FilterPill label={locale === 'en' ? 'Pending' : 'معلّق'} active={filter === 'pending'} onClick={() => setFilter('pending')} count={2}/>
        <span style={{marginInlineStart:'auto', fontSize:12, color:'var(--ink-mute)'}}>{rows.length} {locale === 'en' ? 'shown' : 'معروض'}</span>
      </Toolbar>

      <div className="card" style={{padding: 0}}>
        <div className="week-list" style={{border:0, borderRadius:0}}>
          {rows.map(e => (
            <div key={e.id} className="week-row" onClick={() => onOpenDossier(e.dossier)}>
              <div className="week-date">
                <div className="week-day">{e.day}</div>
                <div className="week-dd">{e.date}</div>
                <div className="week-time">{e.time}</div>
              </div>
              <div className="week-body">
                <div className="week-title">{e.title}</div>
                <div className="week-meta">
                  <span style={{display:'inline-flex', alignItems:'center', gap:6}}><DossierGlyph flag={e.flag} type={e.dossierType} size={16}/> {e.counterpart}</span>
                  <span className="sep">·</span>
                  <span>{e.location}</span>
                </div>
              </div>
              <div className="week-right">
                {e.status === 'travel' && <span className="chip chip-warn"><Icon name="plane" size={10}/> Travel</span>}
                {e.status === 'pending' && <span className="chip">Pending</span>}
                {e.status === 'confirmed' && <span className="chip chip-ok">Confirmed</span>}
              </div>
            </div>
          ))}
          <LoadMoreRow/>
        </div>
      </div>
    </div>
  );
}

// Inline "Load more" with globe spinner — demonstrates the spinner in a real
// data-fetching moment.
function LoadMoreRow() {
  const { locale } = useApp();
  const [busy, setBusy] = React.useState(false);
  const click = () => {
    setBusy(true);
    setTimeout(() => setBusy(false), 1600);
  };
  if (busy) {
    return (
      <div className="spinner-row" style={{justifyContent:'center', borderTop:'1px solid var(--line-soft)'}}>
        <GlobeSpinner size={16}/>
        <span>{locale === 'en' ? 'Loading more engagements…' : 'جاري تحميل المزيد…'}</span>
      </div>
    );
  }
  return (
    <button className="spinner-row" onClick={click}
      style={{justifyContent:'center', borderTop:'1px solid var(--line-soft)', width:'100%', background:'transparent', border:0, borderTop:'1px solid var(--line-soft)', cursor:'pointer'}}>
      {locale === 'en' ? 'Load earlier engagements' : 'تحميل المزيد'}
    </button>
  );
}

// ============ WORK BOARD ============
function WorkBoardPage({ onOpenDossier }) {
  const { locale } = useApp();
  const [group, setGroup] = React.useState('status');
  const [q, setQ] = React.useState('');
  return (
    <div className="page">
      <PageHead
        title={locale === 'en' ? 'Work board' : 'لوحة العمل'}
        sub={locale === 'en' ? '48 items across commitments and tasks · 27 overdue' : '٤٨ عنصرًا · ٢٧ متأخر'}
        action={
          <div style={{display:'flex', gap:8}}>
            <button className="btn">{locale === 'en' ? 'List view' : 'عرض القائمة'}</button>
            <button className="btn btn-primary"><Icon name="plus" size={14}/> {locale === 'en' ? 'New item' : 'عنصر جديد'}</button>
          </div>
        }
      />
      <Toolbar>
        <div className="tb-search" style={{flex:'0 1 280px'}}>
          <Icon name="search" size={14}/><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Search work items…"/>
        </div>
        <FilterPill label={locale === 'en' ? 'By status' : 'بالحالة'} active={group==='status'} onClick={()=>setGroup('status')}/>
        <FilterPill label={locale === 'en' ? 'By dossier' : 'بالملف'} active={group==='dossier'} onClick={()=>setGroup('dossier')}/>
        <FilterPill label={locale === 'en' ? 'By owner' : 'بالمسؤول'} active={group==='owner'} onClick={()=>setGroup('owner')}/>
        <span className="chip chip-danger mono" style={{marginInlineStart:'auto'}}>27 overdue</span>
      </Toolbar>

      <div className="board-scroll">
        <div className="board">
          {BOARD_COLS.map(col => (
            <div key={col.key} className="col">
              <div className="col-head">
                <div className="col-head-l">
                  <span className="col-title">{col.title}</span>
                  <span className="col-count">{col.count}</span>
                </div>
                <button className="btn-ghost" style={{padding:4}}><Icon name="plus" size={14}/></button>
              </div>
              <div className="col-body">
                {col.items.map(it => (
                  <div key={it.id} className={`kcard ${it.overdue ? 'overdue' : ''} ${it.done ? 'done' : ''}`} onClick={() => onOpenDossier(it.dossier)}>
                    <div className="kcard-top">
                      <span className={`chip ${it.kind === 'Commitment' ? 'chip-accent' : 'chip-info'}`}>{it.kind}</span>
                      <span className={`chip ${it.priority === 'high' ? 'chip-danger' : it.priority === 'med' ? 'chip-warn' : ''}`}>{it.priority}</span>
                    </div>
                    <div className="kcard-title">{it.title}</div>
                    <div className="kcard-foot">
                      <div className="kcard-dossier">
                        <DossierGlyph flag={it.flag} size={14}/><span>{it.dossier}</span>
                      </div>
                      <div style={{display:'flex', alignItems:'center', gap:8}}>
                        <span className="mono" style={{fontSize:10.5, color: it.overdue ? 'var(--danger)' : 'var(--ink-mute)'}}>{it.due}</span>
                        <span className="kcard-owner">{it.owner}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============ CALENDAR ============
function CalendarPage({ onOpenDossier }) {
  const { locale } = useApp();
  // April 2026: Apr 1 is Wednesday (weekday index 3 with Sun=0)
  const events = {
    20: [{title: 'ESCWA consultation', cls: ''}, {title: 'Brief review', cls: ''}],
    21: [{title: 'G20 DGI prep', cls: ''}],
    22: [{title: 'Indonesia delegation', cls: ''}, {title: 'Muscat travel', cls: 'travel'}],
    23: [{title: 'MoU review · GCC', cls: 'travel'}],
    24: [{title: 'Minister readout', cls: 'pending'}],
    28: [{title: 'UNSD prep', cls: ''}],
    29: [{title: 'Eurostat review', cls: 'pending'}],
    12: [{title: 'Brief deadline', cls: ''}],
    15: [{title: 'Q1 report', cls: ''}],
    6: [{title: 'Kick-off', cls: ''}],
  };
  const cells = [];
  const startPad = 2; // Apr 1 = Wed (pad Sun, Mon so Apr 1 lands on Wed col)
  for (let i = 0; i < startPad; i++) cells.push({ other: true, d: 29 + i });
  for (let d = 1; d <= 30; d++) cells.push({ d });
  while (cells.length < 35) cells.push({ other: true, d: cells.length - 30 - 1 });

  const dowEn = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const dowAr = ['أحد','إثن','ثلا','أرب','خمي','جمع','سبت'];

  return (
    <div className="page">
      <PageHead
        title={locale === 'en' ? 'Calendar' : 'التقويم'}
        sub={locale === 'en' ? 'April 2026 · Meetings, deadlines, travel' : 'أبريل ٢٠٢٦'}
        action={<button className="btn btn-primary"><Icon name="plus" size={14}/> {locale === 'en' ? 'New event' : 'فعالية جديدة'}</button>}
      />
      <Toolbar>
        <div style={{display:'flex', border:'1px solid var(--line)', borderRadius:'var(--radius-sm)', overflow:'hidden'}}>
          <button className="btn btn-primary" style={{borderRadius:0, borderInlineEnd:0}}>Month</button>
          <button className="btn btn-ghost" style={{borderRadius:0}}>Week</button>
          <button className="btn btn-ghost" style={{borderRadius:0}}>Day</button>
        </div>
        <button className="btn"><Icon name="chevron-right" size={12} style={{transform:'scaleX(-1)'}}/></button>
        <div style={{fontFamily:'var(--font-display)', fontSize:18, fontWeight:500, letterSpacing:'-0.01em'}}>{locale === 'en' ? 'April 2026' : 'أبريل ٢٠٢٦'}</div>
        <button className="btn"><Icon name="chevron-right" size={12}/></button>
        <button className="btn btn-ghost">Today</button>
      </Toolbar>
      <div className="cal-grid">
        {(locale === 'en' ? dowEn : dowAr).map(d => <div key={d} className="cal-dow">{d}</div>)}
        {cells.map((c, i) => (
          <div key={i} className={`cal-cell ${c.other ? 'other' : ''} ${c.d === 20 ? 'today' : ''}`}>
            <div className="cal-d">{c.d}</div>
            {!c.other && (events[c.d] || []).map((e, j) => (
              <div key={j} className={`cal-ev ${e.cls}`} onClick={() => onOpenDossier('Indonesia')}>{e.title}</div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============ DOSSIER LIST (generic) ============
function DossierListPage({ kind, onOpenDossier }) {
  const { locale } = useApp();
  const meta = {
    countries:     { icon: 'globe',    title: locale === 'en' ? 'Countries' : 'الدول', sub: locale === 'en' ? 'National entities with diplomatic relations' : 'الدول والعلاقات الدبلوماسية', rows: COUNTRIES },
    organizations: { icon: 'building', title: locale === 'en' ? 'Organizations' : 'المنظمات', sub: locale === 'en' ? 'International bodies, agencies, ministries' : 'الهيئات والوكالات الدولية', rows: ORGANIZATIONS },
  }[kind];

  if (!meta) {
    return <div className="page"><PageHead title={kind}/><div className="empty-hint">{locale === 'en' ? 'Dossier list coming soon.' : 'قائمة الملفات قريبًا'}</div></div>;
  }

  return (
    <div className="page">
      <PageHead
        title={<span style={{display:'flex', alignItems:'center', gap:12}}><Icon name={meta.icon} size={26}/>{meta.title}</span>}
        sub={meta.sub}
        action={<button className="btn btn-primary"><Icon name="plus" size={14}/> {locale === 'en' ? 'Create dossier' : 'إنشاء ملف'}</button>}
      />
      <Toolbar>
        <div className="tb-search" style={{flex:'0 1 360px'}}><Icon name="search" size={14}/><input placeholder={locale === 'en' ? 'Search dossiers…' : 'ابحث…'}/></div>
        <button className="btn"><Icon name="filter" size={12}/> {locale === 'en' ? 'Filter' : 'تصفية'}</button>
        <button className="btn"><Icon name="sort" size={12}/> {locale === 'en' ? 'Sort' : 'ترتيب'}</button>
        <span style={{marginInlineStart:'auto', fontSize:12, color:'var(--ink-mute)'}}>{meta.rows.length} dossiers</span>
      </Toolbar>
      <div className="card" style={{padding: 0}}>
        <table className="tbl">
          <thead><tr>
            <th>{locale === 'en' ? 'Name' : 'الاسم'}</th>
            {kind === 'countries' && <th>{locale === 'en' ? 'Code' : 'الرمز'}</th>}
            {kind === 'organizations' && <th>{locale === 'en' ? 'Type' : 'النوع'}</th>}
            <th>{locale === 'en' ? 'Name (Arabic)' : 'بالعربية'}</th>
            <th>{locale === 'en' ? 'Engagements' : 'المشاركات'}</th>
            <th>{locale === 'en' ? 'Last updated' : 'آخر تحديث'}</th>
            <th>{locale === 'en' ? 'Sensitivity' : 'الحساسية'}</th>
            <th></th>
          </tr></thead>
          <tbody>
            {meta.rows.map((r, i) => (
              <tr key={i} style={{cursor:'pointer'}} onClick={() => onOpenDossier(r.en)}>
                <td style={{fontWeight:500}}><span style={{display:'inline-flex', alignItems:'center', gap:8}}><DossierGlyph flag={r.flag} type={kind === 'countries' ? 'country' : kind.slice(0,-1)} size={18}/> {r.en}</span></td>
                {kind === 'countries' && <td className="mono" style={{color:'var(--ink-mute)'}}>{r.code}</td>}
                {kind === 'organizations' && <td><span className="chip">{r.type}</span></td>}
                <td style={{color:'var(--ink-mute)', direction:'rtl', fontFamily:"'Tajawal', var(--font-body), system-ui, sans-serif"}}>{r.ar}</td>
                <td><span className="mono">{r.engagements}</span></td>
                <td className="mono" style={{color:'var(--ink-mute)'}}>{r.lastTouch}</td>
                <td><span className={`chip ${r.sens === 'restricted' ? 'chip-danger' : r.sens === 'confidential' ? 'chip-warn' : ''}`}>{r.sens}</span></td>
                <td style={{textAlign:'end'}}><Icon name="chevron-right" size={14} className="icon-flip"/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============ BRIEFS / AFTER-ACTIONS / TASKS / ACTIVITY / SETTINGS ============
function BriefsPage() {
  const { locale } = useApp();
  const briefs = [
    { title: 'Indonesia delegation — bilateral consultation', status: 'awaiting approval', when: 'due today', pages: 14, author: 'N. Al-Qahtani' },
    { title: 'ESCWA — talking points for Executive Secretary', status: 'ready', when: 'ready', pages: 6, author: 'K. Alzahrani' },
    { title: 'G20 DGI-3 — country position paper', status: 'draft', when: 'due Thu 24 Apr', pages: 22, author: 'S. Al-Harbi' },
    { title: 'GCC-Stat — MoU annual review', status: 'ready', when: 'ready', pages: 11, author: 'N. Al-Qahtani' },
    { title: 'Vision 2030 Q2 readout — minister', status: 'draft', when: 'due Fri 25 Apr', pages: 34, author: 'K. Alzahrani' },
    { title: 'OECD data-request response', status: 'review', when: 'due Thu 24 Apr', pages: 9, author: 'A. Badr' },
  ];
  return (
    <div className="page">
      <PageHead
        title={locale === 'en' ? 'Briefs' : 'الملخصات'}
        sub={locale === 'en' ? 'Position papers, talking points, readouts' : 'أوراق المواقف وخلاصات الاجتماعات'}
        action={<button className="btn btn-primary"><Icon name="plus" size={14}/> {locale === 'en' ? 'New brief' : 'ملخص جديد'}</button>}
      />
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(320px, 1fr))', gap:'var(--gap)'}}>
        {briefs.map((b, i) => (
          <div key={i} className="card" style={{cursor:'pointer'}}>
            <div style={{display:'flex', justifyContent:'space-between', marginBottom:8}}>
              <span className={`chip ${b.status === 'ready' ? 'chip-ok' : b.status === 'draft' ? '' : b.status === 'review' ? 'chip-info' : 'chip-warn'}`}>{b.status}</span>
              <span className="mono" style={{fontSize:11, color:'var(--ink-faint)'}}>{b.pages} pp</span>
            </div>
            <div style={{fontFamily:'var(--font-display)', fontSize:16, fontWeight:500, letterSpacing:'-0.01em', lineHeight:1.3, marginBottom:10}}>{b.title}</div>
            <div style={{display:'flex', justifyContent:'space-between', fontSize:11.5, color:'var(--ink-mute)'}}>
              <span>{b.author}</span>
              <span className="mono">{b.when}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AfterActionsPage() {
  const { locale } = useApp();
  const aa = [
    { title: 'UNSC 57 plenary — day 3 session', when: '6 Mar 2026', decisions: 4, commitments: 7, dossier: 'UN Statistics Division' },
    { title: 'Indonesia BPS preliminary call', when: '14 Apr 2026', decisions: 2, commitments: 3, dossier: 'Indonesia' },
    { title: 'G20 DGI-3 sherpa briefing', when: '9 Apr 2026', decisions: 1, commitments: 5, dossier: 'G20 DGI' },
    { title: 'GCC-Stat ministerial roundtable', when: '2 Apr 2026', decisions: 3, commitments: 4, dossier: 'GCC-Stat' },
    { title: 'OECD committee on statistics', when: '28 Mar 2026', decisions: 2, commitments: 2, dossier: 'OECD' },
  ];
  return (
    <div className="page">
      <PageHead
        title={locale === 'en' ? 'After-action records' : 'ملاحظات ما بعد الإجراء'}
        sub={locale === 'en' ? 'Captured decisions, commitments, and notes from past engagements' : 'القرارات والالتزامات الملتقطة'}
      />
      <div className="card" style={{padding:0}}>
        <table className="tbl">
          <thead><tr><th>{locale === 'en' ? 'Engagement' : 'المشاركة'}</th><th>{locale === 'en' ? 'Date' : 'التاريخ'}</th><th>{locale === 'en' ? 'Dossier' : 'الملف'}</th><th>{locale === 'en' ? 'Decisions' : 'القرارات'}</th><th>{locale === 'en' ? 'Commitments' : 'الالتزامات'}</th><th></th></tr></thead>
          <tbody>
            {aa.map((r,i) => (
              <tr key={i}>
                <td style={{fontWeight:500}}>{r.title}</td>
                <td className="mono" style={{color:'var(--ink-mute)'}}>{r.when}</td>
                <td><span className="chip">{r.dossier}</span></td>
                <td><span className="mono">{r.decisions}</span></td>
                <td><span className="mono">{r.commitments}</span></td>
                <td style={{textAlign:'end'}}><Icon name="chevron-right" size={14} className="icon-flip"/></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TasksPage() {
  const { locale } = useApp();
  const [done, setDone] = React.useState({});
  return (
    <div className="page">
      <PageHead
        title={locale === 'en' ? 'My desk' : 'مكتبي'}
        sub={locale === 'en' ? 'Tasks assigned to me, ordered by urgency' : 'المهام الموكلة إليّ'}
      />
      <div className="card">
        <div className="tasks-list">
          {MY_TASKS.map(t => (
            <div key={t.id} className="task-row" style={{opacity: done[t.id] ? 0.45 : 1, padding:'10px 6px'}}>
              <div className={`task-box ${done[t.id] ? 'done' : ''}`} onClick={() => setDone({...done, [t.id]: !done[t.id]})}>
                {done[t.id] && <svg width="14" height="14" viewBox="0 0 14 14"><path d="M3 7l3 3 5-6" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
              </div>
              <DossierGlyph flag={t.flag} size={18}/>
              <div className="task-title" style={{textDecoration: done[t.id] ? 'line-through' : 'none', fontSize:14}}>
                <div>{t.title}</div>
                <div style={{fontSize:11, color:'var(--ink-mute)', marginTop:2}}>{t.dossier} · {t.type}</div>
              </div>
              <span className={`chip ${t.priority === 'high' ? 'chip-danger' : 'chip-warn'}`}>{t.priority}</span>
              <span className="task-due" style={{minWidth:80}}>{t.due}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ActivityPage() {
  const { locale } = useApp();
  const icons = { approval: 'check', link: 'link', file: 'file', check: 'check', alert: 'alert', comment: 'chat' };
  return (
    <div className="page">
      <PageHead title={locale === 'en' ? 'Activity' : 'النشاط'} sub={locale === 'en' ? 'Everything happening across your portfolio' : 'كل ما يحدث في محفظتك'}/>
      <div className="card">
        <div className="act-list">
          {ACTIVITY.map((a, i) => (
            <div key={i} className="act-row">
              <span className="act-t">{a.t}</span>
              <span style={{color:'var(--ink-faint)'}}><Icon name={icons[a.type] || 'dot'} size={14}/></span>
              <div>
                <span className="act-who">{a.who}</span>{' '}
                <span className="act-what">{a.action} <strong style={{color:'var(--ink)', fontWeight:500}}>{a.what}</strong> in </span>
                <span className="act-where">{a.where}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function SettingsPage() {
  const { locale } = useApp();
  const [section, setSection] = React.useState('profile');
  const secs = [
    { k: 'profile', i: 'people', label: locale === 'en' ? 'Profile' : 'الملف الشخصي' },
    { k: 'general', i: 'cog', label: locale === 'en' ? 'General' : 'عام' },
    { k: 'appearance', i: 'sparkle', label: locale === 'en' ? 'Appearance' : 'المظهر' },
    { k: 'notif', i: 'bell', label: locale === 'en' ? 'Notifications' : 'الإشعارات' },
    { k: 'access', i: 'shield', label: locale === 'en' ? 'Access & Security' : 'الوصول والأمن' },
    { k: 'data', i: 'lock', label: locale === 'en' ? 'Data & Privacy' : 'البيانات والخصوصية' },
  ];
  return (
    <div className="page">
      <PageHead title={locale === 'en' ? 'Settings' : 'الإعدادات'} sub={locale === 'en' ? 'Workspace, account, and security preferences' : 'تفضيلات الحساب والأمن'}/>
      <div style={{display:'grid', gridTemplateColumns:'240px 1fr', gap:'var(--gap)'}}>
        <div className="card" style={{padding: 8}}>
          {secs.map(s => (
            <button key={s.k} className={`settings-nav ${section===s.k ? 'active' : ''}`} onClick={() => setSection(s.k)}>
              <Icon name={s.i} size={14}/>{s.label}
            </button>
          ))}
        </div>
        <div className="card">
          <div className="card-title" style={{marginBottom:4}}>{secs.find(s=>s.k===section).label}</div>
          <div className="card-sub" style={{marginBottom:16}}>{locale === 'en' ? 'Manage preferences for this section' : 'إدارة تفضيلات هذا القسم'}</div>
          <div style={{display:'flex', flexDirection:'column', gap:16}}>
            {(locale === 'en'
              ? [['Display name','How your name appears across the workspace.'],['Time zone','Used for scheduling and timestamps.'],['Working hours','Your default availability window.'],['Default workspace','The workspace you land on at sign-in.'],['Two-factor auth','Add an extra layer of sign-in security.']]
              : [['الاسم المعروض','الاسم الظاهر في مساحة العمل.'],['المنطقة الزمنية','تُستخدم للجدولة والطوابع الزمنية.'],['ساعات العمل','نافذة التوفر الافتراضية.'],['مساحة العمل الافتراضية','المساحة التي تظهر عند تسجيل الدخول.'],['المصادقة الثنائية','طبقة حماية إضافية عند تسجيل الدخول.']]
            ).map(([f, h],i) => (
              <div key={i} style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 0', borderBottom:'1px solid var(--line-soft)', gap: 16}}>
                <div>
                  <div style={{fontWeight:500, fontSize:13}}>{f}</div>
                  <div style={{fontSize:11.5, color:'var(--ink-mute)', marginTop:2}}>{h}</div>
                </div>
                <button className="btn">{locale === 'en' ? 'Edit' : 'تعديل'}</button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============ DOSSIER DRAWER ============
function DossierDrawer({ name, onClose }) {
  const { locale } = useApp();
  if (!name) return null;
  const recent = [
    { t: '09:42', who: 'N. Al-Qahtani', what: 'Approved brief v3' },
    { t: 'yday', who: 'K. Alzahrani', what: 'Linked to G20 DGI-3' },
    { t: '2d', who: 'S. Al-Harbi', what: 'Uploaded talking points' },
    { t: '4d', who: 'A. Badr', what: 'Scheduled delegation visit' },
  ];
  return (
    <>
      <div className="drawer-overlay" onClick={onClose}/>
      <div className="drawer">
        <div className="drawer-head">
          <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:8}}>
            <div style={{display:'flex', gap:8}}>
              <span className="chip">DOSSIER</span>
              <span className="chip chip-warn">CONFIDENTIAL</span>
            </div>
            <button className="btn-ghost" onClick={onClose} style={{padding:6}}>✕</button>
          </div>
          <div className="drawer-title">{name}</div>
          <div className="drawer-meta">
            <span>📍 Global</span>
            <span>·</span>
            <span>{locale === 'en' ? 'Lead: Khalid Alzahrani' : 'المسؤول: خالد الزهراني'}</span>
            <span>·</span>
            <span>{locale === 'en' ? '22 engagements' : '٢٢ مشاركة'}</span>
            <span>·</span>
            <span>{locale === 'en' ? 'Last touched today' : 'آخر تحديث اليوم'}</span>
          </div>
          <div style={{display:'flex', gap:8, marginTop:12}}>
            <button className="btn btn-primary"><Icon name="plus" size={12}/>{locale === 'en' ? 'Log engagement' : 'تسجيل مشاركة'}</button>
            <button className="btn"><Icon name="book" size={12}/>{locale === 'en' ? 'Brief' : 'ملخص'}</button>
            <button className="btn"><Icon name="users-plus" size={12}/>{locale === 'en' ? 'Follow' : 'متابعة'}</button>
          </div>
        </div>
        <div className="drawer-body">
          <div className="kpi-mini-strip">
            <div className="kpi-mini"><span className="kpi-mini-val">22</span><span className="kpi-mini-label">engagements</span></div>
            <div className="kpi-mini"><span className="kpi-mini-val">7</span><span className="kpi-mini-label">open commitments</span></div>
            <div className="kpi-mini"><span className="kpi-mini-val">3</span><span className="kpi-mini-label">overdue</span></div>
            <div className="kpi-mini"><span className="kpi-mini-val">14</span><span className="kpi-mini-label">documents</span></div>
          </div>

          <div>
            <div className="label" style={{marginBottom:8}}>{locale === 'en' ? 'Summary' : 'الملخص'}</div>
            <p style={{fontSize:14, lineHeight:1.6, color:'var(--ink-mute)', margin:0, fontFamily: 'var(--font-display)', fontStyle:'italic'}}>
              {locale === 'en'
                ? 'Active bilateral statistical partnership. Primary counterparts in BPS and the Ministry of National Development Planning. Recent focus: geospatial census collaboration, Vision 2030 alignment, and G20 data-gaps coordination.'
                : 'شراكة إحصائية ثنائية نشطة. التركيز الحالي: التعاون في التعداد الجغرافي ومواءمة رؤية ٢٠٣٠.'}
            </p>
          </div>

          <div>
            <div className="label" style={{marginBottom:8}}>{locale === 'en' ? 'Upcoming' : 'القادم'}</div>
            <div className="week-list" style={{borderRadius:'var(--radius-sm)'}}>
              {WEEK_AHEAD.slice(0, 2).map(e => (
                <div key={e.id} className="week-row">
                  <div className="week-date"><div className="week-day">{e.day}</div><div className="week-dd">{e.date}</div><div className="week-time">{e.time}</div></div>
                  <div className="week-body"><div className="week-title">{e.title}</div><div className="week-meta">{e.counterpart} · {e.location}</div></div>
                  <div className="week-right"><span className="chip chip-ok">{e.status}</span></div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="label" style={{marginBottom:8}}>{locale === 'en' ? 'Recent activity' : 'النشاط الأخير'}</div>
            <div className="act-list">
              {recent.map((a, i) => (
                <div key={i} className="act-row">
                  <span className="act-t">{a.t}</span>
                  <span style={{color:'var(--ink-faint)'}}><Icon name="dot" size={10}/></span>
                  <div><span className="act-who">{a.who}</span> <span className="act-what">{a.what}</span></div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="label" style={{marginBottom:8}}>{locale === 'en' ? 'Open commitments' : 'الالتزامات المفتوحة'}</div>
            {OVERDUE[0].items.map(it => (
              <div key={it.id} className="overdue-item"><span className={`overdue-sev ${it.severity}`}/><span style={{flex:1}}>{it.title}</span><span className="overdue-days">{it.days}d</span><span className="overdue-owner">{it.owner}</span></div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

// ============ PERSONS placeholder ============
function PersonsPage() {
  const { locale } = useApp();
  const people = [
    { name: 'Rola Dashti', role: 'Exec. Secretary, UN ESCWA', flag: '🇰🇼', org: 'UN ESCWA', vip: true },
    { name: 'Amalia Adininggar Widyasanti', role: 'Chief Statistician', flag: '🇮🇩', org: 'BPS Indonesia', vip: true },
    { name: 'Stefan Schweinfest', role: 'Director, UN Stats Division', flag: '🇺🇳', org: 'UNSD', vip: true },
    { name: 'Álvaro Lario', role: 'President', flag: '🇮🇹', org: 'IFAD', vip: true },
    { name: 'Sabina Bhatia', role: 'Deputy Director', flag: '🇺🇳', org: 'IMF Statistics', vip: false },
    { name: 'Paul Cheung', role: 'Senior Advisor', flag: '🇸🇬', org: 'UN ESCAP', vip: false },
  ];
  return (
    <div className="page">
      <PageHead title={locale === 'en' ? 'People' : 'الأشخاص'} sub={locale === 'en' ? 'VIPs, counterparts, delegation members' : 'كبار الشخصيات والنظراء'}/>
      <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(280px, 1fr))', gap:'var(--gap)'}}>
        {people.map((p, i) => (
          <div key={i} className="card" style={{display:'flex', gap:14, alignItems:'center'}}>
            <div style={{width:44, height:44, borderRadius:'50%', background:'var(--accent-soft)', color:'var(--accent-ink)', display:'grid', placeItems:'center', fontFamily:'var(--font-display)', fontWeight:600, fontSize:16, flexShrink:0}}>
              {p.name.split(' ').map(w=>w[0]).slice(0,2).join('')}
            </div>
            <div style={{flex:1, minWidth:0}}>
              <div style={{display:'flex', alignItems:'center', gap:8, fontWeight:500, fontSize:14}}><DossierGlyph flag={p.flag} size={18}/> {p.name} {p.vip && <span className="chip chip-accent">VIP</span>}</div>
              <div style={{fontSize:12, color:'var(--ink-mute)', marginTop:2}}>{p.role}</div>
              <div style={{fontSize:11, color:'var(--ink-faint)', marginTop:2}}>{p.org}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Generic list page for forums/topics/working groups
function GenericListPage({ kind }) {
  const { locale } = useApp();
  const meta = {
    forums: { title: locale === 'en' ? 'Forums' : 'المنتديات', rows: FORUMS.map(f => ({ name: f.name, meta: `${f.when} · ${f.role}`, chip: f.status })) },
    topics: { title: locale === 'en' ? 'Topics' : 'المواضيع', rows: [
      { name: 'Vision 2030 Alignment', meta: 'National · 18 engagements', chip: 'active' },
      { name: 'Geospatial Statistics', meta: 'Technical · 9 engagements', chip: 'active' },
      { name: 'SDG Monitoring', meta: 'Global · 24 engagements', chip: 'active' },
      { name: 'AI in Official Statistics', meta: 'Emerging · 6 engagements', chip: 'active' },
      { name: 'Census 2030', meta: 'National · 12 engagements', chip: 'active' },
      { name: 'Data Gaps (G20)', meta: 'Multilateral · 15 engagements', chip: 'active' },
    ]},
    workingGroups: { title: locale === 'en' ? 'Working groups' : 'مجموعات العمل', rows: [
      { name: 'G20 DGI-3 Task Force', meta: 'Co-chair · 12 members', chip: 'active' },
      { name: 'GCC-Stat SDG Sub-group', meta: 'Member · 8 members', chip: 'active' },
      { name: 'ESCWA Arab SDG Monitor', meta: 'Delegate · 22 members', chip: 'active' },
      { name: 'OECD AI-in-Statistics', meta: 'Observer · 14 members', chip: 'active' },
    ]},
  }[kind];
  if (!meta) return null;
  return (
    <div className="page">
      <PageHead title={meta.title} sub={locale === 'en' ? 'Dossiers grouped by theme' : 'الملفات مجمعة حسب الموضوع'}/>
      <div className="card" style={{padding:0}}>
        <div className="forums-list">
          {meta.rows.map((r, i) => (
            <div key={i} className="forum-row" style={{gridTemplateColumns:'1fr auto auto'}}>
              <div>
                <div className="forum-name">{r.name}</div>
                <div style={{fontSize:11.5, color:'var(--ink-mute)', marginTop:2}}>{r.meta}</div>
              </div>
              <span className={`chip ${r.chip === 'active' || r.chip === 'upcoming' ? 'chip-accent' : ''}`}>{r.chip}</span>
              <Icon name="chevron-right" size={14} className="icon-flip"/>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, {
  EngagementsPage, WorkBoardPage, CalendarPage, DossierListPage,
  BriefsPage, AfterActionsPage, TasksPage, ActivityPage, SettingsPage,
  DossierDrawer, PersonsPage, GenericListPage,
});
