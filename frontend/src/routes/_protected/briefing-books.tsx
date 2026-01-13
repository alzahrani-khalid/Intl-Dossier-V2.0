/**
 * Briefing Books Route
 * Feature: briefing-book-generator
 *
 * Route: /briefing-books
 * Displays the briefing books management page.
 */

import { createFileRoute } from '@tanstack/react-router'
import BriefingBooksPage from '@/pages/briefing-books/BriefingBooksPage'

export const Route = createFileRoute('/_protected/briefing-books')({
  component: BriefingBooksPage,
})
