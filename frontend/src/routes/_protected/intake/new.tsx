import { createFileRoute } from '@tanstack/react-router';
import { IntakeForm } from '../../../components/IntakeForm';

export const Route = createFileRoute('/_protected/intake/new')({
 component: NewIntakeTicket,
});

function NewIntakeTicket() {
 return (
 <div className="container mx-auto px-4 py-8">
 <IntakeForm />
 </div>
 );
}