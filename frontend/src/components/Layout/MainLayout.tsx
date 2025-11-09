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
 {/* Mobile-first padding with space for fixed menu button on mobile */}
 <main className="flex-1 overflow-y-auto pt-16 px-4 pb-4 md:pt-6 md:px-6 md:pb-6 lg:p-8">
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
