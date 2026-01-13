import { r as c, j as e } from './react-vendor-Buoak6m3.js'
import './vendor-misc-BiJvMP0A.js'
import './visualization-vendor-f5uYUx4I.js'
import './date-vendor-s0MkYge4.js'
async function l() {
  const n = await fetch('/accessibility/preferences', {
    headers: { Authorization: 'Bearer test-auth-token' },
  })
  if (!n.ok) throw new Error('failed')
  return n.json()
}
async function h(n) {
  const s = await fetch('/accessibility/preferences', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-auth-token' },
    body: JSON.stringify(n),
  })
  if (!s.ok) throw new Error('failed')
  return s.json()
}
function d() {
  const [n, s] = c.useState(null),
    [o, a] = c.useState(!1)
  c.useEffect(() => {
    l()
      .then(s)
      .catch(() =>
        s({
          high_contrast: !1,
          large_text: !1,
          reduce_motion: !1,
          screen_reader: !1,
          keyboard_only: !1,
          focus_indicators: 'default',
        }),
      )
  }, [])
  const r = async (t) => {
    a(!0)
    const i = await h(t)
    ;(s(i), a(!1))
  }
  return n
    ? e.jsxs('div', {
        style: { padding: 12 },
        children: [
          e.jsx('h3', { children: 'Accessibility Preferences' }),
          e.jsxs('label', {
            children: [
              e.jsx('input', {
                type: 'checkbox',
                checked: n.high_contrast,
                onChange: (t) => r({ high_contrast: t.target.checked }),
              }),
              ' High contrast',
            ],
          }),
          e.jsx('br', {}),
          e.jsxs('label', {
            children: [
              e.jsx('input', {
                type: 'checkbox',
                checked: n.large_text,
                onChange: (t) => r({ large_text: t.target.checked }),
              }),
              ' Large text',
            ],
          }),
          e.jsx('br', {}),
          e.jsxs('label', {
            children: [
              e.jsx('input', {
                type: 'checkbox',
                checked: n.reduce_motion,
                onChange: (t) => r({ reduce_motion: t.target.checked }),
              }),
              ' Reduce motion',
            ],
          }),
          e.jsx('br', {}),
          e.jsxs('label', {
            children: [
              e.jsx('input', {
                type: 'checkbox',
                checked: n.screen_reader,
                onChange: (t) => r({ screen_reader: t.target.checked }),
              }),
              ' Screen reader support',
            ],
          }),
          e.jsx('br', {}),
          e.jsxs('label', {
            children: [
              e.jsx('input', {
                type: 'checkbox',
                checked: n.keyboard_only,
                onChange: (t) => r({ keyboard_only: t.target.checked }),
              }),
              ' Keyboard only navigation',
            ],
          }),
          e.jsx('br', {}),
          e.jsxs('label', {
            children: [
              'Focus indicators: ',
              ' ',
              e.jsxs('select', {
                value: n.focus_indicators,
                onChange: (t) => r({ focus_indicators: t.target.value }),
                children: [
                  e.jsx('option', { value: 'default', children: 'Default' }),
                  e.jsx('option', { value: 'enhanced', children: 'Enhanced' }),
                  e.jsx('option', { value: 'none', children: 'None' }),
                ],
              }),
            ],
          }),
          o && e.jsx('div', { children: 'Saving…' }),
        ],
      })
    : e.jsx('div', { children: 'Loading accessibility settings…' })
}
const g = d
export { g as component }
//# sourceMappingURL=accessibility-Kk5GEinM.js.map
