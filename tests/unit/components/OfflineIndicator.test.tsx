import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { OfflineIndicator } from '../../../frontend/src/components/OfflineIndicator'
import { I18nextProvider } from 'react-i18next'
import i18n from '../../../frontend/src/i18n'

// Mock the offline service
vi.mock('../../../frontend/src/services/offline-queue', () => ({
  useOfflineStatus: () => ({
    isOnline: true,
    isOffline: false,
    pendingActions: 0,
    lastSyncTime: new Date('2025-01-01T12:00:00Z')
  })
}))

const renderWithI18n = (component: React.ReactElement) => {
  return render(
    <I18nextProvider i18n={i18n}>
      {component}
    </I18nextProvider>
  )
}

describe('OfflineIndicator', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders online status when connected', () => {
    renderWithI18n(<OfflineIndicator />)
    
    expect(screen.getByText('Online')).toBeInTheDocument()
    expect(screen.getByTestId('online-icon')).toBeInTheDocument()
  })

  it('renders offline status when disconnected', () => {
    const { useOfflineStatus } = require('../../../frontend/src/services/offline-queue')
    
    vi.mocked(useOfflineStatus).mockReturnValue({
      isOnline: false,
      isOffline: true,
      pendingActions: 0,
      lastSyncTime: new Date('2025-01-01T12:00:00Z')
    })
    
    renderWithI18n(<OfflineIndicator />)
    
    expect(screen.getByText('Offline')).toBeInTheDocument()
    expect(screen.getByTestId('offline-icon')).toBeInTheDocument()
  })

  it('shows pending actions count', () => {
    const { useOfflineStatus } = require('../../../frontend/src/services/offline-queue')
    
    vi.mocked(useOfflineStatus).mockReturnValue({
      isOnline: false,
      isOffline: true,
      pendingActions: 5,
      lastSyncTime: new Date('2025-01-01T12:00:00Z')
    })
    
    renderWithI18n(<OfflineIndicator />)
    
    expect(screen.getByText('5 pending actions')).toBeInTheDocument()
  })

  it('shows sync status when online', () => {
    renderWithI18n(<OfflineIndicator />)
    
    expect(screen.getByText('Last synced: 12:00 PM')).toBeInTheDocument()
  })

  it('handles click to show details', async () => {
    const user = userEvent.setup()
    renderWithI18n(<OfflineIndicator />)
    
    const indicator = screen.getByRole('button')
    await user.click(indicator)
    
    expect(screen.getByText('Connection Details')).toBeInTheDocument()
  })

  it('shows connection details modal', async () => {
    const user = userEvent.setup()
    renderWithI18n(<OfflineIndicator />)
    
    const indicator = screen.getByRole('button')
    await user.click(indicator)
    
    expect(screen.getByText('Status: Online')).toBeInTheDocument()
    expect(screen.getByText('Pending Actions: 0')).toBeInTheDocument()
    expect(screen.getByText('Last Sync: 12:00 PM')).toBeInTheDocument()
  })

  it('closes modal when close button is clicked', async () => {
    const user = userEvent.setup()
    renderWithI18n(<OfflineIndicator />)
    
    const indicator = screen.getByRole('button')
    await user.click(indicator)
    
    const closeButton = screen.getByRole('button', { name: /close/i })
    await user.click(closeButton)
    
    await waitFor(() => {
      expect(screen.queryByText('Connection Details')).not.toBeInTheDocument()
    })
  })

  it('closes modal when clicking outside', async () => {
    const user = userEvent.setup()
    renderWithI18n(<OfflineIndicator />)
    
    const indicator = screen.getByRole('button')
    await user.click(indicator)
    
    const modal = screen.getByRole('dialog')
    await user.click(modal)
    
    await waitFor(() => {
      expect(screen.queryByText('Connection Details')).not.toBeInTheDocument()
    })
  })

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup()
    renderWithI18n(<OfflineIndicator />)
    
    const indicator = screen.getByRole('button')
    indicator.focus()
    
    await user.keyboard('{Enter}')
    
    expect(screen.getByText('Connection Details')).toBeInTheDocument()
  })

  it('shows retry button when offline with pending actions', () => {
    const { useOfflineStatus } = require('../../../frontend/src/services/offline-queue')
    
    vi.mocked(useOfflineStatus).mockReturnValue({
      isOnline: false,
      isOffline: true,
      pendingActions: 3,
      lastSyncTime: new Date('2025-01-01T12:00:00Z')
    })
    
    renderWithI18n(<OfflineIndicator />)
    
    expect(screen.getByRole('button', { name: /retry sync/i })).toBeInTheDocument()
  })

  it('handles retry sync', async () => {
    const user = userEvent.setup()
    const { useOfflineStatus } = require('../../../frontend/src/services/offline-queue')
    const mockRetrySync = vi.fn()
    
    vi.mocked(useOfflineStatus).mockReturnValue({
      isOnline: false,
      isOffline: true,
      pendingActions: 3,
      lastSyncTime: new Date('2025-01-01T12:00:00Z'),
      retrySync: mockRetrySync
    })
    
    renderWithI18n(<OfflineIndicator />)
    
    const retryButton = screen.getByRole('button', { name: /retry sync/i })
    await user.click(retryButton)
    
    expect(mockRetrySync).toHaveBeenCalled()
  })

  it('shows sync progress when syncing', () => {
    const { useOfflineStatus } = require('../../../frontend/src/services/offline-queue')
    
    vi.mocked(useOfflineStatus).mockReturnValue({
      isOnline: true,
      isOffline: false,
      pendingActions: 2,
      lastSyncTime: new Date('2025-01-01T12:00:00Z'),
      isSyncing: true
    })
    
    renderWithI18n(<OfflineIndicator />)
    
    expect(screen.getByText('Syncing...')).toBeInTheDocument()
    expect(screen.getByTestId('sync-spinner')).toBeInTheDocument()
  })

  it('shows error state when sync fails', () => {
    const { useOfflineStatus } = require('../../../frontend/src/services/offline-queue')
    
    vi.mocked(useOfflineStatus).mockReturnValue({
      isOnline: true,
      isOffline: false,
      pendingActions: 1,
      lastSyncTime: new Date('2025-01-01T12:00:00Z'),
      syncError: 'Sync failed'
    })
    
    renderWithI18n(<OfflineIndicator />)
    
    expect(screen.getByText('Sync failed')).toBeInTheDocument()
    expect(screen.getByTestId('error-icon')).toBeInTheDocument()
  })

  it('handles RTL layout', () => {
    // Mock RTL language
    vi.mocked(i18n.language).mockReturnValue('ar')
    
    renderWithI18n(<OfflineIndicator />)
    
    const indicator = screen.getByRole('button')
    expect(indicator).toHaveClass('rtl:flex-row-reverse')
  })

  it('shows different colors for different states', () => {
    const { useOfflineStatus } = require('../../../frontend/src/services/offline-queue')
    
    // Test online state
    vi.mocked(useOfflineStatus).mockReturnValue({
      isOnline: true,
      isOffline: false,
      pendingActions: 0,
      lastSyncTime: new Date('2025-01-01T12:00:00Z')
    })
    
    const { rerender } = renderWithI18n(<OfflineIndicator />)
    expect(screen.getByRole('button')).toHaveClass('bg-green-100', 'text-green-800')
    
    // Test offline state
    vi.mocked(useOfflineStatus).mockReturnValue({
      isOnline: false,
      isOffline: true,
      pendingActions: 0,
      lastSyncTime: new Date('2025-01-01T12:00:00Z')
    })
    
    rerender(
      <I18nextProvider i18n={i18n}>
        <OfflineIndicator />
      </I18nextProvider>
    )
    expect(screen.getByRole('button')).toHaveClass('bg-red-100', 'text-red-800')
  })

  it('shows tooltip on hover', async () => {
    const user = userEvent.setup()
    renderWithI18n(<OfflineIndicator />)
    
    const indicator = screen.getByRole('button')
    await user.hover(indicator)
    
    await waitFor(() => {
      expect(screen.getByText('Click for connection details')).toBeInTheDocument()
    })
  })

  it('handles different pending action counts', () => {
    const { useOfflineStatus } = require('../../../frontend/src/services/offline-queue')
    
    // Test single pending action
    vi.mocked(useOfflineStatus).mockReturnValue({
      isOnline: false,
      isOffline: true,
      pendingActions: 1,
      lastSyncTime: new Date('2025-01-01T12:00:00Z')
    })
    
    const { rerender } = renderWithI18n(<OfflineIndicator />)
    expect(screen.getByText('1 pending action')).toBeInTheDocument()
    
    // Test multiple pending actions
    vi.mocked(useOfflineStatus).mockReturnValue({
      isOnline: false,
      isOffline: true,
      pendingActions: 10,
      lastSyncTime: new Date('2025-01-01T12:00:00Z')
    })
    
    rerender(
      <I18nextProvider i18n={i18n}>
        <OfflineIndicator />
      </I18nextProvider>
    )
    expect(screen.getByText('10 pending actions')).toBeInTheDocument()
  })

  it('shows last sync time in different formats', () => {
    const { useOfflineStatus } = require('../../../frontend/src/services/offline-queue')
    
    // Test recent sync
    vi.mocked(useOfflineStatus).mockReturnValue({
      isOnline: true,
      isOffline: false,
      pendingActions: 0,
      lastSyncTime: new Date('2025-01-01T12:00:00Z')
    })
    
    renderWithI18n(<OfflineIndicator />)
    expect(screen.getByText('Last synced: 12:00 PM')).toBeInTheDocument()
  })

  it('handles missing last sync time', () => {
    const { useOfflineStatus } = require('../../../frontend/src/services/offline-queue')
    
    vi.mocked(useOfflineStatus).mockReturnValue({
      isOnline: true,
      isOffline: false,
      pendingActions: 0,
      lastSyncTime: null
    })
    
    renderWithI18n(<OfflineIndicator />)
    expect(screen.getByText('Never synced')).toBeInTheDocument()
  })
})