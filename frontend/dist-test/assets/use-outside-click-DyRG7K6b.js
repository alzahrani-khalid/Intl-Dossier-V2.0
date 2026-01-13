import { r as o } from './react-vendor-Buoak6m3.js'
const u = (e, n) => {
  o.useEffect(() => {
    const t = (r) => {
      !e.current || e.current.contains(r.target) || n()
    }
    return (
      document.addEventListener('mousedown', t),
      document.addEventListener('touchstart', t),
      () => {
        ;(document.removeEventListener('mousedown', t),
          document.removeEventListener('touchstart', t))
      }
    )
  }, [e, n])
}
export { u }
//# sourceMappingURL=use-outside-click-DyRG7K6b.js.map
