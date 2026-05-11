// icons.jsx — tiny inline SVG icon set. No external deps.
// All icons 20x20 viewBox, currentColor stroked.

function Icon({ name, size = 18, style }) {
  const common = { width: size, height: size, viewBox: '0 0 20 20', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round', strokeLinejoin: 'round', style, className: `icon icon-${name}` };
  switch (name) {
    case 'grid': return <svg {...common}><rect x="3" y="3" width="6" height="6" rx="1"/><rect x="11" y="3" width="6" height="6" rx="1"/><rect x="3" y="11" width="6" height="6" rx="1"/><rect x="11" y="11" width="6" height="6" rx="1"/></svg>;
    case 'briefcase': return <svg {...common}><rect x="2.5" y="6" width="15" height="10" rx="1.5"/><path d="M7 6V4.5A1.5 1.5 0 0 1 8.5 3h3A1.5 1.5 0 0 1 13 4.5V6"/><path d="M2.5 10h15"/></svg>;
    case 'notebook': return <svg {...common}><path d="M5 3h9a2 2 0 0 1 2 2v12a1 1 0 0 1-1 1H5"/><path d="M5 3a2 2 0 0 0-2 2v10a3 3 0 0 0 3 3h9"/><path d="M8 7h5M8 10h5"/></svg>;
    case 'check': return <svg {...common}><rect x="3" y="3" width="14" height="14" rx="2"/><path d="M6.5 10l2.5 2.5L14 7.5"/></svg>;
    case 'calendar': return <svg {...common}><rect x="3" y="4.5" width="14" height="13" rx="1.5"/><path d="M3 8h14M7 3v3M13 3v3"/></svg>;
    case 'book': return <svg {...common}><path d="M4 4h9a3 3 0 0 1 3 3v10H7a3 3 0 0 1-3-3V4Z"/><path d="M4 14h9a3 3 0 0 1 3 3"/></svg>;
    case 'pulse': return <svg {...common}><path d="M2 10h3l2-5 3 10 2-7 2 4h4"/></svg>;
    case 'globe': return <svg {...common}><circle cx="10" cy="10" r="7"/><path d="M3 10h14M10 3c2.5 2 2.5 12 0 14M10 3c-2.5 2-2.5 12 0 14"/></svg>;
    case 'building': return <svg {...common}><rect x="3.5" y="3" width="13" height="14" rx="1"/><path d="M7 7h2M7 10h2M7 13h2M11 7h2M11 10h2M11 13h2"/></svg>;
    case 'people': return <svg {...common}><circle cx="7" cy="8" r="2.5"/><circle cx="14" cy="8" r="2"/><path d="M2.5 16c.5-2.5 2.3-4 4.5-4s4 1.5 4.5 4"/><path d="M12 14.5c.4-1.5 1.6-2.5 3-2.5s2.3 1 2.5 2"/></svg>;
    case 'chat': return <svg {...common}><path d="M4 4h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H8l-3 3v-3H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z"/></svg>;
    case 'tag': return <svg {...common}><path d="M10 3H4a1 1 0 0 0-1 1v6l7 7 7-7-7-7Z"/><circle cx="6.5" cy="6.5" r="1"/></svg>;
    case 'group': return <svg {...common}><circle cx="6" cy="7" r="2"/><circle cx="14" cy="7" r="2"/><circle cx="10" cy="13" r="2"/><path d="M2 16c.5-2 2-3 4-3M14 16c-.5-2-2-3-4-3M6 14.5c1 1 2 1.5 4 1.5s3-.5 4-1.5"/></svg>;
    case 'cog': return <svg {...common}><circle cx="10" cy="10" r="2.5"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.5 4.5l1.4 1.4M14.1 14.1l1.4 1.4M4.5 15.5l1.4-1.4M14.1 5.9l1.4-1.4"/></svg>;
    case 'help': return <svg {...common}><circle cx="10" cy="10" r="7"/><path d="M8 8a2 2 0 1 1 3 1.7c-.6.4-1 .8-1 1.8M10 14v.5"/></svg>;
    case 'search': return <svg {...common}><circle cx="9" cy="9" r="5"/><path d="M13 13l4 4"/></svg>;
    case 'bell': return <svg {...common}><path d="M5 13V9a5 5 0 0 1 10 0v4l1 2H4l1-2Z"/><path d="M8 16a2 2 0 0 0 4 0"/></svg>;
    case 'plus': return <svg {...common}><path d="M10 4v12M4 10h12"/></svg>;
    case 'arrow-right': return <svg {...common}><path d="M4 10h12M11 5l5 5-5 5"/></svg>;
    case 'arrow-up-right': return <svg {...common}><path d="M6 14L14 6M7 6h7v7"/></svg>;
    case 'flag': return <svg {...common}><path d="M5 3v14M5 4h9l-2 3 2 3H5"/></svg>;
    case 'shield': return <svg {...common}><path d="M10 3l6 2v5c0 4-3 6-6 7-3-1-6-3-6-7V5l6-2Z"/></svg>;
    case 'lock': return <svg {...common}><rect x="4" y="9" width="12" height="8" rx="1.5"/><path d="M7 9V6a3 3 0 0 1 6 0v3"/></svg>;
    case 'clock': return <svg {...common}><circle cx="10" cy="10" r="7"/><path d="M10 6v4l3 2"/></svg>;
    case 'moon': return <svg {...common}><path d="M16 12A7 7 0 0 1 8 4a6 6 0 1 0 8 8Z"/></svg>;
    case 'sun': return <svg {...common}><circle cx="10" cy="10" r="3.5"/><path d="M10 2v1.5M10 16.5V18M2 10h1.5M16.5 10H18M4.5 4.5l1 1M14.5 14.5l1 1M4.5 15.5l1-1M14.5 5.5l1-1"/></svg>;
    case 'sliders': return <svg {...common}><path d="M3 6h10M3 14h6"/><circle cx="15" cy="6" r="2"/><circle cx="11" cy="14" r="2"/><path d="M13 14h4"/></svg>;
    case 'sparkle': return <svg {...common}><path d="M10 3l1.5 4.5L16 9l-4.5 1.5L10 15l-1.5-4.5L4 9l4.5-1.5L10 3ZM4 3l.6 1.4L6 5l-1.4.6L4 7l-.6-1.4L2 5l1.4-.6L4 3Z"/></svg>;
    case 'filter': return <svg {...common}><path d="M3 4h14l-5 7v5l-4-2v-3L3 4Z"/></svg>;
    case 'sort': return <svg {...common}><path d="M6 4v12M6 16l-3-3M6 4l-3 3M14 4v12M14 4l3 3M14 16l3-3"/></svg>;
    case 'dot': return <svg {...common}><circle cx="10" cy="10" r="3" fill="currentColor"/></svg>;
    case 'chevron-right': return <svg {...common}><path d="M8 5l5 5-5 5"/></svg>;
    case 'chevron-down': return <svg {...common}><path d="M5 8l5 5 5-5"/></svg>;
    case 'plane': return <svg {...common}><path d="M10 3l1 6 6 2-6 2-1 4-1-4-3-1 1-1 3-2-1-6Z"/></svg>;
    case 'signal': return <svg {...common}><path d="M3 15v-2M7 15v-5M11 15v-8M15 15v-11"/></svg>;
    case 'file': return <svg {...common}><path d="M5 3h7l4 4v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z"/><path d="M12 3v4h4"/></svg>;
    case 'link': return <svg {...common}><path d="M9 11a3 3 0 0 0 4 0l2-2a3 3 0 0 0-4-4l-1 1"/><path d="M11 9a3 3 0 0 0-4 0l-2 2a3 3 0 0 0 4 4l1-1"/></svg>;
    case 'alert': return <svg {...common}><path d="M10 3l8 14H2L10 3Z"/><path d="M10 8v4M10 14.5v.5"/></svg>;
    case 'users-plus': return <svg {...common}><circle cx="8" cy="8" r="2.5"/><path d="M3 16c.5-2.5 2.3-4 5-4M14 13v4M12 15h4"/></svg>;
    default: return <svg {...common}><circle cx="10" cy="10" r="7"/></svg>;
  }
}

Object.assign(window, { Icon });
