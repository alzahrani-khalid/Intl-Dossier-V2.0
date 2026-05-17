import type { ReactElement, ReactNode } from 'react'
import { render } from '@testing-library/react'
import type { RenderResult } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { LanguageProvider } from '@/components/language-provider/language-provider'

function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
        retry: false,
      },
    },
  })
}

export function renderWithProviders(
  ui: ReactElement,
  options?: { queryClient?: QueryClient },
): RenderResult {
  const client = options?.queryClient ?? createTestQueryClient()

  return render(ui, {
    wrapper: ({ children }: { children: ReactNode }) => (
      <QueryClientProvider client={client}>
        <LanguageProvider>{children}</LanguageProvider>
      </QueryClientProvider>
    ),
  })
}

export * from '@testing-library/react'
