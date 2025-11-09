/**
 * Positions Library Index Route (T055)
 * Renders the main positions list page
 */

import { createFileRoute } from '@tanstack/react-router';
import { PositionsLibraryPage } from '../positions';

export const Route = createFileRoute('/_protected/positions/')({
 component: PositionsLibraryPage,
});
