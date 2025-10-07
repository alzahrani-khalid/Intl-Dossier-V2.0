import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/_protected/intake')({
  component: IntakeLayout,
});

function IntakeLayout() {
  return (
    <div className="intake-layout">
      <Outlet />
    </div>
  );
}