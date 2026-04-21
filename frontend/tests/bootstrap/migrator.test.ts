import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, it } from 'vitest'

const BOOTSTRAP_PATH = resolve(__dirname, '../../public/bootstrap.js')
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _source = readFileSync(BOOTSTRAP_PATH, 'utf8')

describe.skip('bootstrap.js i18nextLng → id.locale migrator (THEME-02 / D-12)', () => {
  it.todo('T-34-02: migrator runs ONLY when id.locale is absent (does not overwrite)')
  it.todo('migrator copies legacy i18nextLng="ar" to id.locale when canonical is unset')
  it.todo('migrator copies legacy i18nextLng="en" to id.locale when canonical is unset')
  it.todo('migrator discards junk legacy value (e.g. "fr") — does not populate id.locale')
  it.todo('migrator removes i18nextLng after read (both success and junk paths)')
  it.todo('bootstrap sets documentElement.dir from id.locale (rtl for ar, ltr for en)')
  it.todo('bootstrap sets documentElement.dataset.classification from id.classif')
  it.todo('T-34-03: localStorage SecurityError does not throw the outer IIFE')
})
