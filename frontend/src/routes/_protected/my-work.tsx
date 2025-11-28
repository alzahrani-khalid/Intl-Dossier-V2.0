import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/_protected/my-work')({
  component: MyWorkLayout,
});

function MyWorkLayout() {
  return <Outlet />;
}
