/**
 * Contact Details Route
 * Part of: 027-contact-directory implementation
 *
 * Route: /contacts/:contactId
 * Displays full contact details with edit/archive actions
 */

import { createFileRoute } from '@tanstack/react-router';
import { ContactDetails } from '@/pages/contacts/ContactDetails';

export const Route = createFileRoute('/_protected/contacts/$contactId')({
 component: ContactDetails,
 meta: ({ params }) => [
 {
 title: `Contact Details - ${params.contactId} - GASTAT`,
 },
 ],
});
