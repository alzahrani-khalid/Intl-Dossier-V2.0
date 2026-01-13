import { u as S, r as c, j as s } from './react-vendor-Buoak6m3.js'
import { u as I, a as E } from './useIntakeApi-84Q7PHHY.js'
const V = ({
  attachmentIds: x,
  onChange: f,
  maxFileSize: z = 25 * 1024 * 1024,
  maxTotalSize: g = 100 * 1024 * 1024,
  maxFiles: h = 10,
  acceptedTypes: v = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/png',
    'image/jpeg',
    'image/jpg',
  ],
}) => {
  const { t: l } = S('intake'),
    j = c.useRef(null),
    [i, d] = c.useState([]),
    [w, u] = c.useState(!1),
    [y, N] = c.useState(null),
    M = I(),
    D = E(),
    b = c.useCallback(() => i.reduce((e, t) => e + t.file.size, 0), [i]),
    p = (e) => {
      if (e === 0) return '0 Bytes'
      const t = 1024,
        n = ['Bytes', 'KB', 'MB', 'GB'],
        a = Math.floor(Math.log(e) / Math.log(t))
      return Math.round((e / Math.pow(t, a)) * 100) / 100 + ' ' + n[a]
    },
    A = (e) =>
      v.includes(e.type)
        ? e.size > z
          ? l('intake.validation.fileTooLarge')
          : b() + e.size > g
            ? l('intake.validation.totalSizeExceeded')
            : i.length >= h
              ? `Maximum ${h} files allowed`
              : null
        : l('intake.validation.unsupportedFileType'),
    C = async (e) => {
      try {
        d((o) => o.map((r) => (r.id === e.id ? { ...r, status: 'uploading', progress: 0 } : r)))
        const t = new FormData()
        t.append('file', e.file)
        const n = setInterval(() => {
            d((o) =>
              o.map((r) =>
                r.id === e.id && r.progress < 90 ? { ...r, progress: r.progress + 10 } : r,
              ),
            )
          }, 200),
          a = await M.mutateAsync(t)
        ;(clearInterval(n),
          d((o) =>
            o.map((r) =>
              r.id === e.id ? { ...r, status: 'success', progress: 100, uploadedId: a.id } : r,
            ),
          ),
          f([...x, a.id]))
      } catch (t) {
        d((n) =>
          n.map((a) =>
            a.id === e.id
              ? { ...a, status: 'error', error: t.message || l('intake.error.message') }
              : a,
          ),
        )
      }
    },
    k = (e) => {
      if (!e || e.length === 0) return
      N(null)
      const t = Array.from(e)
      for (const n of t) {
        const a = A(n)
        if (a) {
          N(a)
          return
        }
        const o = {
          id: `${Date.now()}-${Math.random()}`,
          file: n,
          progress: 0,
          status: 'uploading',
        }
        ;(d((r) => [...r, o]), C(o))
      }
    },
    m = (e) => {
      ;(e.preventDefault(),
        e.stopPropagation(),
        e.type === 'dragenter' || e.type === 'dragover' ? u(!0) : e.type === 'dragleave' && u(!1))
    },
    L = (e) => {
      ;(e.preventDefault(),
        e.stopPropagation(),
        u(!1),
        e.dataTransfer.files && e.dataTransfer.files.length > 0 && k(e.dataTransfer.files))
    },
    B = (e) => {
      ;(e.preventDefault(), e.target.files && e.target.files.length > 0 && k(e.target.files))
    },
    R = async (e) => {
      if (e.uploadedId)
        try {
          ;(await D.mutateAsync(e.uploadedId), f(x.filter((t) => t !== e.uploadedId)))
        } catch (t) {
          console.error('Failed to delete attachment:', t)
        }
      d((t) => t.filter((n) => n.id !== e.id))
    },
    T = () => {
      j.current?.click()
    }
  return s.jsxs('div', {
    className: 'space-y-4',
    children: [
      s.jsxs('div', {
        children: [
          s.jsx('label', {
            className: 'mb-2 block text-sm font-medium text-gray-700',
            children: l('intake.form.attachments.label'),
          }),
          s.jsx('p', {
            className: 'mb-3 text-xs text-gray-500',
            children: l('intake.form.attachments.description'),
          }),
        ],
      }),
      s.jsxs('div', {
        className: `relative rounded-lg border-2 border-dashed p-8 text-center transition-colors ${w ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}`,
        onDragEnter: m,
        onDragLeave: m,
        onDragOver: m,
        onDrop: L,
        children: [
          s.jsx('input', {
            ref: j,
            type: 'file',
            multiple: !0,
            accept: v.join(','),
            onChange: B,
            className: 'hidden',
          }),
          s.jsxs('div', {
            className: 'space-y-2',
            children: [
              s.jsx('svg', {
                className: 'mx-auto size-12 text-gray-400',
                stroke: 'currentColor',
                fill: 'none',
                viewBox: '0 0 48 48',
                'aria-hidden': 'true',
                children: s.jsx('path', {
                  d: 'M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02',
                  strokeWidth: 2,
                  strokeLinecap: 'round',
                  strokeLinejoin: 'round',
                }),
              }),
              s.jsx('div', {
                className: 'text-sm text-gray-600',
                children: s.jsx('button', {
                  type: 'button',
                  onClick: T,
                  className:
                    'font-medium text-blue-600 hover:text-blue-500 focus:underline focus:outline-none',
                  children: l('intake.form.attachments.dropzone'),
                }),
              }),
              s.jsx('p', {
                className: 'text-xs text-gray-500',
                children: l('intake.form.attachments.maxSize'),
              }),
              s.jsx('p', {
                className: 'text-xs text-gray-500',
                children: l('intake.form.attachments.maxTotal'),
              }),
              s.jsx('p', {
                className: 'text-xs text-gray-500',
                children: l('intake.form.attachments.supportedFormats'),
              }),
            ],
          }),
        ],
      }),
      y &&
        s.jsx('div', {
          className: 'rounded-md border border-red-200 bg-red-50 p-3',
          children: s.jsx('p', { className: 'text-sm text-red-800', children: y }),
        }),
      i.length > 0 &&
        s.jsxs('div', {
          className: 'space-y-2',
          children: [
            i.map((e) =>
              s.jsxs(
                'div',
                {
                  className:
                    'flex items-center justify-between rounded-md border border-gray-200 bg-gray-50 p-3',
                  children: [
                    s.jsxs('div', {
                      className: 'min-w-0 flex-1',
                      children: [
                        s.jsxs('div', {
                          className: 'flex items-center space-x-3',
                          children: [
                            s.jsx('div', {
                              className: 'shrink-0',
                              children:
                                e.status === 'success'
                                  ? s.jsx('svg', {
                                      className: 'size-5 text-green-500',
                                      fill: 'currentColor',
                                      viewBox: '0 0 20 20',
                                      children: s.jsx('path', {
                                        fillRule: 'evenodd',
                                        d: 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z',
                                        clipRule: 'evenodd',
                                      }),
                                    })
                                  : e.status === 'error'
                                    ? s.jsx('svg', {
                                        className: 'size-5 text-red-500',
                                        fill: 'currentColor',
                                        viewBox: '0 0 20 20',
                                        children: s.jsx('path', {
                                          fillRule: 'evenodd',
                                          d: 'M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z',
                                          clipRule: 'evenodd',
                                        }),
                                      })
                                    : s.jsxs('svg', {
                                        className: 'size-5 animate-spin text-blue-500',
                                        viewBox: '0 0 24 24',
                                        children: [
                                          s.jsx('circle', {
                                            className: 'opacity-25',
                                            cx: '12',
                                            cy: '12',
                                            r: '10',
                                            stroke: 'currentColor',
                                            strokeWidth: '4',
                                            fill: 'none',
                                          }),
                                          s.jsx('path', {
                                            className: 'opacity-75',
                                            fill: 'currentColor',
                                            d: 'M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z',
                                          }),
                                        ],
                                      }),
                            }),
                            s.jsxs('div', {
                              className: 'min-w-0 flex-1',
                              children: [
                                s.jsx('p', {
                                  className: 'truncate text-sm font-medium text-gray-900',
                                  children: e.file.name,
                                }),
                                s.jsxs('p', {
                                  className: 'text-xs text-gray-500',
                                  children: [
                                    p(e.file.size),
                                    e.status === 'uploading' && ` - ${e.progress}%`,
                                  ],
                                }),
                                e.error &&
                                  s.jsx('p', {
                                    className: 'mt-1 text-xs text-red-600',
                                    children: e.error,
                                  }),
                              ],
                            }),
                          ],
                        }),
                        e.status === 'uploading' &&
                          s.jsx('div', {
                            className: 'mt-2',
                            children: s.jsx('div', {
                              className: 'h-1.5 w-full rounded-full bg-gray-200',
                              children: s.jsx('div', {
                                className:
                                  'h-1.5 rounded-full bg-blue-600 transition-all duration-300',
                                style: { width: `${e.progress}%` },
                              }),
                            }),
                          }),
                      ],
                    }),
                    s.jsx('button', {
                      type: 'button',
                      onClick: () => R(e),
                      className: 'ms-3 shrink-0 text-gray-400 transition-colors hover:text-red-500',
                      disabled: e.status === 'uploading',
                      children: s.jsx('svg', {
                        className: 'size-5',
                        fill: 'currentColor',
                        viewBox: '0 0 20 20',
                        children: s.jsx('path', {
                          fillRule: 'evenodd',
                          d: 'M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z',
                          clipRule: 'evenodd',
                        }),
                      }),
                    }),
                  ],
                },
                e.id,
              ),
            ),
            s.jsxs('div', {
              className: 'flex justify-between pt-2 text-xs text-gray-500',
              children: [
                s.jsxs('span', { children: [i.length, ' ', i.length === 1 ? 'file' : 'files'] }),
                s.jsxs('span', { children: ['Total: ', p(b()), ' / ', p(g)] }),
              ],
            }),
          ],
        }),
    ],
  })
}
export { V as A }
//# sourceMappingURL=AttachmentUploader-DnTiValP.js.map
