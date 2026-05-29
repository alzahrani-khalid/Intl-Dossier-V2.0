import { useEffect } from 'react'

/**
 * Warns the user before leaving the page (tab close, reload, or browser-level
 * navigation) while a form has unsaved changes. Mirrors the `beforeunload`
 * pattern already used in `useAutoSaveForm`, extracted as a reusable primitive.
 *
 * Calling `preventDefault()` is the modern, spec-compliant way to trigger the
 * browser's native "Leave site?" confirmation; the dialog text itself is fixed
 * by the browser and cannot be customised.
 *
 * In-app (TanStack Router) navigation is intentionally NOT blocked here —
 * consumers that need an in-app "Discard changes?" prompt should render their
 * own dialog. This guard only covers browser-level unload.
 *
 * @param isDirty Whether the tracked form/state currently has unsaved changes.
 */
export function useUnsavedChangesGuard(isDirty: boolean): void {
  useEffect(() => {
    if (!isDirty) return undefined

    const handleBeforeUnload = (e: BeforeUnloadEvent): void => {
      e.preventDefault()
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return (): void => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])
}
