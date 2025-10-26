/**
 * Contacts Directory Route - Main Index
 * Part of: 027-contact-directory implementation
 *
 * Route: /contacts
 * Displays the contact directory with search and filtering
 */

import { createFileRoute } from '@tanstack/react-router';
import { ContactsDirectory } from '@/pages/contacts/ContactsDirectory';

export const Route = createFileRoute('/_protected/contacts')({
  component: ContactsDirectory,
  meta: () => [
    {
      title: 'Contact Directory - GASTAT',
    },
  ],
});
