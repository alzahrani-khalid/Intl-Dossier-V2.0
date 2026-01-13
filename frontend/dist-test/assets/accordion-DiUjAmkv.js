import { r, j as a } from './react-vendor-Buoak6m3.js'
import { aJ as d, aK as m, aL as l, aM as i, aN as f, aO as c } from './ui-vendor-DTR9u_Vg.js'
import { c as n } from './index-qYY0KoZ1.js'
const w = d,
  p = r.forwardRef(({ className: e, ...s }, t) =>
    a.jsx(m, { ref: t, className: n('border-b', e), ...s }),
  )
p.displayName = 'AccordionItem'
const x = r.forwardRef(({ className: e, children: s, ...t }, o) =>
  a.jsx(l, {
    className: 'flex',
    children: a.jsxs(i, {
      ref: o,
      className: n(
        'flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all hover:underline text-left [&[data-state=open]>svg]:rotate-180',
        e,
      ),
      ...t,
      children: [
        s,
        a.jsx(f, {
          className: 'h-4 w-4 shrink-0 text-muted-foreground transition-transform duration-200',
        }),
      ],
    }),
  }),
)
x.displayName = i.displayName
const N = r.forwardRef(({ className: e, children: s, ...t }, o) =>
  a.jsx(c, {
    ref: o,
    className:
      'overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down',
    ...t,
    children: a.jsx('div', { className: n('pb-4 pt-0', e), children: s }),
  }),
)
N.displayName = c.displayName
export { w as A, p as a, x as b, N as c }
//# sourceMappingURL=accordion-DiUjAmkv.js.map
