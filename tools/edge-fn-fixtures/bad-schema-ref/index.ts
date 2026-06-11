// Positive-failure fixture for scripts/check-edge-fn-schema-refs.mjs.
//
// This file lives OUTSIDE supabase/functions so the normal smoke test never
// scans it (the real-tree run stays green). The dedicated CI positive-failure
// step invokes the script with bash negation pointed at THIS directory and
// asserts a non-zero exit — proving the guard actually catches drift.
//
// Both planted references below name objects that do not exist in
// frontend/src/types/database.types.ts, so the check must flag both.

// @ts-nocheck — fixture is parsed as text by the smoke test, never compiled.
declare const supabase: any

export async function plantedBadReferences(): Promise<void> {
  // Unknown RPC — must be reported as an unknown function.
  await supabase.rpc('nonexistent_fn_xyz').select()

  // Unknown table — must be reported as an unknown table/view.
  await supabase.from('nonexistent_table_xyz').select('*')
}
