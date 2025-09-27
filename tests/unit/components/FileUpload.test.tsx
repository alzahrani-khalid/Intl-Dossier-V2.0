import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FileUpload } from '../../../frontend/src/components/FileUpload'
import { I18nextProvider } from 'react-i18next'
import i18n from '../../../frontend/src/i18n'

// Mock the upload service
vi.mock('../../../frontend/src/services/upload', () => ({
  useUpload: () => ({
    uploadFile: vi.fn().mockResolvedValue('upload-123'),
    pauseUpload: vi.fn(),
    resumeUpload: vi.fn(),
    cancelUpload: vi.fn(),
    retryUpload: vi.fn(),
    removeUpload: vi.fn(),
    clearCompleted: vi.fn(),
    uploads: [],
    isUploading: false
  }),
  validateFile: vi.fn().mockReturnValue({ valid: true }),
  formatFileSize: vi.fn().mockReturnValue('1.5 MB'),
  getFileIcon: vi.fn().mockReturnValue('file-icon')
}))

// Mock the translation hook
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key
  })
}))

const renderWithI18n = (component: React.ReactElement) => {
  return render(
    <I18nextProvider i18n={i18n}>
      {component}
    </I18nextProvider>
  )
}

describe('FileUpload', () => {
  const defaultProps = {
    bucket: 'test-bucket',
    onUploadComplete: vi.fn(),
    onUploadError: vi.fn()
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders upload area', () => {
    renderWithI18n(<FileUpload {...defaultProps} />)
    
    expect(screen.getByText('dataLibrary.dragAndDrop')).toBeInTheDocument()
    expect(screen.getByText('or click to browse files')).toBeInTheDocument()
    expect(screen.getByText('Max file size: 50MB • Supported: PDF, DOCX, Images, CSV, Excel')).toBeInTheDocument()
  })

  it('handles file selection via input', async () => {
    const user = userEvent.setup()
    const { useUpload } = await import('../../../frontend/src/services/upload')
    const mockUploadFile = vi.fn().mockResolvedValue('upload-123')
    
    vi.mocked(useUpload).mockReturnValue({
      uploadFile: mockUploadFile,
      pauseUpload: vi.fn(),
      resumeUpload: vi.fn(),
      cancelUpload: vi.fn(),
      retryUpload: vi.fn(),
      removeUpload: vi.fn(),
      clearCompleted: vi.fn(),
      uploads: [],
      isUploading: false
    })

    renderWithI18n(<FileUpload {...defaultProps} />)
    
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
    const input = screen.getByRole('textbox', { hidden: true })
    
    await user.upload(input, file)
    
    expect(mockUploadFile).toHaveBeenCalledWith(file, expect.objectContaining({
      bucket: 'test-bucket',
      onProgress: expect.any(Function),
      onComplete: expect.any(Function),
      onError: expect.any(Function)
    }))
  })

  it('handles drag and drop', async () => {
    const { useUpload } = await import('../../../frontend/src/services/upload')
    const mockUploadFile = vi.fn().mockResolvedValue('upload-123')
    
    vi.mocked(useUpload).mockReturnValue({
      uploadFile: mockUploadFile,
      pauseUpload: vi.fn(),
      resumeUpload: vi.fn(),
      cancelUpload: vi.fn(),
      retryUpload: vi.fn(),
      removeUpload: vi.fn(),
      clearCompleted: vi.fn(),
      uploads: [],
      isUploading: false
    })

    renderWithI18n(<FileUpload {...defaultProps} />)
    
    const uploadArea = screen.getByText('dataLibrary.dragAndDrop').closest('div')
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
    
    fireEvent.dragEnter(uploadArea!, { dataTransfer: { files: [file] } })
    fireEvent.drop(uploadArea!, { dataTransfer: { files: [file] } })
    
    expect(mockUploadFile).toHaveBeenCalled()
  })

  it('shows drag active state', () => {
    renderWithI18n(<FileUpload {...defaultProps} />)
    
    const uploadArea = screen.getByText('dataLibrary.dragAndDrop').closest('div')
    
    fireEvent.dragEnter(uploadArea!)
    
    expect(uploadArea).toHaveClass('border-blue-500', 'bg-blue-50')
  })

  it('validates file types', async () => {
    const { validateFile } = await import('../../../frontend/src/services/upload')
    vi.mocked(validateFile).mockReturnValue({ valid: false, error: 'Invalid file type' })
    
    renderWithI18n(<FileUpload {...defaultProps} acceptedTypes={['.pdf']} />)
    
    const file = new File(['test content'], 'test.txt', { type: 'text/plain' })
    const input = screen.getByRole('textbox', { hidden: true })
    
    fireEvent.change(input, { target: { files: [file] } })
    
    await waitFor(() => {
      expect(screen.getByText('Invalid file type')).toBeInTheDocument()
    })
  })

  it('enforces max files limit', async () => {
    const { useUpload } = await import('../../../frontend/src/services/upload')
    
    vi.mocked(useUpload).mockReturnValue({
      uploadFile: vi.fn().mockResolvedValue('upload-123'),
      pauseUpload: vi.fn(),
      resumeUpload: vi.fn(),
      cancelUpload: vi.fn(),
      retryUpload: vi.fn(),
      removeUpload: vi.fn(),
      clearCompleted: vi.fn(),
      uploads: Array(5).fill({ id: 'test', name: 'test.pdf', status: 'completed' }),
      isUploading: false
    })

    renderWithI18n(<FileUpload {...defaultProps} maxFiles={5} />)
    
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
    const input = screen.getByRole('textbox', { hidden: true })
    
    fireEvent.change(input, { target: { files: [file] } })
    
    await waitFor(() => {
      expect(screen.getByText('Maximum 5 files allowed')).toBeInTheDocument()
    })
  })

  it('displays upload list when files are uploaded', () => {
    const { useUpload } = await import('../../../frontend/src/services/upload')
    
    vi.mocked(useUpload).mockReturnValue({
      uploadFile: vi.fn(),
      pauseUpload: vi.fn(),
      resumeUpload: vi.fn(),
      cancelUpload: vi.fn(),
      retryUpload: vi.fn(),
      removeUpload: vi.fn(),
      clearCompleted: vi.fn(),
      uploads: [
        { id: '1', name: 'test1.pdf', status: 'completed', progress: 100, size: 1024, error: null },
        { id: '2', name: 'test2.pdf', status: 'uploading', progress: 50, size: 2048, error: null }
      ],
      isUploading: true
    })

    renderWithI18n(<FileUpload {...defaultProps} />)
    
    expect(screen.getByText('Uploads (2)')).toBeInTheDocument()
    expect(screen.getByText('test1.pdf')).toBeInTheDocument()
    expect(screen.getByText('test2.pdf')).toBeInTheDocument()
    expect(screen.getByText('Uploading files...')).toBeInTheDocument()
  })

  it('shows correct status icons and colors', () => {
    const { useUpload } = await import('../../../frontend/src/services/upload')
    
    vi.mocked(useUpload).mockReturnValue({
      uploadFile: vi.fn(),
      pauseUpload: vi.fn(),
      resumeUpload: vi.fn(),
      cancelUpload: vi.fn(),
      retryUpload: vi.fn(),
      removeUpload: vi.fn(),
      clearCompleted: vi.fn(),
      uploads: [
        { id: '1', name: 'completed.pdf', status: 'completed', progress: 100, size: 1024, error: null },
        { id: '2', name: 'error.pdf', status: 'error', progress: 0, size: 1024, error: 'Upload failed' }
      ],
      isUploading: false
    })

    renderWithI18n(<FileUpload {...defaultProps} />)
    
    expect(screen.getByText('completed')).toBeInTheDocument()
    expect(screen.getByText('error')).toBeInTheDocument()
    expect(screen.getByText('Upload failed')).toBeInTheDocument()
  })

  it('calls onUploadComplete when upload succeeds', async () => {
    const onUploadComplete = vi.fn()
    const { useUpload } = await import('../../../frontend/src/services/upload')
    const mockUploadFile = vi.fn().mockImplementation((file, options) => {
      options.onComplete('https://example.com/file.pdf')
      return Promise.resolve('upload-123')
    })
    
    vi.mocked(useUpload).mockReturnValue({
      uploadFile: mockUploadFile,
      pauseUpload: vi.fn(),
      resumeUpload: vi.fn(),
      cancelUpload: vi.fn(),
      retryUpload: vi.fn(),
      removeUpload: vi.fn(),
      clearCompleted: vi.fn(),
      uploads: [],
      isUploading: false
    })

    renderWithI18n(<FileUpload {...defaultProps} onUploadComplete={onUploadComplete} />)
    
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
    const input = screen.getByRole('textbox', { hidden: true })
    
    fireEvent.change(input, { target: { files: [file] } })
    
    await waitFor(() => {
      expect(onUploadComplete).toHaveBeenCalledWith('https://example.com/file.pdf')
    })
  })

  it('calls onUploadError when upload fails', async () => {
    const onUploadError = vi.fn()
    const { useUpload } = await import('../../../frontend/src/services/upload')
    const mockUploadFile = vi.fn().mockImplementation((file, options) => {
      options.onError('Network error')
      return Promise.resolve('upload-123')
    })
    
    vi.mocked(useUpload).mockReturnValue({
      uploadFile: mockUploadFile,
      pauseUpload: vi.fn(),
      resumeUpload: vi.fn(),
      cancelUpload: vi.fn(),
      retryUpload: vi.fn(),
      removeUpload: vi.fn(),
      clearCompleted: vi.fn(),
      uploads: [],
      isUploading: false
    })

    renderWithI18n(<FileUpload {...defaultProps} onUploadError={onUploadError} />)
    
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
    const input = screen.getByRole('textbox', { hidden: true })
    
    fireEvent.change(input, { target: { files: [file] } })
    
    await waitFor(() => {
      expect(onUploadError).toHaveBeenCalledWith('Network error')
    })
  })
})