import { createFileRoute, Navigate } from '@tanstack/react-router';

export const Route = createFileRoute('/_protected/intake/')({
  component: IntakeIndex,
});

function IntakeIndex() {
  return <Navigate to="/intake/queue" />;
}
