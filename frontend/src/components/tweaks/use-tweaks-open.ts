/**
 * useTweaksOpen — reads the TweaksDisclosure contract from context.
 *
 * Throws when called outside a `<TweaksDisclosureProvider>` so mis-wired
 * consumers (e.g. a stray SiteHeader gear rendered outside the provider)
 * fail loudly at mount, matching the design-system hook convention.
 */

import { useContext } from 'react'

import { TweaksDisclosureContext, type TweaksDisclosure } from './TweaksDisclosureProvider'

export function useTweaksOpen(): TweaksDisclosure {
  const ctx = useContext(TweaksDisclosureContext)
  if (!ctx) {
    throw new Error('useTweaksOpen must be used within a <TweaksDisclosureProvider>')
  }
  return ctx
}
