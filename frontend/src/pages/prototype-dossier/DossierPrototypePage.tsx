import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { DossierSidebar } from './DossierSidebar'
import { cn } from '@/lib/utils'

type SkeletonSection = {
  id: string
  titleWidth: string
  lines: string[]
}

type SkeletonHighlight = {
  id: string
  headerWidth: string
  lines: string[]
}

export function DossierPrototypePage() {
  const { t, i18n } = useTranslation()
  const direction = i18n.dir()
  const isRTL = direction === 'rtl'

  const skeletonSections = useMemo<SkeletonSection[]>(
    () => [
      {
        id: 'context',
        titleWidth: 'w-48',
        lines: ['w-11/12', 'w-3/4', 'w-2/3'],
      },
      {
        id: 'performance',
        titleWidth: 'w-56',
        lines: ['w-full', 'w-5/6', 'w-2/3', 'w-1/2'],
      },
      {
        id: 'signals',
        titleWidth: 'w-40',
        lines: ['w-4/5', 'w-3/5', 'w-2/3'],
      },
    ],
    []
  )

  const insightHighlights = useMemo<SkeletonHighlight[]>(
    () => [
      {
        id: 'conversion',
        headerWidth: 'w-24',
        lines: ['w-4/5', 'w-3/5'],
      },
      {
        id: 'pipeline',
        headerWidth: 'w-28',
        lines: ['w-3/4', 'w-2/3'],
      },
      {
        id: 'activity',
        headerWidth: 'w-20',
        lines: ['w-2/3', 'w-1/2'],
      },
    ],
    []
  )

  return (
    <div
      dir={direction}
      className="min-h-screen bg-gradient-to-br from-[#d5d8df] via-[#dadedf] to-[#c8ccd4] px-4 py-8 sm:px-8 sm:py-10 lg:px-12 lg:py-14"
    >
      <div
        className={cn(
          'relative mx-auto w-full max-w-[1200px] overflow-visible rounded-[36px] border border-white/50 bg-white/75 p-5 shadow-[0_70px_120px_-65px_rgba(15,23,42,0.45)] backdrop-blur-2xl sm:p-8 lg:h-[780px]'
        )}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-6 top-6 hidden h-[92%] rounded-[40px] bg-white/55 shadow-[0_55px_120px_-75px_rgba(15,23,42,0.65)] blur-[1px] lg:block lg:z-0"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-12 top-12 hidden h-[88%] rounded-[40px] bg-white/45 shadow-[0_55px_120px_-80px_rgba(15,23,42,0.55)] lg:block lg:z-0"
        />

        <div
          className={cn(
            'relative z-10 flex w-full flex-col gap-6 lg:h-full lg:gap-0',
            isRTL ? 'lg:flex-row-reverse' : 'lg:flex-row'
          )}
        >
          <div className="relative z-10 flex-shrink-0">
            <DossierSidebar />
          </div>

          <section
            className={cn(
              'relative z-10 flex flex-1 items-stretch rounded-[28px] bg-neutral-50/80 p-6 sm:p-8 lg:p-12',
              'shadow-[0_45px_80px_-60px_rgba(15,23,42,0.38)]',
              isRTL ? 'lg:rounded-l-[32px] lg:rounded-r-none' : 'lg:rounded-r-[32px] lg:rounded-l-none'
            )}
          >
            <div className="flex h-full w-full items-center justify-center">
              <div
                className={cn(
                  'w-full rounded-[24px] border border-white/60 bg-white/95 p-6 sm:p-10 lg:h-full lg:max-w-[640px] lg:rounded-[32px]',
                  'shadow-[0_55px_100px_-60px_rgba(15,23,42,0.42)]'
                )}
                aria-label={t('dossier.prototype.placeholderBoard', 'Reports content canvas placeholder')}
              >
                <div className="flex h-full flex-col justify-between gap-10">
                  <div className="space-y-10">
                    <div className="space-y-3">
                      <div className="h-6 w-44 rounded-full bg-neutral-200/80" />
                      <div className="h-4 w-64 rounded-full bg-neutral-200/60 sm:w-72" />
                    </div>

                    {skeletonSections.map((section) => (
                      <div key={section.id} className="space-y-4">
                        <div className={cn('h-4 rounded-full bg-neutral-200/70', section.titleWidth)} />
                        <div className="space-y-3">
                          {section.lines.map((width, index) => (
                            <div
                              key={`${section.id}-line-${index}`}
                              className={cn('h-3 rounded-full bg-neutral-200/55 animate-pulse', width)}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-4 pt-4 sm:grid-cols-2">
                    {insightHighlights.map((item) => (
                      <div
                        key={item.id}
                        className="flex flex-col gap-3 rounded-2xl border border-neutral-100 bg-neutral-50/80 p-5 shadow-[0_30px_45px_-40px_rgba(15,23,42,0.45)]"
                      >
                        <div className={cn('h-3 rounded-full bg-neutral-200/70', item.headerWidth)} />
                        <div className="space-y-2">
                          {item.lines.map((width, index) => (
                            <div
                              key={`${item.id}-detail-${index}`}
                              className={cn('h-2.5 rounded-full bg-neutral-200/50 animate-pulse', width)}
                            />
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-8 left-1/2 hidden -translate-x-1/2 items-center gap-4 rounded-[32px] border border-white/40 bg-white/70 px-6 py-3 shadow-[0_55px_120px_-70px_rgba(15,23,42,0.6)] backdrop-blur-lg lg:flex lg:z-0"
        >
          <div className="flex items-center gap-3">
            <div className="h-12 w-24 rounded-2xl bg-neutral-200/70" />
            <div className="h-12 w-24 rounded-2xl bg-neutral-200/60" />
            <div className="h-12 w-24 rounded-2xl bg-neutral-200/50" />
          </div>
        </div>

        <div
          aria-hidden
          className={cn(
            'pointer-events-none absolute bottom-6 hidden items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-xs font-semibold text-white shadow-[0_24px_45px_-28px_rgba(15,23,42,0.65)] lg:flex lg:z-20',
            isRTL ? 'left-6' : 'right-6'
          )}
        >
          <span className="inline-flex h-3 w-3 items-center justify-center rounded-full bg-lime-400" />
          <span>TanStack Query Live</span>
        </div>
      </div>
    </div>
  )
}






