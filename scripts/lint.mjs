import { spawnSync } from 'node:child_process'

const args = process.argv.slice(2).filter((arg) => arg !== '--')
const command = process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm'
const commandArgsList =
  args.length === 0
    ? [
        ['exec', 'turbo', 'run', 'lint'],
        ['exec', 'eslint', '-c', 'eslint.config.mjs', '--max-warnings', '0', 'frontend/tests/setup.ts'],
      ]
    : [['exec', 'eslint', '-c', 'eslint.config.mjs', '--max-warnings', '0', ...args]]

for (const commandArgs of commandArgsList) {
  const result = spawnSync(command, commandArgs, {
    stdio: 'inherit',
  })

  if (result.error) {
    throw result.error
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1)
  }
}
