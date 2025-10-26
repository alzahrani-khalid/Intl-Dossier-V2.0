/**
 * Notes Search Route
 * Part of: 027-contact-directory Phase 7 implementation
 *
 * Route: /contacts/notes-search
 * Global search page for interaction notes across all contacts
 */

import { createFileRoute } from '@tanstack/react-router';
import { NotesSearch } from '@/pages/contacts/NotesSearch';

export const Route = createFileRoute('/_protected/contacts/notes-search')({
  component: NotesSearch,
  meta: () => [
    {
      title: 'Search Interaction Notes - GASTAT',
    },
  ],
});
