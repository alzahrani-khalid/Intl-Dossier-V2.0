// tweaks.jsx — right-side settings panel.

function TweaksPanel({ onClose }) {
  const a = useApp();
  const isAr = a.locale === 'ar';
  const L = {
    title:        isAr ? 'تخصيص'                   : 'Tweaks',
    subtitle:     isAr ? 'اضبط هذا النموذج مباشرةً' : 'Live-configure this prototype',
    direction:    isAr ? 'الاتجاه التصميمي'        : 'Design direction',
    theme:        isAr ? 'السمة'                   : 'Theme',
    light:        isAr ? 'فاتح'                    : 'Light',
    dark:         isAr ? 'داكن'                    : 'Dark',
    density:      isAr ? 'الكثافة'                 : 'Density',
    comfortable:  isAr ? 'مريح'                    : 'Comfortable',
    compact:      isAr ? 'متوسط'                   : 'Compact',
    dense:        isAr ? 'كثيف'                    : 'Dense',
    reading:      isAr ? 'اتجاه القراءة'           : 'Reading direction',
    ltrLabel:     isAr ? 'LTR · الإنجليزية'        : 'LTR · English',
    rtlLabel:     isAr ? 'RTL · العربية'           : 'RTL · عربي',
    accent:       isAr ? 'درجة اللون المميّز'      : 'Accent hue',
    classif:      isAr ? 'شريط التصنيف'           : 'Classification ribbon',
    on:           isAr ? 'تشغيل'                   : 'On',
    off:          isAr ? 'إيقاف'                   : 'Off',
    shortcuts:    isAr ? 'الاختصارات'              : 'Shortcuts',
    searchAny:    isAr ? 'ابحث في أي شيء'          : 'Search anything',
    newEng:       isAr ? 'مشاركة جديدة'            : 'New engagement',
    newBrief:     isAr ? 'ملخص جديد'               : 'New brief',
    loader:       isAr ? 'شاشة التحميل'            : 'Loading state',
    previewLoader:isAr ? 'عرض لفترة وجيزة'         : 'Preview for 2s',
    glyph:        isAr ? 'رمز الملف (الأعلام)'     : 'Dossier glyph',
    glyphStamp:   isAr ? 'ختم الجواز'              : 'Passport stamp',
    glyphTile:    isAr ? 'بلاطة ملوّنة'             : 'Color tile',
  };
  return (
    <div className="tweaks-overlay" onClick={onClose}>
      <div className="tweaks-panel" onClick={e => e.stopPropagation()}>
        <button className="close" onClick={onClose}>✕</button>
        <h3>{L.title}</h3>
        <div style={{fontSize:12, color:'var(--ink-mute)'}}>{L.subtitle}</div>

        <h4>{L.direction}</h4>
        <div style={{display:'flex', flexDirection:'column', gap:6}}>
          {Object.entries(DIRECTIONS).map(([k, v]) => (
            <button key={k} onClick={() => a.setDirection(k)}
              style={{
                display:'block', textAlign:'start', padding:10, borderRadius:'var(--radius-sm)',
                border: `1px solid ${a.direction===k ? 'var(--accent)' : 'var(--line)'}`,
                background: a.direction===k ? 'var(--accent-soft)' : 'var(--surface)',
                color: a.direction===k ? 'var(--accent-ink)' : 'var(--ink)',
              }}>
              <div style={{fontWeight:600, fontSize:13}}>{isAr ? (v.labelAr || v.label) : v.label}</div>
              <div style={{fontSize:11, color:'var(--ink-mute)', marginTop:2}}>{v.tagline}</div>
            </button>
          ))}
        </div>

        <h4>{L.theme}</h4>
        <div className="tweak-row">
          <button className={a.theme==='light' ? 'on' : ''} onClick={()=>a.setTheme('light')}>{L.light}</button>
          <button className={a.theme==='dark' ? 'on' : ''} onClick={()=>a.setTheme('dark')}>{L.dark}</button>
        </div>

        <h4>{L.density}</h4>
        <div className="tweak-row">
          <button className={a.density==='comfortable' ? 'on' : ''} onClick={()=>a.setDensity('comfortable')}>{L.comfortable}</button>
          <button className={a.density==='compact' ? 'on' : ''} onClick={()=>a.setDensity('compact')}>{L.compact}</button>
          <button className={a.density==='dense' ? 'on' : ''} onClick={()=>a.setDensity('dense')}>{L.dense}</button>
        </div>

        <h4>{L.reading}</h4>
        <div className="tweak-row">
          <button className={a.locale==='en' ? 'on' : ''} onClick={()=>a.setLocale('en')}>{L.ltrLabel}</button>
          <button className={a.locale==='ar' ? 'on' : ''} onClick={()=>a.setLocale('ar')}>{L.rtlLabel}</button>
        </div>

        <h4>{L.accent} — <span dir="ltr">{n(a.locale, Math.round(a.hue))}°</span></h4>
        <input type="range" min="0" max="360" step="1" value={a.hue} onChange={e => a.setHue(Number(e.target.value))} className="tweak-hue"/>
        <div style={{display:'flex', gap:6, marginTop:8}}>
          {[22, 158, 190, 258, 330].map(h => (
            <button key={h} onClick={() => a.setHue(h)} style={{flex:1, height:24, borderRadius:'var(--radius-sm)', border:`2px solid ${Math.abs(a.hue-h)<4 ? 'var(--ink)' : 'transparent'}`, background:`oklch(58% 0.14 ${h})`, cursor:'pointer'}}/>
          ))}
        </div>

        <h4>{L.classif}</h4>
        <div className="tweak-row">
          <button className={a.classification ? 'on' : ''} onClick={()=>a.setClassification(true)}>{L.on}</button>
          <button className={!a.classification ? 'on' : ''} onClick={()=>a.setClassification(false)}>{L.off}</button>
        </div>

        <h4>{L.shortcuts}</h4>
        <div style={{fontSize:11, color:'var(--ink-mute)', lineHeight:1.8}}>
          <div><span className="mono" style={{background:'var(--line-soft)', padding:'1px 6px', borderRadius:3}} dir="ltr">⌘K</span> {L.searchAny}</div>
          <div><span className="mono" style={{background:'var(--line-soft)', padding:'1px 6px', borderRadius:3}}>C</span> {L.newEng}</div>
          <div><span className="mono" style={{background:'var(--line-soft)', padding:'1px 6px', borderRadius:3}}>B</span> {L.newBrief}</div>
        </div>

        <h4>{L.loader}</h4>
        <button className="btn btn-primary" style={{width:'100%'}} onClick={() => { onClose(); setTimeout(() => window.__showGlobeLoader && window.__showGlobeLoader(2200), 150); }}>{L.previewLoader}</button>
      </div>
    </div>
  );
}

Object.assign(window, { TweaksPanel });
