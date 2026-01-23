/**
 * Temporary test file to verify barrel exports work correctly
 * This file will be deleted after verification
 */

// Test 1: Import multiple hooks from barrel export (using hooks that actually exist)
import {
  useAuth,
  useDossier,
  useToast,
  useFieldPermissions,
  useUnifiedWork,
  useCommitments,
  useIntakeApi,
  useTimeline,
  useUploadDocument,
  useDocuments,
  useOptimisticLocking,
  useResolveDossierContext,
  useAIChat,
  useSemanticSearch,
  useCalendar,
  usePresence,
  useDossierPresence,
  useActivityFeed,
  useAuditLogs,
  useAnalyticsDashboard,
} from '@/hooks';

// Test 2: Verify types are also exported
import type { DossierPresenceUser } from '@/hooks';

// Test 3: Test that we can use the imported hooks in code
export function testBarrelExportsWork() {
  // This function doesn't need to run, just needs to compile
  // TypeScript will verify all imports resolve correctly
  const hooks = {
    useAuth,
    useDossier,
    useToast,
    useFieldPermissions,
    useUnifiedWork,
    useCommitments,
    useIntakeApi,
    useTimeline,
    useUploadDocument,
    useDocuments,
    useOptimisticLocking,
    useResolveDossierContext,
    useAIChat,
    useSemanticSearch,
    useCalendar,
    usePresence,
    useDossierPresence,
    useActivityFeed,
    useAuditLogs,
    useAnalyticsDashboard,
  };

  // Type check
  const user: DossierPresenceUser = {} as DossierPresenceUser;

  return { hooks, user };
}

// Export count for verification
export const EXPORTED_HOOKS_COUNT = 20;
export const TESTING_COMPLETE = true;
