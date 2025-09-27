import type { ReactNode } from 'react'
import { Sidebar } from './Sidebar'
import { Toaster } from 'react-hot-toast'
import { Navigation } from '../Navigation'

interface MainLayoutProps {
  children: ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex min-h-screen bg-base-50 text-base-900 dark:bg-base-950 dark:text-base-25">
      <Sidebar />
      <div className="flex min-h-screen flex-1 flex-col">
        <Navigation />
        <main className="flex-1 overflow-y-auto bg-white/60 p-4 backdrop-blur dark:bg-base-900/60 md:p-6">
          <div className="mx-auto w-full max-w-7xl">{children}</div>
        </main>
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
    </div>
  )
}
