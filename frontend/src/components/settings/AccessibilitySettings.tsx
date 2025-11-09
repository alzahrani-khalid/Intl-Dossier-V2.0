import React, { useEffect, useState } from 'react'

type Prefs = {
 high_contrast: boolean
 large_text: boolean
 reduce_motion: boolean
 screen_reader: boolean
 keyboard_only: boolean
 focus_indicators: 'default' | 'enhanced' | 'none'
}

async function getPrefs(): Promise<Prefs> {
 const res = await fetch('/accessibility/preferences', { headers: { Authorization: 'Bearer test-auth-token' } })
 if (!res.ok) throw new Error('failed')
 return res.json()
}

async function savePrefs(p: Partial<Prefs>): Promise<Prefs> {
 const res = await fetch('/accessibility/preferences', {
 method: 'POST',
 headers: { 'Content-Type': 'application/json', Authorization: 'Bearer test-auth-token' },
 body: JSON.stringify(p)
 })
 if (!res.ok) throw new Error('failed')
 return res.json()
}

export default function AccessibilitySettings() {
 const [prefs, setPrefs] = useState<Prefs | null>(null)
 const [saving, setSaving] = useState(false)
 useEffect(() => {
 getPrefs().then(setPrefs).catch(() => setPrefs({
 high_contrast: false, large_text: false, reduce_motion: false, screen_reader: false, keyboard_only: false, focus_indicators: 'default'
 }))
 }, [])

 const update = async (patch: Partial<Prefs>) => {
 setSaving(true)
 const next = await savePrefs(patch)
 setPrefs(next)
 setSaving(false)
 }

 if (!prefs) return <div>Loading accessibility settings…</div>

 return (
 <div style={{ padding: 12 }}>
 <h3>Accessibility Preferences</h3>
 <label><input type="checkbox" checked={prefs.high_contrast} onChange={e => update({ high_contrast: e.target.checked })} /> High contrast</label><br />
 <label><input type="checkbox" checked={prefs.large_text} onChange={e => update({ large_text: e.target.checked })} /> Large text</label><br />
 <label><input type="checkbox" checked={prefs.reduce_motion} onChange={e => update({ reduce_motion: e.target.checked })} /> Reduce motion</label><br />
 <label><input type="checkbox" checked={prefs.screen_reader} onChange={e => update({ screen_reader: e.target.checked })} /> Screen reader support</label><br />
 <label><input type="checkbox" checked={prefs.keyboard_only} onChange={e => update({ keyboard_only: e.target.checked })} /> Keyboard only navigation</label><br />
 <label>
 Focus indicators: {' '}
 <select value={prefs.focus_indicators} onChange={e => update({ focus_indicators: e.target.value as any })}>
 <option value="default">Default</option>
 <option value="enhanced">Enhanced</option>
 <option value="none">None</option>
 </select>
 </label>
 {saving && <div>Saving…</div>}
 </div>
 )
}

