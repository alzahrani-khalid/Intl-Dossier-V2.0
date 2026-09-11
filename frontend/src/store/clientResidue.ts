const CLIENT_PREFERENCE_ALLOWLIST = new Set([
  'id.locale',
  'id.theme',
  'id.density',
  'id.dir',
  'i18nextLng',
])

/**
 * Remove user-bearing browser residue while retaining identity-neutral machine preferences.
 * Storage can be unavailable in private or embedded contexts; sign-out must still complete.
 */
export function clearClientResidue(): void {
  let storage: Storage
  let keys: string[]

  try {
    storage = window.localStorage
    keys = Array.from({ length: storage.length }, (_, index) => storage.key(index)).filter(
      (key): key is string => key !== null,
    )
  } catch {
    return
  }

  for (const key of keys) {
    if (!CLIENT_PREFERENCE_ALLOWLIST.has(key)) {
      try {
        storage.removeItem(key)
      } catch {
        // Keep attempting the remaining keys; teardown must be best-effort and non-throwing.
      }
    }
  }
}
