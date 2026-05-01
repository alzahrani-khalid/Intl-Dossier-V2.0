// app.jsx — root composition.

function App() {
  const a = useApp();
  const [tweaksOpen, setTweaksOpen] = React.useState(false);
  const [dossierName, setDossierName] = React.useState(null);
  // Splash on initial mount (1.6s). Also exposed globally so Tweaks can re-trigger.
  const [splashOpen, setSplashOpen] = React.useState(true);
  React.useEffect(() => {
    const t = setTimeout(() => setSplashOpen(false), 1600);
    window.__showGlobeLoader = (ms = 1800) => {
      setSplashOpen(true);
      setTimeout(() => setSplashOpen(false), ms);
    };
    return () => clearTimeout(t);
  }, []);

  // apply tokens + dir
  React.useEffect(() => {
    const root = document.documentElement;
    Object.entries(a.tokens).forEach(([k, v]) => root.style.setProperty(k, v));
    root.setAttribute('dir', i18n[a.locale].dir);
    root.className = `dir-${a.direction}`;
    document.body.className = `dir-${a.direction} theme-${a.theme}`;
  }, [a.tokens, a.locale, a.direction, a.theme]);

  const page = (() => {
    const open = setDossierName;
    switch (a.page) {
      case 'dashboard': return <Dashboard onOpenDossier={open}/>;
      case 'engagements': return <EngagementsPage onOpenDossier={open}/>;
      case 'tasks': return <TasksPage/>;
      case 'calendar': return <CalendarPage onOpenDossier={open}/>;
      case 'briefs': return <BriefsPage/>;
      case 'afterActions': return <AfterActionsPage/>;
      case 'activity': return <ActivityPage/>;
      case 'countries': return <DossierListPage kind="countries" onOpenDossier={open}/>;
      case 'organizations': return <DossierListPage kind="organizations" onOpenDossier={open}/>;
      case 'persons': return <PersonsPage/>;
      case 'forums': return <GenericListPage kind="forums"/>;
      case 'topics': return <GenericListPage kind="topics"/>;
      case 'workingGroups': return <GenericListPage kind="workingGroups"/>;
      case 'settings': return <SettingsPage/>;
      case 'help':
      default:
        // Simulate work-board for 'tasks'-like; use board for engagements' default detail
        if (a.page === 'help') {
          const L = a.locale === 'en';
          const title = L ? 'Help' : 'المساعدة';
          const sub = L ? 'Documentation, keyboard shortcuts, and support' : 'التوثيق واختصارات لوحة المفاتيح والدعم';
          const ks = L ? 'Keyboard shortcuts' : 'اختصارات لوحة المفاتيح';
          const shortcuts = L ? [
            ['⌘K','Search'],['C','New engagement'],['B','New brief'],['T','New task'],
            ['G+D','Dashboard'],['G+E','Engagements'],['?','Help']
          ] : [
            ['⌘K','بحث'],['C','مشاركة جديدة'],['B','ملخص جديد'],['T','مهمة جديدة'],
            ['G+D','الموقف'],['G+E','المشاركات'],['?','مساعدة']
          ];
          return <div className="page"><PageHead title={title} sub={sub}/>
            <div className="card"><div className="card-title">{ks}</div>
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:12, marginTop:12, fontSize:13}}>
              {shortcuts.map(([k,v],i)=>(
                <div key={i} style={{display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:'1px solid var(--line-soft)'}}><span>{v}</span><span className="mono" style={{background:'var(--line-soft)', padding:'2px 8px', borderRadius:3}}>{k}</span></div>
              ))}
            </div></div>
          </div>;
        }
        return <WorkBoardPage onOpenDossier={open}/>;
    }
  })();

  // special case: work board for 'tasks' already uses TasksPage; add a Work Board entry by forcing a secondary page in Tweaks? Keep simple: tasks page already there.

  return (
    <div className="app">
      <Sidebar/>
      <Topbar onOpenTweaks={() => setTweaksOpen(true)}/>
      <main className="main">
        <ClassificationBar/>
        {page}
      </main>
      {tweaksOpen && <TweaksPanel onClose={() => setTweaksOpen(false)}/>}
      {dossierName && <DossierDrawer name={dossierName} onClose={() => setDossierName(null)}/>}
      <FullscreenLoader open={splashOpen} label={a.locale === 'en' ? 'Loading dossiers' : 'جاري التحميل'}/>
    </div>
  );
}

function Root() {
  return <AppProvider><App/></AppProvider>;
}

const rootEl = document.getElementById('root');
ReactDOM.createRoot(rootEl).render(<Root/>);
