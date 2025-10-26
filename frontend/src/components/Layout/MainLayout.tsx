import type { ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';
import { useNavigate } from '@tanstack/react-router';
import { NavigationShell } from '@/components/modern-nav';
import { useAuthStore } from '@/store/authStore';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const handleLogout = async () => {
    await logout();
    navigate({ to: '/login' });
  };

  return (
    <>
      <NavigationShell
        userName={user?.name || 'User'}
        userEmail={user?.email || ''}
        onLogout={handleLogout}
        defaultPanelOpen={true}
      >
        {children}
      </NavigationShell>
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'var(--toast-bg)',
            color: 'var(--toast-color)',
          },
        }}
      />
    </>
  );
}
