/**
 * Contact Create Route
 * Part of: 027-contact-directory implementation
 *
 * Route: /contacts/create
 * Manual contact entry form
 */

import { createFileRoute } from '@tanstack/react-router';
import { ContactCreate } from '@/pages/contacts/ContactCreate';

export const Route = createFileRoute('/_protected/contacts/create')({
 component: ContactCreate,
 meta: () => [
 {
 title: 'Create Contact - GASTAT',
 },
 ],
});
