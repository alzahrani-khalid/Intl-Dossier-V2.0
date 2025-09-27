import { describe, it, expect, beforeEach, vi } from 'vitest'
import { EventService } from '../../../backend/src/services/EventService'
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
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
      })),
      delete: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: vi.fn(),
        })),
      })),
    })),
  },
}))

describe('EventService', () => {
  let eventService: EventService

  beforeEach(() => {
    eventService = new EventService()
    vi.clearAllMocks()
  })

  describe('getAllEvents', () => {
    it('should return all events with pagination', async () => {
      const mockEvents = [
        {
          id: '1',
          title_en: 'Test Event',
          title_ar: 'فعالية تجريبية',
          type: 'meeting',
          start_datetime: '2025-01-15T10:00:00Z',
          end_datetime: '2025-01-15T12:00:00Z',
          timezone: 'UTC',
          organizer_id: 'org-1',
          created_by: 'user-1',
          status: 'scheduled'
        },
        {
          id: '2',
          title_en: 'Another Event',
          title_ar: 'فعالية أخرى',
          type: 'conference',
          start_datetime: '2025-01-20T09:00:00Z',
          end_datetime: '2025-01-20T17:00:00Z',
          timezone: 'UTC',
          organizer_id: 'org-2',
          created_by: 'user-2',
          status: 'scheduled'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({
              data: mockEvents,
              error: null,
              count: 2
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await eventService.getAllEvents({
        page: 1,
        limit: 10
      })

      expect(result.data).toEqual(mockEvents)
      expect(result.pagination.total).toBe(2)
      expect(supabaseAdmin.from).toHaveBeenCalledWith('events')
    })

    it('should filter events by type', async () => {
      const mockEvents = [
        {
          id: '1',
          title_en: 'Test Meeting',
          title_ar: 'اجتماع تجريبي',
          type: 'meeting',
          start_datetime: '2025-01-15T10:00:00Z',
          end_datetime: '2025-01-15T12:00:00Z',
          timezone: 'UTC',
          organizer_id: 'org-1',
          created_by: 'user-1',
          status: 'scheduled'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: mockEvents,
                error: null,
                count: 1
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await eventService.getAllEvents({
        page: 1,
        limit: 10,
        type: 'meeting'
      })

      expect(result.data).toEqual(mockEvents)
      expect(mockQuery.eq).toHaveBeenCalledWith('type', 'meeting')
    })

    it('should filter events by status', async () => {
      const mockEvents = [
        {
          id: '1',
          title_en: 'Scheduled Event',
          title_ar: 'فعالية مجدولة',
          type: 'meeting',
          start_datetime: '2025-01-15T10:00:00Z',
          end_datetime: '2025-01-15T12:00:00Z',
          timezone: 'UTC',
          organizer_id: 'org-1',
          created_by: 'user-1',
          status: 'scheduled'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: mockEvents,
                error: null,
                count: 1
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await eventService.getAllEvents({
        page: 1,
        limit: 10,
        status: 'scheduled'
      })

      expect(result.data).toEqual(mockEvents)
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'scheduled')
    })

    it('should filter events by date range', async () => {
      const mockEvents = [
        {
          id: '1',
          title_en: 'Event in Range',
          title_ar: 'فعالية في النطاق',
          type: 'meeting',
          start_datetime: '2025-01-15T10:00:00Z',
          end_datetime: '2025-01-15T12:00:00Z',
          timezone: 'UTC',
          organizer_id: 'org-1',
          created_by: 'user-1',
          status: 'scheduled'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                range: vi.fn().mockResolvedValue({
                  data: mockEvents,
                  error: null,
                  count: 1
                })
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await eventService.getAllEvents({
        page: 1,
        limit: 10,
        start_date_from: '2025-01-01T00:00:00Z',
        start_date_to: '2025-01-31T23:59:59Z'
      })

      expect(result.data).toEqual(mockEvents)
    })

    it('should filter events by organizer', async () => {
      const mockEvents = [
        {
          id: '1',
          title_en: 'Organized Event',
          title_ar: 'فعالية منظمة',
          type: 'meeting',
          start_datetime: '2025-01-15T10:00:00Z',
          end_datetime: '2025-01-15T12:00:00Z',
          timezone: 'UTC',
          organizer_id: 'org-1',
          created_by: 'user-1',
          status: 'scheduled'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: mockEvents,
                error: null,
                count: 1
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await eventService.getAllEvents({
        page: 1,
        limit: 10,
        organizer_id: 'org-1'
      })

      expect(result.data).toEqual(mockEvents)
      expect(mockQuery.eq).toHaveBeenCalledWith('organizer_id', 'org-1')
    })
  })

  describe('getEventById', () => {
    it('should return event by ID', async () => {
      const mockEvent = {
        id: '1',
        title_en: 'Test Event',
        title_ar: 'فعالية تجريبية',
        type: 'meeting',
        start_datetime: '2025-01-15T10:00:00Z',
        end_datetime: '2025-01-15T12:00:00Z',
        timezone: 'UTC',
        organizer_id: 'org-1',
        created_by: 'user-1',
        status: 'scheduled'
      }

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockEvent,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await eventService.getEventById('1')

      expect(result).toEqual(mockEvent)
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1')
    })

    it('should throw error when event not found', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Event not found' }
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      await expect(eventService.getEventById('999')).rejects.toThrow('Event not found')
    })
  })

  describe('createEvent', () => {
    it('should create new event', async () => {
      const newEvent = {
        title_en: 'New Event',
        title_ar: 'فعالية جديدة',
        type: 'meeting',
        start_datetime: '2025-01-15T10:00:00Z',
        end_datetime: '2025-01-15T12:00:00Z',
        timezone: 'UTC',
        organizer_id: 'org-1',
        created_by: 'user-1'
      }

      const mockCreatedEvent = {
        id: '3',
        ...newEvent,
        status: 'draft',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }

      const mockQuery = {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockCreatedEvent,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await eventService.createEvent(newEvent)

      expect(result).toEqual(mockCreatedEvent)
      expect(mockQuery.insert).toHaveBeenCalledWith(newEvent)
    })

    it('should validate required fields', async () => {
      const invalidEvent = {
        title_en: 'New Event',
        // Missing required fields
      }

      await expect(eventService.createEvent(invalidEvent as any)).rejects.toThrow()
    })

    it('should validate date range', async () => {
      const invalidEvent = {
        title_en: 'New Event',
        title_ar: 'فعالية جديدة',
        type: 'meeting',
        start_datetime: '2025-01-15T12:00:00Z', // End before start
        end_datetime: '2025-01-15T10:00:00Z',
        timezone: 'UTC',
        organizer_id: 'org-1',
        created_by: 'user-1'
      }

      await expect(eventService.createEvent(invalidEvent)).rejects.toThrow()
    })

    it('should validate virtual event requirements', async () => {
      const invalidEvent = {
        title_en: 'Virtual Event',
        title_ar: 'فعالية افتراضية',
        type: 'meeting',
        start_datetime: '2025-01-15T10:00:00Z',
        end_datetime: '2025-01-15T12:00:00Z',
        timezone: 'UTC',
        organizer_id: 'org-1',
        created_by: 'user-1',
        is_virtual: true
        // Missing virtual_link
      }

      await expect(eventService.createEvent(invalidEvent as any)).rejects.toThrow()
    })
  })

  describe('updateEvent', () => {
    it('should update existing event', async () => {
      const updates = {
        title_en: 'Updated Event Title',
        title_ar: 'عنوان الفعالية المحدث',
        description_en: 'Updated description'
      }

      const mockUpdatedEvent = {
        id: '1',
        title_en: 'Updated Event Title',
        title_ar: 'عنوان الفعالية المحدث',
        description_en: 'Updated description',
        type: 'meeting',
        start_datetime: '2025-01-15T10:00:00Z',
        end_datetime: '2025-01-15T12:00:00Z',
        timezone: 'UTC',
        organizer_id: 'org-1',
        created_by: 'user-1',
        status: 'scheduled',
        updated_at: '2025-01-01T00:00:00Z'
      }

      const mockQuery = {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockUpdatedEvent,
                error: null
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await eventService.updateEvent('1', updates)

      expect(result).toEqual(mockUpdatedEvent)
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1')
    })

    it('should throw error when event not found for update', async () => {
      const updates = { title_en: 'Updated Title' }

      const mockQuery = {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Event not found' }
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      await expect(eventService.updateEvent('999', updates)).rejects.toThrow('Event not found')
    })
  })

  describe('deleteEvent', () => {
    it('should delete event', async () => {
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

      await eventService.deleteEvent('1')

      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1')
    })

    it('should throw error when event not found for deletion', async () => {
      const mockQuery = {
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Event not found' }
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      await expect(eventService.deleteEvent('999')).rejects.toThrow('Event not found')
    })
  })

  describe('checkEventConflicts', () => {
    it('should check for event conflicts', async () => {
      const mockConflicts = [
        {
          conflicting_event: {
            id: '2',
            title_en: 'Conflicting Event',
            title_ar: 'فعالية متضاربة',
            start_datetime: '2025-01-15T11:00:00Z',
            end_datetime: '2025-01-15T13:00:00Z'
          },
          conflict_type: 'venue',
          conflict_details: 'Same venue at overlapping time'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              neq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: mockConflicts,
                  error: null
                })
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await eventService.checkEventConflicts('1')

      expect(result).toEqual(mockConflicts)
    })

    it('should return empty array when no conflicts found', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            lte: vi.fn().mockReturnValue({
              neq: vi.fn().mockReturnValue({
                eq: vi.fn().mockResolvedValue({
                  data: [],
                  error: null
                })
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await eventService.checkEventConflicts('1')

      expect(result).toEqual([])
    })
  })

  describe('getEventsByType', () => {
    it('should return events by type', async () => {
      const mockEvents = [
        {
          id: '1',
          title_en: 'Test Meeting',
          title_ar: 'اجتماع تجريبي',
          type: 'meeting',
          start_datetime: '2025-01-15T10:00:00Z',
          end_datetime: '2025-01-15T12:00:00Z',
          timezone: 'UTC',
          organizer_id: 'org-1',
          created_by: 'user-1',
          status: 'scheduled'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockEvents,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await eventService.getEventsByType('meeting')

      expect(result).toEqual(mockEvents)
      expect(mockQuery.eq).toHaveBeenCalledWith('type', 'meeting')
    })
  })

  describe('getEventsByOrganizer', () => {
    it('should return events by organizer', async () => {
      const mockEvents = [
        {
          id: '1',
          title_en: 'Organized Event',
          title_ar: 'فعالية منظمة',
          type: 'meeting',
          start_datetime: '2025-01-15T10:00:00Z',
          end_datetime: '2025-01-15T12:00:00Z',
          timezone: 'UTC',
          organizer_id: 'org-1',
          created_by: 'user-1',
          status: 'scheduled'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockEvents,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await eventService.getEventsByOrganizer('org-1')

      expect(result).toEqual(mockEvents)
      expect(mockQuery.eq).toHaveBeenCalledWith('organizer_id', 'org-1')
    })
  })

  describe('getUpcomingEvents', () => {
    it('should return upcoming events', async () => {
      const mockEvents = [
        {
          id: '1',
          title_en: 'Upcoming Event',
          title_ar: 'فعالية قادمة',
          type: 'meeting',
          start_datetime: '2025-01-15T10:00:00Z',
          end_datetime: '2025-01-15T12:00:00Z',
          timezone: 'UTC',
          organizer_id: 'org-1',
          created_by: 'user-1',
          status: 'scheduled'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          gte: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockEvents,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await eventService.getUpcomingEvents()

      expect(result).toEqual(mockEvents)
    })
  })

  describe('searchEvents', () => {
    it('should search events by multiple criteria', async () => {
      const mockEvents = [
        {
          id: '1',
          title_en: 'Test Event',
          title_ar: 'فعالية تجريبية',
          type: 'meeting',
          start_datetime: '2025-01-15T10:00:00Z',
          end_datetime: '2025-01-15T12:00:00Z',
          timezone: 'UTC',
          organizer_id: 'org-1',
          created_by: 'user-1',
          status: 'scheduled'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          ilike: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                range: vi.fn().mockResolvedValue({
                  data: mockEvents,
                  error: null,
                  count: 1
                })
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await eventService.searchEvents({
        query: 'Test',
        type: 'meeting',
        organizer_id: 'org-1'
      })

      expect(result.data).toEqual(mockEvents)
    })

    it('should handle empty search results', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnValue({
          ilike: vi.fn().mockReturnValue({
            or: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                range: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                  count: 0
                })
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await eventService.searchEvents({
        query: 'NonExistentEvent'
      })

      expect(result.data).toEqual([])
      expect(result.pagination.total).toBe(0)
    })
  })

  describe('validateEventData', () => {
    it('should validate event data structure', () => {
      const validEvent = {
        title_en: 'Test Event',
        title_ar: 'فعالية تجريبية',
        type: 'meeting',
        start_datetime: '2025-01-15T10:00:00Z',
        end_datetime: '2025-01-15T12:00:00Z',
        timezone: 'UTC',
        organizer_id: 'org-1',
        created_by: 'user-1'
      }

      expect(() => eventService.validateEventData(validEvent)).not.toThrow()
    })

    it('should throw error for missing required fields', () => {
      const invalidEvent = {
        title_en: 'Test Event',
        // Missing required fields
      }

      expect(() => eventService.validateEventData(invalidEvent as any)).toThrow()
    })

    it('should throw error for invalid date range', () => {
      const invalidEvent = {
        title_en: 'Test Event',
        title_ar: 'فعالية تجريبية',
        type: 'meeting',
        start_datetime: '2025-01-15T12:00:00Z', // End before start
        end_datetime: '2025-01-15T10:00:00Z',
        timezone: 'UTC',
        organizer_id: 'org-1',
        created_by: 'user-1'
      }

      expect(() => eventService.validateEventData(invalidEvent)).toThrow()
    })

    it('should throw error for invalid event type', () => {
      const invalidEvent = {
        title_en: 'Test Event',
        title_ar: 'فعالية تجريبية',
        type: 'invalid-type',
        start_datetime: '2025-01-15T10:00:00Z',
        end_datetime: '2025-01-15T12:00:00Z',
        timezone: 'UTC',
        organizer_id: 'org-1',
        created_by: 'user-1'
      }

      expect(() => eventService.validateEventData(invalidEvent)).toThrow()
    })
  })
})
