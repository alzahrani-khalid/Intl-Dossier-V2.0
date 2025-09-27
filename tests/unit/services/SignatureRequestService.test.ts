import { describe, it, expect, beforeEach, vi } from 'vitest'
import { SignatureRequestService } from '../../../backend/src/services/SignatureRequestService'
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

describe('SignatureRequestService', () => {
  let signatureRequestService: SignatureRequestService

  beforeEach(() => {
    signatureRequestService = new SignatureRequestService()
    vi.clearAllMocks()
  })

  describe('getAllSignatureRequests', () => {
    it('should return all signature requests with pagination', async () => {
      const mockRequests = [
        {
          id: '1',
          document_id: 'doc-1',
          requester_id: 'user-1',
          signer_id: 'user-2',
          status: 'pending',
          priority: 'normal',
          due_date: '2025-12-31T23:59:59Z',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        },
        {
          id: '2',
          document_id: 'doc-2',
          requester_id: 'user-2',
          signer_id: 'user-3',
          status: 'signed',
          priority: 'high',
          due_date: '2025-01-15T23:59:59Z',
          signed_at: '2025-01-10T00:00:00Z',
          created_at: '2025-01-02T00:00:00Z',
          updated_at: '2025-01-10T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({
              data: mockRequests,
              error: null,
              count: 2
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await signatureRequestService.getAllSignatureRequests({
        page: 1,
        limit: 10
      })

      expect(result.data).toEqual(mockRequests)
      expect(result.pagination.total).toBe(2)
      expect(supabaseAdmin.from).toHaveBeenCalledWith('signature_requests')
    })

    it('should filter requests by requester', async () => {
      const mockRequests = [
        {
          id: '1',
          document_id: 'doc-1',
          requester_id: 'user-1',
          signer_id: 'user-2',
          status: 'pending',
          priority: 'normal',
          due_date: '2025-12-31T23:59:59Z',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: mockRequests,
                error: null,
                count: 1
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await signatureRequestService.getAllSignatureRequests({
        page: 1,
        limit: 10,
        requester_id: 'user-1'
      })

      expect(result.data).toEqual(mockRequests)
      expect(mockQuery.eq).toHaveBeenCalledWith('requester_id', 'user-1')
    })

    it('should filter requests by signer', async () => {
      const mockRequests = [
        {
          id: '1',
          document_id: 'doc-1',
          requester_id: 'user-1',
          signer_id: 'user-2',
          status: 'pending',
          priority: 'normal',
          due_date: '2025-12-31T23:59:59Z',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: mockRequests,
                error: null,
                count: 1
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await signatureRequestService.getAllSignatureRequests({
        page: 1,
        limit: 10,
        signer_id: 'user-2'
      })

      expect(result.data).toEqual(mockRequests)
      expect(mockQuery.eq).toHaveBeenCalledWith('signer_id', 'user-2')
    })

    it('should filter requests by status', async () => {
      const mockRequests = [
        {
          id: '1',
          document_id: 'doc-1',
          requester_id: 'user-1',
          signer_id: 'user-2',
          status: 'pending',
          priority: 'normal',
          due_date: '2025-12-31T23:59:59Z',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: mockRequests,
                error: null,
                count: 1
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await signatureRequestService.getAllSignatureRequests({
        page: 1,
        limit: 10,
        status: 'pending'
      })

      expect(result.data).toEqual(mockRequests)
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'pending')
    })

    it('should filter requests by priority', async () => {
      const mockRequests = [
        {
          id: '1',
          document_id: 'doc-1',
          requester_id: 'user-1',
          signer_id: 'user-2',
          status: 'pending',
          priority: 'high',
          due_date: '2025-12-31T23:59:59Z',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: mockRequests,
                error: null,
                count: 1
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await signatureRequestService.getAllSignatureRequests({
        page: 1,
        limit: 10,
        priority: 'high'
      })

      expect(result.data).toEqual(mockRequests)
      expect(mockQuery.eq).toHaveBeenCalledWith('priority', 'high')
    })

    it('should filter requests by due date range', async () => {
      const mockRequests = [
        {
          id: '1',
          document_id: 'doc-1',
          requester_id: 'user-1',
          signer_id: 'user-2',
          status: 'pending',
          priority: 'normal',
          due_date: '2025-01-15T23:59:59Z',
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
                  data: mockRequests,
                  error: null,
                  count: 1
                })
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await signatureRequestService.getAllSignatureRequests({
        page: 1,
        limit: 10,
        due_date_from: '2025-01-01T00:00:00Z',
        due_date_to: '2025-01-31T23:59:59Z'
      })

      expect(result.data).toEqual(mockRequests)
    })
  })

  describe('getSignatureRequestById', () => {
    it('should return signature request by ID', async () => {
      const mockRequest = {
        id: '1',
        document_id: 'doc-1',
        requester_id: 'user-1',
        signer_id: 'user-2',
        status: 'pending',
        priority: 'normal',
        due_date: '2025-12-31T23:59:59Z',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockRequest,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await signatureRequestService.getSignatureRequestById('1')

      expect(result).toEqual(mockRequest)
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1')
    })

    it('should throw error when signature request not found', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Signature request not found' }
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      await expect(signatureRequestService.getSignatureRequestById('999')).rejects.toThrow('Signature request not found')
    })
  })

  describe('createSignatureRequest', () => {
    it('should create new signature request', async () => {
      const newRequest = {
        document_id: 'doc-1',
        requester_id: 'user-1',
        signer_id: 'user-2',
        priority: 'normal',
        due_date: '2025-12-31T23:59:59Z'
      }

      const mockCreatedRequest = {
        id: '3',
        ...newRequest,
        status: 'pending',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }

      const mockQuery = {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockCreatedRequest,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await signatureRequestService.createSignatureRequest(newRequest)

      expect(result).toEqual(mockCreatedRequest)
      expect(mockQuery.insert).toHaveBeenCalledWith(newRequest)
    })

    it('should validate required fields', async () => {
      const invalidRequest = {
        document_id: 'doc-1',
        // Missing required fields
      }

      await expect(signatureRequestService.createSignatureRequest(invalidRequest as any)).rejects.toThrow()
    })

    it('should validate priority', async () => {
      const invalidRequest = {
        document_id: 'doc-1',
        requester_id: 'user-1',
        signer_id: 'user-2',
        priority: 'invalid-priority',
        due_date: '2025-12-31T23:59:59Z'
      }

      await expect(signatureRequestService.createSignatureRequest(invalidRequest)).rejects.toThrow()
    })

    it('should validate due date', async () => {
      const invalidRequest = {
        document_id: 'doc-1',
        requester_id: 'user-1',
        signer_id: 'user-2',
        priority: 'normal',
        due_date: '2024-01-01T00:00:00Z' // Past date
      }

      await expect(signatureRequestService.createSignatureRequest(invalidRequest)).rejects.toThrow()
    })
  })

  describe('updateSignatureRequest', () => {
    it('should update existing signature request', async () => {
      const updates = {
        priority: 'high',
        due_date: '2025-12-31T23:59:59Z'
      }

      const mockUpdatedRequest = {
        id: '1',
        document_id: 'doc-1',
        requester_id: 'user-1',
        signer_id: 'user-2',
        status: 'pending',
        priority: 'high',
        due_date: '2025-12-31T23:59:59Z',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }

      const mockQuery = {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockUpdatedRequest,
                error: null
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await signatureRequestService.updateSignatureRequest('1', updates)

      expect(result).toEqual(mockUpdatedRequest)
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1')
    })

    it('should throw error when signature request not found for update', async () => {
      const updates = { priority: 'high' }

      const mockQuery = {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Signature request not found' }
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      await expect(signatureRequestService.updateSignatureRequest('999', updates)).rejects.toThrow('Signature request not found')
    })
  })

  describe('deleteSignatureRequest', () => {
    it('should delete signature request', async () => {
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

      await signatureRequestService.deleteSignatureRequest('1')

      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1')
    })

    it('should throw error when signature request not found for deletion', async () => {
      const mockQuery = {
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Signature request not found' }
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      await expect(signatureRequestService.deleteSignatureRequest('999')).rejects.toThrow('Signature request not found')
    })
  })

  describe('approveSignatureRequest', () => {
    it('should approve signature request', async () => {
      const mockApprovedRequest = {
        id: '1',
        document_id: 'doc-1',
        requester_id: 'user-1',
        signer_id: 'user-2',
        status: 'signed',
        priority: 'normal',
        due_date: '2025-12-31T23:59:59Z',
        signed_at: '2025-01-01T00:00:00Z',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }

      const mockQuery = {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockApprovedRequest,
                error: null
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await signatureRequestService.approveSignatureRequest('1')

      expect(result).toEqual(mockApprovedRequest)
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1')
    })

    it('should throw error when signature request not found for approval', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Signature request not found' }
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      await expect(signatureRequestService.approveSignatureRequest('999')).rejects.toThrow('Signature request not found')
    })
  })

  describe('rejectSignatureRequest', () => {
    it('should reject signature request', async () => {
      const mockRejectedRequest = {
        id: '1',
        document_id: 'doc-1',
        requester_id: 'user-1',
        signer_id: 'user-2',
        status: 'rejected',
        priority: 'normal',
        due_date: '2025-12-31T23:59:59Z',
        rejected_at: '2025-01-01T00:00:00Z',
        rejection_reason: 'Document needs revision',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }

      const mockQuery = {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockRejectedRequest,
                error: null
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await signatureRequestService.rejectSignatureRequest('1', 'Document needs revision')

      expect(result).toEqual(mockRejectedRequest)
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1')
    })

    it('should throw error when signature request not found for rejection', async () => {
      const mockQuery = {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Signature request not found' }
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      await expect(signatureRequestService.rejectSignatureRequest('999', 'Reason')).rejects.toThrow('Signature request not found')
    })
  })

  describe('getSignatureRequestsByRequester', () => {
    it('should return signature requests by requester', async () => {
      const mockRequests = [
        {
          id: '1',
          document_id: 'doc-1',
          requester_id: 'user-1',
          signer_id: 'user-2',
          status: 'pending',
          priority: 'normal',
          due_date: '2025-12-31T23:59:59Z',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockRequests,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await signatureRequestService.getSignatureRequestsByRequester('user-1')

      expect(result).toEqual(mockRequests)
      expect(mockQuery.eq).toHaveBeenCalledWith('requester_id', 'user-1')
    })
  })

  describe('getSignatureRequestsBySigner', () => {
    it('should return signature requests by signer', async () => {
      const mockRequests = [
        {
          id: '1',
          document_id: 'doc-1',
          requester_id: 'user-1',
          signer_id: 'user-2',
          status: 'pending',
          priority: 'normal',
          due_date: '2025-12-31T23:59:59Z',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockRequests,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await signatureRequestService.getSignatureRequestsBySigner('user-2')

      expect(result).toEqual(mockRequests)
      expect(mockQuery.eq).toHaveBeenCalledWith('signer_id', 'user-2')
    })
  })

  describe('getPendingSignatureRequests', () => {
    it('should return pending signature requests', async () => {
      const mockRequests = [
        {
          id: '1',
          document_id: 'doc-1',
          requester_id: 'user-1',
          signer_id: 'user-2',
          status: 'pending',
          priority: 'normal',
          due_date: '2025-12-31T23:59:59Z',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockRequests,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await signatureRequestService.getPendingSignatureRequests()

      expect(result).toEqual(mockRequests)
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'pending')
    })
  })

  describe('getOverdueSignatureRequests', () => {
    it('should return overdue signature requests', async () => {
      const mockRequests = [
        {
          id: '1',
          document_id: 'doc-1',
          requester_id: 'user-1',
          signer_id: 'user-2',
          status: 'pending',
          priority: 'normal',
          due_date: '2024-01-01T00:00:00Z',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockRequests,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await signatureRequestService.getOverdueSignatureRequests()

      expect(result).toEqual(mockRequests)
    })
  })

  describe('validateSignatureRequestData', () => {
    it('should validate signature request data structure', () => {
      const validRequest = {
        document_id: 'doc-1',
        requester_id: 'user-1',
        signer_id: 'user-2',
        priority: 'normal',
        due_date: '2025-12-31T23:59:59Z'
      }

      expect(() => signatureRequestService.validateSignatureRequestData(validRequest)).not.toThrow()
    })

    it('should throw error for missing required fields', () => {
      const invalidRequest = {
        document_id: 'doc-1',
        // Missing required fields
      }

      expect(() => signatureRequestService.validateSignatureRequestData(invalidRequest as any)).toThrow()
    })

    it('should throw error for invalid priority', () => {
      const invalidRequest = {
        document_id: 'doc-1',
        requester_id: 'user-1',
        signer_id: 'user-2',
        priority: 'invalid-priority',
        due_date: '2025-12-31T23:59:59Z'
      }

      expect(() => signatureRequestService.validateSignatureRequestData(invalidRequest)).toThrow()
    })

    it('should throw error for past due date', () => {
      const invalidRequest = {
        document_id: 'doc-1',
        requester_id: 'user-1',
        signer_id: 'user-2',
        priority: 'normal',
        due_date: '2024-01-01T00:00:00Z' // Past date
      }

      expect(() => signatureRequestService.validateSignatureRequestData(invalidRequest)).toThrow()
    })
  })
})