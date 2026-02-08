declare module 'deep-diff' {
  interface DiffBase {
    kind: string
    path?: (string | number)[]
    lhs?: unknown
    rhs?: unknown
    index?: number
    item?: DiffBase
  }

  export function diff(lhs: unknown, rhs: unknown): DiffBase[] | undefined
  export function applyChange(target: unknown, source: unknown, change: DiffBase): void
  export function revertChange(target: unknown, source: unknown, change: DiffBase): void
}
