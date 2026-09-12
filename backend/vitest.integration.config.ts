import { defineConfig, mergeConfig } from 'vitest/config'
import baseConfig from './vitest.config'

const integrationConfig = mergeConfig(
  baseConfig,
  defineConfig({
    test: {
      testTimeout: 60000,
      hookTimeout: 60000,
    },
  }),
)

integrationConfig.test = {
  ...integrationConfig.test,
  // Source: CI run 31848669701, job 94920141442 (the 31 files that passed).
  // mergeConfig concatenates include arrays, which leaked the base-config files into
  // integration discovery. D-3 RESOLVED option (c), Phase 101 - the 204 excluded files
  // are integration-in-name-only until option (a) (supabase start in CI) is funded.
  include: [
    'src/utils/__tests__/validation.test.ts',
    'tests/contract/ai-extract-status.test.ts',
    'tests/contract/ai-extract.test.ts',
    'tests/contract/pdf-generate.test.ts',
    'tests/deadline-checker.test.ts',
    'tests/digest-scheduler.test.ts',
    'tests/email-notifications.test.ts',
    'tests/intelligence/alert-fanout.integration.test.ts',
    'tests/intelligence/alert-rules.test.ts',
    'tests/intelligence/channel-adapter.test.ts',
    'tests/intelligence/digest-cron.integration.test.ts',
    'tests/intelligence/generate-digest.integration.test.ts',
    'tests/intelligence/subscriptions.test.ts',
    'tests/intelligence/webhook-payload-contract.test.ts',
    'tests/notification-queue.test.ts',
    'tests/push-notifications.test.ts',
    'tests/services/interaction-note-service.test.ts',
    'tests/unit/ai-briefs-manual.test.ts',
    'tests/unit/auth.service.test.ts',
    'tests/unit/auto-assignment-scoring.test.ts',
    'tests/unit/brief-generator-jwt.test.ts',
    'tests/unit/intake-linker-jwt.test.ts',
    'tests/unit/mfa-crypto.test.ts',
    'tests/unit/queue-processing.test.ts',
    'tests/unit/rate-limit.service.test.ts',
    'tests/unit/reembed-rag-chunks.test.ts',
    'tests/unit/reporting.service.test.ts',
    'tests/unit/search.service.test.ts',
    'tests/unit/sla-calculation.test.ts',
    'tests/unit/validation.test.ts',
    'tests/unit/vector.service.test.ts',
  ],
  exclude: ['node_modules/', 'dist/'],
}

export default integrationConfig
