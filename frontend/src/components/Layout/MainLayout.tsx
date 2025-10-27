import type { ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';
import { ProCollapsibleSidebarWrapper } from './ProCollapsibleSidebar';

interface MainLayoutProps {
 children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
 return (
 <>
 <div className="flex h-screen overflow-hidden bg-background">
 <ProCollapsibleSidebarWrapper>
 <main className="flex-1 overflow-y-auto">
 {children}
 </main>
 </ProCollapsibleSidebarWrapper>
 </div>
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
