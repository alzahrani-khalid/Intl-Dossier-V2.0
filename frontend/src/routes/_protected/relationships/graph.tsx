// TanStack Router route for Relationship Graph Page
// User Story 3: Traverse Entity Relationships as Graph
import { createFileRoute } from '@tanstack/react-router';
import { RelationshipGraphPage } from '@/pages/relationships/RelationshipGraphPage';

export const Route = createFileRoute('/_protected/relationships/graph')({
  component: RelationshipGraphPage,
  validateSearch: (search: Record<string, unknown>) => {
    return {
      dossierId: (search.dossierId as string) || undefined,
    };
  },
});
