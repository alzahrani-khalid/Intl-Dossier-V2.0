// POSITIVE-FAILURE FIXTURE for scripts/check-date-formatting.mjs — check 7.
// Deliberately violating. See relative-time.fixture.ts for the directory note.
//
// The offence: a 12-hour clock literal. Times render `14:30 GST` (24-hour, Gulf
// Standard Time) via formatTime — never `2:30 PM`.

declare function format(date: Date, pattern: string, options?: unknown): string

export function renderSlotTime(slotStart: Date): string {
  return format(slotStart, 'h:mm a')
}
