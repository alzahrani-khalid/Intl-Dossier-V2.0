import { describe, it, expect, beforeEach, vi } from 'vitest'
import { DataLibraryService } from '../../../backend/src/services/DataLibraryService'
import { supabaseAdmin } from '../../../backend/src/config/supabase'

// Mock supabase
vi.mock('../../../backend/src/config/supabase', () => ({
  supabaseAdmin: {
    from: vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
        gte: vi.fn(() => ({
          lte: vi.fn(() => ({
            order: vi.fn(() => ({
              range: vi.fn(),
            })),
          })),
        })),
        order: vi.fn(() => ({
          range: vi.fn(),
        })),
      })),
      insert: vi.fn(() => ({
        select: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
      update: vi.fn(() => ({
        eq: vi.fn().mockReturnValue({
          select: vi.fn(() => ({
            single: vi.fn(),
          })),
        }),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  },
}))

describe('DataLibraryService', () => {
  let dataLibraryService: DataLibraryService

  beforeEach(() => {
    dataLibraryService = new DataLibraryService()
    vi.clearAllMocks()
  })

  describe('getAllDataLibraryItems', () => {
    it('should return all data library items with pagination', async () => {
      const mockItems = [
        {
          id: '1',
          title: 'Sample Document',
          description: 'A sample document for testing',
          file_type: 'pdf',
          file_size: 1024000,
          file_path: '/uploads/sample.pdf',
          category: 'reports',
          tags: ['sample', 'test'],
          is_public: true,
          uploaded_by: 'user-1',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        },
        {
          id: '2',
          title: 'Another Document',
          description: 'Another sample document',
          file_type: 'docx',
          file_size: 512000,
          file_path: '/uploads/another.docx',
          category: 'templates',
          tags: ['template', 'official'],
          is_public: false,
          uploaded_by: 'user-2',
          created_at: '2025-01-02T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({
              data: mockItems,
              error: null,
              count: 2
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await dataLibraryService.getAllDataLibraryItems({
        page: 1,
        limit: 10
      })

      expect(result.data).toEqual(mockItems)
      expect(result.pagination.total).toBe(2)
      expect(supabaseAdmin.from).toHaveBeenCalledWith('data_library')
    })

    it('should filter items by category', async () => {
      const mockItems = [
        {
          id: '1',
          title: 'Sample Document',
          description: 'A sample document for testing',
          file_type: 'pdf',
          file_size: 1024000,
          file_path: '/uploads/sample.pdf',
          category: 'reports',
          tags: ['sample', 'test'],
          is_public: true,
          uploaded_by: 'user-1',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: mockItems,
                error: null,
                count: 1
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await dataLibraryService.getAllDataLibraryItems({
        page: 1,
        limit: 10,
        category: 'reports'
      })

      expect(result.data).toEqual(mockItems)
      expect(mockQuery.eq).toHaveBeenCalledWith('category', 'reports')
    })

    it('should filter items by file type', async () => {
      const mockItems = [
        {
          id: '1',
          title: 'Sample Document',
          description: 'A sample document for testing',
          file_type: 'pdf',
          file_size: 1024000,
          file_path: '/uploads/sample.pdf',
          category: 'reports',
          tags: ['sample', 'test'],
          is_public: true,
          uploaded_by: 'user-1',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: mockItems,
                error: null,
                count: 1
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await dataLibraryService.getAllDataLibraryItems({
        page: 1,
        limit: 10,
        file_type: 'pdf'
      })

      expect(result.data).toEqual(mockItems)
      expect(mockQuery.eq).toHaveBeenCalledWith('file_type', 'pdf')
    })

    it('should filter items by uploader', async () => {
      const mockItems = [
        {
          id: '1',
          title: 'Sample Document',
          description: 'A sample document for testing',
          file_type: 'pdf',
          file_size: 1024000,
          file_path: '/uploads/sample.pdf',
          category: 'reports',
          tags: ['sample', 'test'],
          is_public: true,
          uploaded_by: 'user-1',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: mockItems,
                error: null,
                count: 1
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await dataLibraryService.getAllDataLibraryItems({
        page: 1,
        limit: 10,
        uploaded_by: 'user-1'
      })

      expect(result.data).toEqual(mockItems)
      expect(mockQuery.eq).toHaveBeenCalledWith('uploaded_by', 'user-1')
    })

    it('should filter items by public status', async () => {
      const mockItems = [
        {
          id: '1',
          title: 'Sample Document',
          description: 'A sample document for testing',
          file_type: 'pdf',
          file_size: 1024000,
          file_path: '/uploads/sample.pdf',
          category: 'reports',
          tags: ['sample', 'test'],
          is_public: true,
          uploaded_by: 'user-1',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: mockItems,
                error: null,
                count: 1
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await dataLibraryService.getAllDataLibraryItems({
        page: 1,
        limit: 10,
        is_public: true
      })

      expect(result.data).toEqual(mockItems)
      expect(mockQuery.eq).toHaveBeenCalledWith('is_public', true)
    })

    it('should filter items by file size range', async () => {
      const mockItems = [
        {
          id: '1',
          title: 'Sample Document',
          description: 'A sample document for testing',
          file_type: 'pdf',
          file_size: 1024000,
          file_path: '/uploads/sample.pdf',
          category: 'reports',
          tags: ['sample', 'test'],
          is_public: true,
          uploaded_by: 'user-1',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                range: vi.fn().mockResolvedValue({
                  data: mockItems,
                  error: null,
                  count: 1
                })
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await dataLibraryService.getAllDataLibraryItems({
        page: 1,
        limit: 10,
        min_file_size: 1000000,
        max_file_size: 2000000
      })

      expect(result.data).toEqual(mockItems)
    })
  })

  describe('getDataLibraryItemById', () => {
    it('should return data library item by ID', async () => {
      const mockItem = {
        id: '1',
        title: 'Sample Document',
        description: 'A sample document for testing',
        file_type: 'pdf',
        file_size: 1024000,
        file_path: '/uploads/sample.pdf',
        category: 'reports',
        tags: ['sample', 'test'],
        is_public: true,
        uploaded_by: 'user-1',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockItem,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await dataLibraryService.getDataLibraryItemById('1')

      expect(result).toEqual(mockItem)
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1')
    })

    it('should throw error when data library item not found', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Data library item not found' }
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      await expect(dataLibraryService.getDataLibraryItemById('999')).rejects.toThrow('Data library item not found')
    })
  })

  describe('createDataLibraryItem', () => {
    it('should create new data library item', async () => {
      const newItem = {
        title: 'New Document',
        description: 'A new document',
        file_type: 'pdf',
        file_size: 1024000,
        file_path: '/uploads/new.pdf',
        category: 'reports',
        tags: ['new', 'document'],
        is_public: true,
        uploaded_by: 'user-1'
      }

      const mockCreatedItem = {
        id: '3',
        ...newItem,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }

      const mockQuery = {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockCreatedItem,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await dataLibraryService.createDataLibraryItem(newItem)

      expect(result).toEqual(mockCreatedItem)
      expect(mockQuery.insert).toHaveBeenCalledWith(newItem)
    })

    it('should validate required fields', async () => {
      const invalidItem = {
        title: 'New Document',
        // Missing required fields
      }

      await expect(dataLibraryService.createDataLibraryItem(invalidItem as any)).rejects.toThrow()
    })

    it('should validate file type', async () => {
      const invalidItem = {
        title: 'New Document',
        description: 'A new document',
        file_type: 'invalid-type',
        file_size: 1024000,
        file_path: '/uploads/new.invalid',
        category: 'reports',
        tags: ['new', 'document'],
        is_public: true,
        uploaded_by: 'user-1'
      }

      await expect(dataLibraryService.createDataLibraryItem(invalidItem)).rejects.toThrow()
    })

    it('should validate file size', async () => {
      const invalidItem = {
        title: 'New Document',
        description: 'A new document',
        file_type: 'pdf',
        file_size: -1000, // Negative file size
        file_path: '/uploads/new.pdf',
        category: 'reports',
        tags: ['new', 'document'],
        is_public: true,
        uploaded_by: 'user-1'
      }

      await expect(dataLibraryService.createDataLibraryItem(invalidItem)).rejects.toThrow()
    })

    it('should validate category', async () => {
      const invalidItem = {
        title: 'New Document',
        description: 'A new document',
        file_type: 'pdf',
        file_size: 1024000,
        file_path: '/uploads/new.pdf',
        category: 'invalid-category',
        tags: ['new', 'document'],
        is_public: true,
        uploaded_by: 'user-1'
      }

      await expect(dataLibraryService.createDataLibraryItem(invalidItem)).rejects.toThrow()
    })
  })

  describe('updateDataLibraryItem', () => {
    it('should update existing data library item', async () => {
      const updates = {
        title: 'Updated Document',
        description: 'An updated document',
        tags: ['updated', 'document']
      }

      const mockUpdatedItem = {
        id: '1',
        title: 'Updated Document',
        description: 'An updated document',
        file_type: 'pdf',
        file_size: 1024000,
        file_path: '/uploads/sample.pdf',
        category: 'reports',
        tags: ['updated', 'document'],
        is_public: true,
        uploaded_by: 'user-1',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }

      const mockQuery = {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockUpdatedItem,
                error: null
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await dataLibraryService.updateDataLibraryItem('1', updates)

      expect(result).toEqual(mockUpdatedItem)
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1')
    })

    it('should throw error when data library item not found for update', async () => {
      const updates = { title: 'Updated Document' }

      const mockQuery = {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Data library item not found' }
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      await expect(dataLibraryService.updateDataLibraryItem('999', updates)).rejects.toThrow('Data library item not found')
    })
  })

  describe('deleteDataLibraryItem', () => {
    it('should delete data library item', async () => {
      const mockQuery = {
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: { id: '1' },
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      await dataLibraryService.deleteDataLibraryItem('1')

      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1')
    })

    it('should throw error when data library item not found for deletion', async () => {
      const mockQuery = {
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Data library item not found' }
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      await expect(dataLibraryService.deleteDataLibraryItem('999')).rejects.toThrow('Data library item not found')
    })
  })

  describe('getDataLibraryItemsByCategory', () => {
    it('should return data library items by category', async () => {
      const mockItems = [
        {
          id: '1',
          title: 'Sample Document',
          description: 'A sample document for testing',
          file_type: 'pdf',
          file_size: 1024000,
          file_path: '/uploads/sample.pdf',
          category: 'reports',
          tags: ['sample', 'test'],
          is_public: true,
          uploaded_by: 'user-1',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockItems,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await dataLibraryService.getDataLibraryItemsByCategory('reports')

      expect(result).toEqual(mockItems)
      expect(mockQuery.eq).toHaveBeenCalledWith('category', 'reports')
    })
  })

  describe('getDataLibraryItemsByUploader', () => {
    it('should return data library items by uploader', async () => {
      const mockItems = [
        {
          id: '1',
          title: 'Sample Document',
          description: 'A sample document for testing',
          file_type: 'pdf',
          file_size: 1024000,
          file_path: '/uploads/sample.pdf',
          category: 'reports',
          tags: ['sample', 'test'],
          is_public: true,
          uploaded_by: 'user-1',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockItems,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await dataLibraryService.getDataLibraryItemsByUploader('user-1')

      expect(result).toEqual(mockItems)
      expect(mockQuery.eq).toHaveBeenCalledWith('uploaded_by', 'user-1')
    })
  })

  describe('getPublicDataLibraryItems', () => {
    it('should return public data library items', async () => {
      const mockItems = [
        {
          id: '1',
          title: 'Sample Document',
          description: 'A sample document for testing',
          file_type: 'pdf',
          file_size: 1024000,
          file_path: '/uploads/sample.pdf',
          category: 'reports',
          tags: ['sample', 'test'],
          is_public: true,
          uploaded_by: 'user-1',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockItems,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await dataLibraryService.getPublicDataLibraryItems()

      expect(result).toEqual(mockItems)
      expect(mockQuery.eq).toHaveBeenCalledWith('is_public', true)
    })
  })

  describe('searchDataLibraryItems', () => {
    it('should search data library items by title and description', async () => {
      const mockItems = [
        {
          id: '1',
          title: 'Sample Document',
          description: 'A sample document for testing',
          file_type: 'pdf',
          file_size: 1024000,
          file_path: '/uploads/sample.pdf',
          category: 'reports',
          tags: ['sample', 'test'],
          is_public: true,
          uploaded_by: 'user-1',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          or: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockItems,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await dataLibraryService.searchDataLibraryItems('sample')

      expect(result).toEqual(mockItems)
    })
  })

  describe('getDataLibraryItemsByTags', () => {
    it('should return data library items by tags', async () => {
      const mockItems = [
        {
          id: '1',
          title: 'Sample Document',
          description: 'A sample document for testing',
          file_type: 'pdf',
          file_size: 1024000,
          file_path: '/uploads/sample.pdf',
          category: 'reports',
          tags: ['sample', 'test'],
          is_public: true,
          uploaded_by: 'user-1',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          contains: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockItems,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await dataLibraryService.getDataLibraryItemsByTags(['sample'])

      expect(result).toEqual(mockItems)
      expect(mockQuery.contains).toHaveBeenCalledWith('tags', ['sample'])
    })
  })

  describe('validateDataLibraryItemData', () => {
    it('should validate data library item data structure', () => {
      const validItem = {
        title: 'Sample Document',
        description: 'A sample document for testing',
        file_type: 'pdf',
        file_size: 1024000,
        file_path: '/uploads/sample.pdf',
        category: 'reports',
        tags: ['sample', 'test'],
        is_public: true,
        uploaded_by: 'user-1'
      }

      expect(() => dataLibraryService.validateDataLibraryItemData(validItem)).not.toThrow()
    })

    it('should throw error for missing required fields', () => {
      const invalidItem = {
        title: 'Sample Document',
        // Missing required fields
      }

      expect(() => dataLibraryService.validateDataLibraryItemData(invalidItem as any)).toThrow()
    })

    it('should throw error for invalid file type', () => {
      const invalidItem = {
        title: 'Sample Document',
        description: 'A sample document for testing',
        file_type: 'invalid-type',
        file_size: 1024000,
        file_path: '/uploads/sample.invalid',
        category: 'reports',
        tags: ['sample', 'test'],
        is_public: true,
        uploaded_by: 'user-1'
      }

      expect(() => dataLibraryService.validateDataLibraryItemData(invalidItem)).toThrow()
    })

    it('should throw error for invalid file size', () => {
      const invalidItem = {
        title: 'Sample Document',
        description: 'A sample document for testing',
        file_type: 'pdf',
        file_size: -1000, // Negative file size
        file_path: '/uploads/sample.pdf',
        category: 'reports',
        tags: ['sample', 'test'],
        is_public: true,
        uploaded_by: 'user-1'
      }

      expect(() => dataLibraryService.validateDataLibraryItemData(invalidItem)).toThrow()
    })

    it('should throw error for invalid category', () => {
      const invalidItem = {
        title: 'Sample Document',
        description: 'A sample document for testing',
        file_type: 'pdf',
        file_size: 1024000,
        file_path: '/uploads/sample.pdf',
        category: 'invalid-category',
        tags: ['sample', 'test'],
        is_public: true,
        uploaded_by: 'user-1'
      }

      expect(() => dataLibraryService.validateDataLibraryItemData(invalidItem)).toThrow()
    })
  })
})