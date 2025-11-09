import { createFileRoute } from '@tanstack/react-router';
import { TicketDetail } from '../../../pages/TicketDetail';

export const Route = createFileRoute('/_protected/intake/tickets/$id')({
 component: TicketDetailPage,
});

function TicketDetailPage() {
 return <TicketDetail />;
}