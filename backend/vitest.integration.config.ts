import { defineConfig, mergeConfig } from 'vitest/config'
import baseConfig from './vitest.config'

const integrationConfig = mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      include: [
        'tests/contract/**/*.test.ts',
        'tests/contracts/**/*.test.ts',
        'tests/integration/**/*.test.ts',
        'tests/performance/**/*.test.ts',
      ],
      testTimeout: 60000,
      hookTimeout: 60000,
    },
  }),
)

integrationConfig.test = {
  ...integrationConfig.test,
  exclude: ['node_modules/', 'dist/'],
}

export default integrationConfig
