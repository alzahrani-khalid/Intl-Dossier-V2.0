import React from 'react'
import { cn } from '@/lib/utils'
import { motion } from 'framer-motion'

export interface DossierTab {
  id: string
  label: string
  disabled?: boolean
  badge?: React.ReactNode
}

interface DossierTabsProps {
  tabs: DossierTab[]
  activeTab: string
  onTabChange: (tabId: string) => void
  className?: string
  ariaLabel?: string
}

export function DossierTabs({
  tabs,
  activeTab,
  onTabChange,
  className,
  ariaLabel = 'Dossier sections',
}: DossierTabsProps) {
  return (
    <div className={cn('bg-card rounded-xl border border-border/50 shadow-sm', className)}>
      <div className="relative">
        <nav
          className="flex overflow-x-auto scrollbar-hide px-2 sm:px-4"
          aria-label={ariaLabel}
          role="tablist"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => !tab.disabled && onTabChange(tab.id)}
                disabled={tab.disabled}
                role="tab"
                aria-selected={isActive}
                className={cn(
                  'relative flex-shrink-0 min-h-[48px] py-3 px-3 sm:px-5 text-sm font-medium transition-colors outline-none select-none',
                  isActive
                    ? 'text-primary'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-t-md',
                  tab.disabled && 'opacity-50 cursor-not-allowed',
                )}
              >
                <span className="relative z-10 flex items-center gap-2">
                  {tab.label}
                  {tab.badge}
                </span>

                {isActive && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-x-0 bottom-0 h-0.5 bg-primary"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
              </button>
            )
          })}
        </nav>
      </div>
    </div>
  )
}
