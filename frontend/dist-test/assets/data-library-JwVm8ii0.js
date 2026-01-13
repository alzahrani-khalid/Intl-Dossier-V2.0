import { u as H, r as o, j as a } from './react-vendor-Buoak6m3.js'
import { a as R, d as K } from './tanstack-vendor-BZC-rs5U.js'
import {
  s as p,
  j as m,
  l as u,
  B as x,
  ae as W,
  k as v,
  o as w,
  I as G,
} from './index-qYY0KoZ1.js'
import {
  cM as Q,
  aH as f,
  cR as V,
  bP as J,
  b6 as X,
  cG as Y,
  cS as Z,
  ba as ee,
} from './vendor-misc-BiJvMP0A.js'
import { H as ae } from './date-vendor-s0MkYge4.js'
import './i18n-vendor-Coo-X0AG.js'
import './ui-vendor-DTR9u_Vg.js'
import './supabase-vendor-CTsC8ILD.js'
import './form-vendor-BX1BhTCI.js'
import './visualization-vendor-f5uYUx4I.js'
function se() {
  const { t: r, i18n: k } = H(),
    [n, z] = o.useState(''),
    [h, M] = o.useState('all'),
    [P, g] = o.useState(!1),
    [_, d] = o.useState({}),
    [i, L] = o.useState([]),
    D = k.language === 'ar',
    {
      data: c,
      isLoading: T,
      refetch: E,
    } = R({
      queryKey: ['data-library', n, h, i],
      queryFn: async () => {
        let e = p
          .from('data_library_items')
          .select(
            `
 *,
 uploaded_by:users!uploaded_by(full_name)
 `,
          )
          .order('created_at', { ascending: !1 })
        ;(n &&
          (e = e.or(
            `title_en.ilike.%${n}%,title_ar.ilike.%${n}%,description_en.ilike.%${n}%,description_ar.ilike.%${n}%`,
          )),
          h !== 'all' && (e = e.eq('category', h)),
          i.length > 0 && (e = e.contains('tags', i)))
        const { data: s, error: t } = await e
        if (t) throw t
        return s
      },
    }),
    j = K({
      mutationFn: async (e) => {
        const s = `${Date.now()}-${e.name}`,
          t = crypto.randomUUID()
        d((l) => ({ ...l, [t]: { fileName: e.name, progress: 0, status: 'uploading' } }))
        const { data: re, error: b } = await p.storage.from('data-library').upload(s, e, {
          onUploadProgress: (l) => {
            const O = (l.loaded / l.total) * 100
            d(($) => ({ ...$, [t]: { ...$[t], progress: O } }))
          },
        })
        if (b) throw (d((l) => ({ ...l, [t]: { ...l[t], status: 'error', error: b.message } })), b)
        const {
            data: { publicUrl: q },
          } = p.storage.from('data-library').getPublicUrl(s),
          { error: N } = await p
            .from('data_library_items')
            .insert({
              title_en: e.name.split('.')[0],
              title_ar: e.name.split('.')[0],
              file_url: q,
              file_type: e.name.split('.').pop() || 'unknown',
              file_size_bytes: e.size,
              mime_type: e.type,
              category: I(e.type),
              tags: [],
              is_public: !1,
            })
        if (N) throw (d((l) => ({ ...l, [t]: { ...l[t], status: 'error', error: N.message } })), N)
        return (d((l) => ({ ...l, [t]: { ...l[t], progress: 100, status: 'completed' } })), t)
      },
      onSuccess: () => {
        ;(E(),
          setTimeout(() => {
            d((e) => {
              const s = { ...e }
              return (
                Object.keys(s).forEach((t) => {
                  s[t].status === 'completed' && delete s[t]
                }),
                s
              )
            })
          }, 3e3))
      },
    }),
    I = (e) =>
      e.startsWith('image/')
        ? 'image'
        : e.startsWith('video/')
          ? 'video'
          : e.includes('spreadsheet') || e.includes('excel')
            ? 'dataset'
            : e.includes('pdf') || e.includes('document') || e.includes('text')
              ? 'document'
              : 'other',
    U = (e) =>
      e < 1024
        ? `${e} B`
        : e < 1024 * 1024
          ? `${(e / 1024).toFixed(1)} KB`
          : `${(e / (1024 * 1024)).toFixed(1)} MB`,
    C = (e) => {
      switch (e) {
        case 'document':
          return a.jsx(f, { className: 'h-5 w-5' })
        case 'dataset':
          return a.jsx(ee, { className: 'h-5 w-5' })
        case 'image':
          return a.jsx(Z, { className: 'h-5 w-5' })
        case 'video':
          return a.jsx(Y, { className: 'h-5 w-5' })
        default:
          return a.jsx(f, { className: 'h-5 w-5' })
      }
    },
    y = o.useCallback((e) => {
      ;(e.preventDefault(),
        e.stopPropagation(),
        e.type === 'dragenter' || e.type === 'dragover' ? g(!0) : e.type === 'dragleave' && g(!1))
    }, []),
    B = o.useCallback(
      (e) => {
        ;(e.preventDefault(),
          e.stopPropagation(),
          g(!1),
          Array.from(e.dataTransfer.files).forEach((t) => {
            if (t.size > 50 * 1024 * 1024) {
              alert(r('dataLibrary.fileTooLarge'))
              return
            }
            j.mutate(t)
          }))
      },
      [j, r],
    ),
    A = (e) => {
      Array.from(e.target.files || []).forEach((t) => {
        if (t.size > 50 * 1024 * 1024) {
          alert(r('dataLibrary.fileTooLarge'))
          return
        }
        j.mutate(t)
      })
    },
    F = ['all', 'document', 'dataset', 'image', 'video', 'other'],
    S = Array.from(new Set(c?.flatMap((e) => e.tags) || []))
  return a.jsxs('div', {
    className: 'container mx-auto py-6',
    children: [
      a.jsx('div', {
        className: 'flex justify-between items-center mb-6',
        children: a.jsx('h1', {
          className: 'text-3xl font-bold',
          children: r('navigation.dataLibrary'),
        }),
      }),
      a.jsx(m, {
        className: 'mb-6',
        children: a.jsxs(u, {
          className: 'p-6',
          children: [
            a.jsxs('div', {
              className: `border-2 border-dashed rounded-lg p-8 text-center transition-colors ${P ? 'border-primary bg-primary/5' : 'border-gray-300'}`,
              onDragEnter: y,
              onDragLeave: y,
              onDragOver: y,
              onDrop: B,
              children: [
                a.jsx(Q, { className: 'h-12 w-12 mx-auto mb-4 text-muted-foreground' }),
                a.jsx('p', {
                  className: 'text-lg font-medium mb-2',
                  children: r('dataLibrary.dragDropFiles'),
                }),
                a.jsx('p', {
                  className: 'text-sm text-muted-foreground mb-4',
                  children: r('dataLibrary.or'),
                }),
                a.jsxs('label', {
                  children: [
                    a.jsx('input', {
                      type: 'file',
                      multiple: !0,
                      className: 'hidden',
                      onChange: A,
                      accept: '*/*',
                    }),
                    a.jsx(x, {
                      variant: 'outline',
                      asChild: !0,
                      children: a.jsx('span', { children: r('dataLibrary.browseFiles') }),
                    }),
                  ],
                }),
                a.jsxs('p', {
                  className: 'text-xs text-muted-foreground mt-4',
                  children: [r('dataLibrary.maxFileSize'), ': 50MB'],
                }),
              ],
            }),
            Object.keys(_).length > 0 &&
              a.jsx('div', {
                className: 'mt-4 space-y-2',
                children: Object.entries(_).map(([e, s]) =>
                  a.jsxs(
                    'div',
                    {
                      className: 'flex items-center gap-4 p-3 bg-gray-50 rounded',
                      children: [
                        a.jsx(f, { className: 'h-5 w-5 text-muted-foreground' }),
                        a.jsxs('div', {
                          className: 'flex-1',
                          children: [
                            a.jsxs('div', {
                              className: 'flex justify-between mb-1',
                              children: [
                                a.jsx('span', {
                                  className: 'text-sm font-medium',
                                  children: s.fileName,
                                }),
                                a.jsxs('span', {
                                  className: 'text-sm text-muted-foreground',
                                  children: [
                                    s.status === 'uploading' && `${Math.round(s.progress)}%`,
                                    s.status === 'completed' && r('common.completed'),
                                    s.status === 'error' && r('common.error'),
                                  ],
                                }),
                              ],
                            }),
                            a.jsx(W, { value: s.progress, className: 'h-2' }),
                            s.error &&
                              a.jsx('p', {
                                className: 'text-xs text-red-600 mt-1',
                                children: s.error,
                              }),
                          ],
                        }),
                      ],
                    },
                    e,
                  ),
                ),
              }),
          ],
        }),
      }),
      a.jsxs('div', {
        className: 'grid gap-4 md:grid-cols-5 mb-6',
        children: [
          a.jsxs(m, {
            children: [
              a.jsxs(v, {
                className: 'flex flex-row items-center justify-between space-y-0 pb-2',
                children: [
                  a.jsx(w, {
                    className: 'text-sm font-medium',
                    children: r('dataLibrary.totalFiles'),
                  }),
                  a.jsx(f, { className: 'h-4 w-4 text-muted-foreground' }),
                ],
              }),
              a.jsx(u, {
                children: a.jsx('div', {
                  className: 'text-2xl font-bold',
                  children: c?.length || 0,
                }),
              }),
            ],
          }),
          F.slice(1).map((e) =>
            a.jsxs(
              m,
              {
                children: [
                  a.jsxs(v, {
                    className: 'flex flex-row items-center justify-between space-y-0 pb-2',
                    children: [
                      a.jsx(w, {
                        className: 'text-sm font-medium',
                        children: r(`dataLibrary.categories.${e}`),
                      }),
                      C(e),
                    ],
                  }),
                  a.jsx(u, {
                    children: a.jsx('div', {
                      className: 'text-2xl font-bold',
                      children: c?.filter((s) => s.category === e).length || 0,
                    }),
                  }),
                ],
              },
              e,
            ),
          ),
        ],
      }),
      a.jsxs(m, {
        className: 'mb-6',
        children: [
          a.jsx(v, { children: a.jsx(w, { children: r('common.filter') }) }),
          a.jsx(u, {
            children: a.jsxs('div', {
              className: 'space-y-4',
              children: [
                a.jsx('div', {
                  className: 'flex gap-4',
                  children: a.jsx('div', {
                    className: 'flex-1',
                    children: a.jsx(G, {
                      placeholder: r('dataLibrary.searchPlaceholder'),
                      value: n,
                      onChange: (e) => z(e.target.value),
                      className: 'w-full',
                    }),
                  }),
                }),
                a.jsxs('div', {
                  className: 'flex gap-2',
                  children: [
                    a.jsxs('span', {
                      className: 'text-sm text-muted-foreground mt-2',
                      children: [r('dataLibrary.category'), ':'],
                    }),
                    F.map((e) =>
                      a.jsx(
                        x,
                        {
                          variant: h === e ? 'default' : 'outline',
                          size: 'sm',
                          onClick: () => M(e),
                          children: r(e === 'all' ? 'common.all' : `dataLibrary.categories.${e}`),
                        },
                        e,
                      ),
                    ),
                  ],
                }),
                S.length > 0 &&
                  a.jsxs('div', {
                    className: 'flex gap-2 flex-wrap',
                    children: [
                      a.jsxs('span', {
                        className: 'text-sm text-muted-foreground',
                        children: [r('dataLibrary.tags'), ':'],
                      }),
                      S.map((e) =>
                        a.jsxs(
                          x,
                          {
                            variant: i.includes(e) ? 'default' : 'outline',
                            size: 'sm',
                            onClick: () => {
                              i.includes(e) ? L(i.filter((s) => s !== e)) : L([...i, e])
                            },
                            children: [a.jsx(V, { className: 'h-3 w-3 me-1' }), e],
                          },
                          e,
                        ),
                      ),
                    ],
                  }),
              ],
            }),
          }),
        ],
      }),
      a.jsx('div', {
        className: 'grid gap-4 md:grid-cols-3 lg:grid-cols-4',
        children: T
          ? a.jsx('div', {
              className: 'col-span-full text-center py-8',
              children: r('common.loading'),
            })
          : c && c.length > 0
            ? c.map((e) =>
                a.jsx(
                  m,
                  {
                    className: 'hover:shadow-lg transition-shadow',
                    children: a.jsxs(u, {
                      className: 'p-4',
                      children: [
                        a.jsxs('div', {
                          className: 'flex items-start justify-between mb-3',
                          children: [
                            C(e.category),
                            a.jsxs('div', {
                              className: 'flex gap-1',
                              children: [
                                a.jsx(x, {
                                  size: 'sm',
                                  variant: 'ghost',
                                  children: a.jsx(J, { className: 'h-4 w-4' }),
                                }),
                                a.jsx(x, {
                                  size: 'sm',
                                  variant: 'ghost',
                                  className: 'text-red-600',
                                  children: a.jsx(X, { className: 'h-4 w-4' }),
                                }),
                              ],
                            }),
                          ],
                        }),
                        a.jsx('h3', {
                          className: 'font-medium mb-1 line-clamp-2',
                          children: D ? e.title_ar : e.title_en,
                        }),
                        e.description_en &&
                          a.jsx('p', {
                            className: 'text-sm text-muted-foreground line-clamp-2 mb-2',
                            children: D ? e.description_ar : e.description_en,
                          }),
                        a.jsxs('div', {
                          className: 'space-y-1 text-xs text-muted-foreground',
                          children: [
                            a.jsx('div', { children: U(e.file_size_bytes) }),
                            a.jsx('div', { children: e.uploaded_by.full_name }),
                            a.jsx('div', { children: ae(new Date(e.created_at), 'dd MMM yyyy') }),
                            e.download_count > 0 &&
                              a.jsxs('div', {
                                children: [r('dataLibrary.downloads'), ': ', e.download_count],
                              }),
                          ],
                        }),
                        e.tags.length > 0 &&
                          a.jsx('div', {
                            className: 'flex flex-wrap gap-1 mt-2',
                            children: e.tags.map((s, t) =>
                              a.jsx(
                                'span',
                                {
                                  className:
                                    'inline-flex items-center px-2 py-0.5 bg-gray-100 rounded text-xs',
                                  children: s,
                                },
                                t,
                              ),
                            ),
                          }),
                      ],
                    }),
                  },
                  e.id,
                ),
              )
            : a.jsx('div', {
                className: 'col-span-full text-center py-8 text-muted-foreground',
                children: r('common.noData'),
              }),
      }),
    ],
  })
}
function te() {
  return a.jsx(se, {})
}
const pe = te
export { pe as component }
//# sourceMappingURL=data-library-JwVm8ii0.js.map
