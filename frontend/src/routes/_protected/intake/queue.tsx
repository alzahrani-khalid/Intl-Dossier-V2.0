import { createFileRoute } from '@tanstack/react-router';
import { Queue } from '../../../pages/Queue';

export const Route = createFileRoute('/_protected/intake/queue')({
  component: QueuePage,
});

function QueuePage() {
  return <Queue />;
}