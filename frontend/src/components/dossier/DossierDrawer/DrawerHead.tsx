/**
 * DrawerHead — Wave 0 stub. Wave 1 (plan 41-02) replaces this body with the
 * full chip row + drawer-title + DrawerMetaStrip + DrawerCtaRow per
 * /tmp/inteldossier-handoff/.../pages.jsx#L482-505.
 *
 * Stays intentionally tiny: chip placeholder + close button (44x44) + skeleton title.
 */
import type * as React from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'

export interface DrawerHeadProps {
  dossierId: string
  dossierType: string
  onClose: () => void
}

export function DrawerHead(props: DrawerHeadProps): React.JSX.Element {
  const { onClose } = props
  const { t } = useTranslation('dossier-drawer')
  return (
    <div className="drawer-head">
      <div className="flex items-center justify-between mb-2">
        <span className="chip">{t('chip.dossier')}</span>
        <button
          type="button"
          className="btn-ghost"
          style={{ minBlockSize: 44, minInlineSize: 44 }}
          onClick={onClose}
          aria-label={t('cta.close')}
        >
          <X size={14} />
        </button>
      </div>
      <div className="drawer-title" data-loading="true">
        &nbsp;
      </div>
    </div>
  )
}
