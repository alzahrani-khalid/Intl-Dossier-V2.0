import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { DataTable } from '../../../frontend/src/components/Table/DataTable'
import { I18nextProvider } from 'react-i18next'
import i18n from '../../../frontend/src/i18n'

const renderWithI18n = (component: React.ReactElement) => {
  return render(
    <I18nextProvider i18n={i18n}>
      {component}
    </I18nextProvider>
  )
}

const mockData = [
  { id: '1', name: 'John Doe', email: 'john@example.com', role: 'admin', status: 'active' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', role: 'user', status: 'inactive' },
  { id: '3', name: 'Bob Johnson', email: 'bob@example.com', role: 'editor', status: 'active' }
]

const mockColumns = [
  { key: 'name', label: 'Name', sortable: true },
  { key: 'email', label: 'Email', sortable: true },
  { key: 'role', label: 'Role', sortable: true },
  { key: 'status', label: 'Status', sortable: false }
]

describe('DataTable', () => {
  const defaultProps = {
    data: mockData,
    columns: mockColumns,
    onSort: vi.fn(),
    onFilter: vi.fn(),
    onRowClick: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders table with data', () => {
    renderWithI18n(<DataTable {...defaultProps} />)
    
    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
    expect(screen.getByText('Role')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
  })

  it('renders all data rows', () => {
    renderWithI18n(<DataTable {...defaultProps} />)
    
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument()
  })

  it('handles sorting when column header is clicked', async () => {
    const user = userEvent.setup()
    renderWithI18n(<DataTable {...defaultProps} />)
    
    const nameHeader = screen.getByRole('button', { name: /name/i })
    await user.click(nameHeader)
    
    expect(defaultProps.onSort).toHaveBeenCalledWith('name', 'asc')
  })

  it('toggles sort direction on repeated clicks', async () => {
    const user = userEvent.setup()
    renderWithI18n(<DataTable {...defaultProps} />)
    
    const nameHeader = screen.getByRole('button', { name: /name/i })
    await user.click(nameHeader)
    await user.click(nameHeader)
    
    expect(defaultProps.onSort).toHaveBeenCalledWith('name', 'desc')
  })

  it('shows sort indicators', async () => {
    const user = userEvent.setup()
    renderWithI18n(<DataTable {...defaultProps} />)
    
    const nameHeader = screen.getByRole('button', { name: /name/i })
    await user.click(nameHeader)
    
    expect(nameHeader).toHaveAttribute('aria-sort', 'ascending')
  })

  it('handles row clicks', async () => {
    const user = userEvent.setup()
    renderWithI18n(<DataTable {...defaultProps} />)
    
    const firstRow = screen.getByText('John Doe').closest('tr')
    await user.click(firstRow!)
    
    expect(defaultProps.onRowClick).toHaveBeenCalledWith(mockData[0])
  })

  it('shows loading state', () => {
    renderWithI18n(<DataTable {...defaultProps} loading />)
    
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('shows empty state when no data', () => {
    renderWithI18n(<DataTable {...defaultProps} data={[]} />)
    
    expect(screen.getByText('No data available')).toBeInTheDocument()
  })

  it('handles custom empty message', () => {
    renderWithI18n(
      <DataTable 
        {...defaultProps} 
        data={[]} 
        emptyMessage="No users found" 
      />
    )
    
    expect(screen.getByText('No users found')).toBeInTheDocument()
  })

  it('shows pagination when enabled', () => {
    renderWithI18n(
      <DataTable 
        {...defaultProps} 
        pagination={{
          page: 1,
          limit: 10,
          total: 25,
          onPageChange: vi.fn()
        }}
      />
    )
    
    expect(screen.getByText('1 of 3')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
  })

  it('handles page changes', async () => {
    const user = userEvent.setup()
    const onPageChange = vi.fn()
    
    renderWithI18n(
      <DataTable 
        {...defaultProps} 
        pagination={{
          page: 1,
          limit: 10,
          total: 25,
          onPageChange
        }}
      />
    )
    
    const nextButton = screen.getByRole('button', { name: /next/i })
    await user.click(nextButton)
    
    expect(onPageChange).toHaveBeenCalledWith(2)
  })

  it('shows selection checkboxes when selectable', () => {
    renderWithI18n(<DataTable {...defaultProps} selectable />)
    
    const checkboxes = screen.getAllByRole('checkbox')
    expect(checkboxes).toHaveLength(mockData.length + 1) // +1 for header checkbox
  })

  it('handles row selection', async () => {
    const user = userEvent.setup()
    const onSelectionChange = vi.fn()
    
    renderWithI18n(
      <DataTable 
        {...defaultProps} 
        selectable 
        onSelectionChange={onSelectionChange}
      />
    )
    
    const firstCheckbox = screen.getAllByRole('checkbox')[1] // Skip header checkbox
    await user.click(firstCheckbox)
    
    expect(onSelectionChange).toHaveBeenCalledWith([mockData[0]])
  })

  it('handles select all', async () => {
    const user = userEvent.setup()
    const onSelectionChange = vi.fn()
    
    renderWithI18n(
      <DataTable 
        {...defaultProps} 
        selectable 
        onSelectionChange={onSelectionChange}
      />
    )
    
    const selectAllCheckbox = screen.getAllByRole('checkbox')[0]
    await user.click(selectAllCheckbox)
    
    expect(onSelectionChange).toHaveBeenCalledWith(mockData)
  })

  it('shows custom cell content', () => {
    const customColumns = [
      ...mockColumns,
      {
        key: 'actions',
        label: 'Actions',
        render: (row: any) => <button>Edit {row.name}</button>
      }
    ]
    
    renderWithI18n(<DataTable {...defaultProps} columns={customColumns} />)
    
    expect(screen.getByText('Edit John Doe')).toBeInTheDocument()
  })

  it('handles keyboard navigation', async () => {
    const user = userEvent.setup()
    renderWithI18n(<DataTable {...defaultProps} />)
    
    const firstRow = screen.getByText('John Doe').closest('tr')
    firstRow!.focus()
    
    await user.keyboard('{ArrowDown}')
    
    // Should move to next row
    expect(document.activeElement).toBeInTheDocument()
  })

  it('shows filter inputs when filtering is enabled', () => {
    renderWithI18n(<DataTable {...defaultProps} filterable />)
    
    expect(screen.getByPlaceholderText('Filter by name...')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Filter by email...')).toBeInTheDocument()
  })

  it('handles filter changes', async () => {
    const user = userEvent.setup()
    renderWithI18n(<DataTable {...defaultProps} filterable />)
    
    const nameFilter = screen.getByPlaceholderText('Filter by name...')
    await user.type(nameFilter, 'John')
    
    expect(defaultProps.onFilter).toHaveBeenCalledWith({ name: 'John' })
  })

  it('shows column visibility toggle', () => {
    renderWithI18n(<DataTable {...defaultProps} hideableColumns />)
    
    expect(screen.getByRole('button', { name: /columns/i })).toBeInTheDocument()
  })

  it('handles column visibility changes', async () => {
    const user = userEvent.setup()
    renderWithI18n(<DataTable {...defaultProps} hideableColumns />)
    
    const columnsButton = screen.getByRole('button', { name: /columns/i })
    await user.click(columnsButton)
    
    const nameCheckbox = screen.getByRole('checkbox', { name: /name/i })
    await user.click(nameCheckbox)
    
    expect(screen.queryByText('Name')).not.toBeInTheDocument()
  })

  it('handles RTL layout', () => {
    // Mock RTL language
    vi.mocked(i18n.language).mockReturnValue('ar')
    
    renderWithI18n(<DataTable {...defaultProps} />)
    
    const table = screen.getByRole('table')
    expect(table).toHaveClass('rtl:text-right')
  })

  it('shows export button when export is enabled', () => {
    renderWithI18n(<DataTable {...defaultProps} exportable />)
    
    expect(screen.getByRole('button', { name: /export/i })).toBeInTheDocument()
  })

  it('handles export functionality', async () => {
    const user = userEvent.setup()
    const onExport = vi.fn()
    
    renderWithI18n(<DataTable {...defaultProps} exportable onExport={onExport} />)
    
    const exportButton = screen.getByRole('button', { name: /export/i })
    await user.click(exportButton)
    
    expect(onExport).toHaveBeenCalledWith('csv')
  })

  it('shows loading skeleton when loading', () => {
    renderWithI18n(<DataTable {...defaultProps} loading />)
    
    const skeletons = screen.getAllByTestId('skeleton')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('handles error state', () => {
    renderWithI18n(<DataTable {...defaultProps} error="Failed to load data" />)
    
    expect(screen.getByText('Failed to load data')).toBeInTheDocument()
  })

  it('shows retry button in error state', () => {
    const onRetry = vi.fn()
    renderWithI18n(<DataTable {...defaultProps} error="Failed to load data" onRetry={onRetry} />)
    
    const retryButton = screen.getByRole('button', { name: /retry/i })
    expect(retryButton).toBeInTheDocument()
  })
})
