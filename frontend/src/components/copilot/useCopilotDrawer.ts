/**
 * useCopilotDrawer — open-state + dossier-context store for the copilot drawer (D-05).
 *
 * A tiny Zustand store (mirrors the dossier-drawer open pattern) so the three entry
 * points coordinate without prop-drilling:
 *   - the Topbar FAB (opens with no context),
 *   - the Cmd+K copilot row (opens, pre-filling the current dossier as readable
 *     context when launched from a dossier route — copilot-commands.ts),
 *   - the _protected mount (renders the single drawer instance).
 *
 * The context is the (already-accessible) dossier id + type only — never result
 * content. It scopes the copilot's answers to the open dossier (useCopilotReadable-style)
 * and is surfaced to the conversational surface as a system-readable hint.
 */
import { create } from 'zustand'
import type { DossierType } from '@/lib/dossier-type-guards'

export interface CopilotDossierContext {
  dossierId: string
  dossierType?: DossierType
}

interface CopilotDrawerState {
  open: boolean
  /** The dossier the drawer was opened on, if any (D-05 readable context). */
  context: CopilotDossierContext | null
  openCopilot: (context?: CopilotDossierContext | null) => void
  closeCopilot: () => void
}

export const useCopilotDrawer = create<CopilotDrawerState>((set) => ({
  open: false,
  context: null,
  openCopilot: (context = null): void => set({ open: true, context }),
  closeCopilot: (): void => set({ open: false }),
}))
