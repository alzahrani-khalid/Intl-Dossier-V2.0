import { describe, it, expect, beforeEach, vi } from 'vitest'
import { EventsService } from '../../../backend/src/services/EventsService'
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

describe('EventsService', () => {
  let eventsService: EventsService

  beforeEach(() => {
    eventsService = new EventsService()
    vi.clearAllMocks()
  })

  describe('getAllEvents', () => {
    it('should return all events with pagination', async () => {
      const mockEvents = [
        {
          id: '1',
          title: 'UN General Assembly',
          description: 'Annual meeting of the United Nations General Assembly',
          event_type: 'conference',
          start_date: '2025-09-15T00:00:00Z',
          end_date: '2025-09-30T23:59:59Z',
          location: 'New York, NY, USA',
          venue: 'United Nations Headquarters',
          organizer: 'United Nations',
          status: 'scheduled',
          capacity: 1000,
          registration_required: true,
          registration_deadline: '2025-09-01T23:59:59Z',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        },
        {
          id: '2',
          title: 'G7 Summit',
          description: 'Annual summit of G7 leaders',
          event_type: 'summit',
          start_date: '2025-06-10T00:00:00Z',
          end_date: '2025-06-12T23:59:59Z',
          location: 'Tokyo, Japan',
          venue: 'Tokyo International Forum',
          organizer: 'Government of Japan',
          status: 'scheduled',
          capacity: 500,
          registration_required: false,
          created_at: '2025-01-02T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z'
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

      const result = await eventsService.getAllEvents({
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
          title: 'UN General Assembly',
          description: 'Annual meeting of the United Nations General Assembly',
          event_type: 'conference',
          start_date: '2025-09-15T00:00:00Z',
          end_date: '2025-09-30T23:59:59Z',
          location: 'New York, NY, USA',
          venue: 'United Nations Headquarters',
          organizer: 'United Nations',
          status: 'scheduled',
          capacity: 1000,
          registration_required: true,
          registration_deadline: '2025-09-01T23:59:59Z',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
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

      const result = await eventsService.getAllEvents({
        page: 1,
        limit: 10,
        event_type: 'conference'
      })

      expect(result.data).toEqual(mockEvents)
      expect(mockQuery.eq).toHaveBeenCalledWith('event_type', 'conference')
    })

    it('should filter events by status', async () => {
      const mockEvents = [
        {
          id: '1',
          title: 'UN General Assembly',
          description: 'Annual meeting of the United Nations General Assembly',
          event_type: 'conference',
          start_date: '2025-09-15T00:00:00Z',
          end_date: '2025-09-30T23:59:59Z',
          location: 'New York, NY, USA',
          venue: 'United Nations Headquarters',
          organizer: 'United Nations',
          status: 'scheduled',
          capacity: 1000,
          registration_required: true,
          registration_deadline: '2025-09-01T23:59:59Z',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
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

      const result = await eventsService.getAllEvents({
        page: 1,
        limit: 10,
        status: 'scheduled'
      })

      expect(result.data).toEqual(mockEvents)
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'scheduled')
    })

    it('should filter events by organizer', async () => {
      const mockEvents = [
        {
          id: '1',
          title: 'UN General Assembly',
          description: 'Annual meeting of the United Nations General Assembly',
          event_type: 'conference',
          start_date: '2025-09-15T00:00:00Z',
          end_date: '2025-09-30T23:59:59Z',
          location: 'New York, NY, USA',
          venue: 'United Nations Headquarters',
          organizer: 'United Nations',
          status: 'scheduled',
          capacity: 1000,
          registration_required: true,
          registration_deadline: '2025-09-01T23:59:59Z',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
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

      const result = await eventsService.getAllEvents({
        page: 1,
        limit: 10,
        organizer: 'United Nations'
      })

      expect(result.data).toEqual(mockEvents)
      expect(mockQuery.eq).toHaveBeenCalledWith('organizer', 'United Nations')
    })

    it('should filter events by location', async () => {
      const mockEvents = [
        {
          id: '1',
          title: 'UN General Assembly',
          description: 'Annual meeting of the United Nations General Assembly',
          event_type: 'conference',
          start_date: '2025-09-15T00:00:00Z',
          end_date: '2025-09-30T23:59:59Z',
          location: 'New York, NY, USA',
          venue: 'United Nations Headquarters',
          organizer: 'United Nations',
          status: 'scheduled',
          capacity: 1000,
          registration_required: true,
          registration_deadline: '2025-09-01T23:59:59Z',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          ilike: vi.fn().mockReturnValue({
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

      const result = await eventsService.getAllEvents({
        page: 1,
        limit: 10,
        location: 'New York'
      })

      expect(result.data).toEqual(mockEvents)
      expect(mockQuery.ilike).toHaveBeenCalledWith('location', '%New York%')
    })

    it('should filter events by date range', async () => {
      const mockEvents = [
        {
          id: '1',
          title: 'UN General Assembly',
          description: 'Annual meeting of the United Nations General Assembly',
          event_type: 'conference',
          start_date: '2025-09-15T00:00:00Z',
          end_date: '2025-09-30T23:59:59Z',
          location: 'New York, NY, USA',
          venue: 'United Nations Headquarters',
          organizer: 'United Nations',
          status: 'scheduled',
          capacity: 1000,
          registration_required: true,
          registration_deadline: '2025-09-01T23:59:59Z',
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

      const result = await eventsService.getAllEvents({
        page: 1,
        limit: 10,
        start_date_from: '2025-09-01T00:00:00Z',
        start_date_to: '2025-09-30T23:59:59Z'
      })

      expect(result.data).toEqual(mockEvents)
    })

    it('should filter events by registration requirement', async () => {
      const mockEvents = [
        {
          id: '1',
          title: 'UN General Assembly',
          description: 'Annual meeting of the United Nations General Assembly',
          event_type: 'conference',
          start_date: '2025-09-15T00:00:00Z',
          end_date: '2025-09-30T23:59:59Z',
          location: 'New York, NY, USA',
          venue: 'United Nations Headquarters',
          organizer: 'United Nations',
          status: 'scheduled',
          capacity: 1000,
          registration_required: true,
          registration_deadline: '2025-09-01T23:59:59Z',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
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

      const result = await eventsService.getAllEvents({
        page: 1,
        limit: 10,
        registration_required: true
      })

      expect(result.data).toEqual(mockEvents)
      expect(mockQuery.eq).toHaveBeenCalledWith('registration_required', true)
    })
  })

  describe('getEventById', () => {
    it('should return event by ID', async () => {
      const mockEvent = {
        id: '1',
        title: 'UN General Assembly',
        description: 'Annual meeting of the United Nations General Assembly',
        event_type: 'conference',
        start_date: '2025-09-15T00:00:00Z',
        end_date: '2025-09-30T23:59:59Z',
        location: 'New York, NY, USA',
        venue: 'United Nations Headquarters',
        organizer: 'United Nations',
        status: 'scheduled',
        capacity: 1000,
        registration_required: true,
        registration_deadline: '2025-09-01T23:59:59Z',
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
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

      const result = await eventsService.getEventById('1')

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

      await expect(eventsService.getEventById('999')).rejects.toThrow('Event not found')
    })
  })

  describe('createEvent', () => {
    it('should create new event', async () => {
      const newEvent = {
        title: 'New Event',
        description: 'A new event',
        event_type: 'conference',
        start_date: '2025-12-01T00:00:00Z',
        end_date: '2025-12-03T23:59:59Z',
        location: 'New York, NY, USA',
        venue: 'New Venue',
        organizer: 'New Organizer',
        status: 'scheduled',
        capacity: 500,
        registration_required: true,
        registration_deadline: '2025-11-15T23:59:59Z'
      }

      const mockCreatedEvent = {
        id: '3',
        ...newEvent,
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

      const result = await eventsService.createEvent(newEvent)

      expect(result).toEqual(mockCreatedEvent)
      expect(mockQuery.insert).toHaveBeenCalledWith(newEvent)
    })

    it('should validate required fields', async () => {
      const invalidEvent = {
        title: 'New Event',
        // Missing required fields
      }

      await expect(eventsService.createEvent(invalidEvent as any)).rejects.toThrow()
    })

    it('should validate event type', async () => {
      const invalidEvent = {
        title: 'New Event',
        description: 'A new event',
        event_type: 'invalid-type',
        start_date: '2025-12-01T00:00:00Z',
        end_date: '2025-12-03T23:59:59Z',
        location: 'New York, NY, USA',
        venue: 'New Venue',
        organizer: 'New Organizer',
        status: 'scheduled',
        capacity: 500,
        registration_required: true,
        registration_deadline: '2025-11-15T23:59:59Z'
      }

      await expect(eventsService.createEvent(invalidEvent)).rejects.toThrow()
    })

    it('should validate status', async () => {
      const invalidEvent = {
        title: 'New Event',
        description: 'A new event',
        event_type: 'conference',
        start_date: '2025-12-01T00:00:00Z',
        end_date: '2025-12-03T23:59:59Z',
        location: 'New York, NY, USA',
        venue: 'New Venue',
        organizer: 'New Organizer',
        status: 'invalid-status',
        capacity: 500,
        registration_required: true,
        registration_deadline: '2025-11-15T23:59:59Z'
      }

      await expect(eventsService.createEvent(invalidEvent)).rejects.toThrow()
    })

    it('should validate date range', async () => {
      const invalidEvent = {
        title: 'New Event',
        description: 'A new event',
        event_type: 'conference',
        start_date: '2025-12-03T00:00:00Z', // Start date after end date
        end_date: '2025-12-01T23:59:59Z',
        location: 'New York, NY, USA',
        venue: 'New Venue',
        organizer: 'New Organizer',
        status: 'scheduled',
        capacity: 500,
        registration_required: true,
        registration_deadline: '2025-11-15T23:59:59Z'
      }

      await expect(eventsService.createEvent(invalidEvent)).rejects.toThrow()
    })

    it('should validate capacity', async () => {
      const invalidEvent = {
        title: 'New Event',
        description: 'A new event',
        event_type: 'conference',
        start_date: '2025-12-01T00:00:00Z',
        end_date: '2025-12-03T23:59:59Z',
        location: 'New York, NY, USA',
        venue: 'New Venue',
        organizer: 'New Organizer',
        status: 'scheduled',
        capacity: -100, // Negative capacity
        registration_required: true,
        registration_deadline: '2025-11-15T23:59:59Z'
      }

      await expect(eventsService.createEvent(invalidEvent)).rejects.toThrow()
    })
  })

  describe('updateEvent', () => {
    it('should update existing event', async () => {
      const updates = {
        title: 'Updated Event',
        capacity: 750
      }

      const mockUpdatedEvent = {
        id: '1',
        title: 'Updated Event',
        description: 'Annual meeting of the United Nations General Assembly',
        event_type: 'conference',
        start_date: '2025-09-15T00:00:00Z',
        end_date: '2025-09-30T23:59:59Z',
        location: 'New York, NY, USA',
        venue: 'United Nations Headquarters',
        organizer: 'United Nations',
        status: 'scheduled',
        capacity: 750,
        registration_required: true,
        registration_deadline: '2025-09-01T23:59:59Z',
        created_at: '2025-01-01T00:00:00Z',
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

      const result = await eventsService.updateEvent('1', updates)

      expect(result).toEqual(mockUpdatedEvent)
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1')
    })

    it('should throw error when event not found for update', async () => {
      const updates = { title: 'Updated Event' }

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

      await expect(eventsService.updateEvent('999', updates)).rejects.toThrow('Event not found')
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

      await eventsService.deleteEvent('1')

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

      await expect(eventsService.deleteEvent('999')).rejects.toThrow('Event not found')
    })
  })

  describe('searchEvents', () => {
    it('should search events by title', async () => {
      const mockEvents = [
        {
          id: '1',
          title: 'UN General Assembly',
          description: 'Annual meeting of the United Nations General Assembly',
          event_type: 'conference',
          start_date: '2025-09-15T00:00:00Z',
          end_date: '2025-09-30T23:59:59Z',
          location: 'New York, NY, USA',
          venue: 'United Nations Headquarters',
          organizer: 'United Nations',
          status: 'scheduled',
          capacity: 1000,
          registration_required: true,
          registration_deadline: '2025-09-01T23:59:59Z',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          or: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockEvents,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await eventsService.searchEvents('UN General')

      expect(result).toEqual(mockEvents)
    })
  })

  describe('getEventsByType', () => {
    it('should return events by type', async () => {
      const mockEvents = [
        {
          id: '1',
          title: 'UN General Assembly',
          description: 'Annual meeting of the United Nations General Assembly',
          event_type: 'conference',
          start_date: '2025-09-15T00:00:00Z',
          end_date: '2025-09-30T23:59:59Z',
          location: 'New York, NY, USA',
          venue: 'United Nations Headquarters',
          organizer: 'United Nations',
          status: 'scheduled',
          capacity: 1000,
          registration_required: true,
          registration_deadline: '2025-09-01T23:59:59Z',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
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

      const result = await eventsService.getEventsByType('conference')

      expect(result).toEqual(mockEvents)
      expect(mockQuery.eq).toHaveBeenCalledWith('event_type', 'conference')
    })
  })

  describe('getEventsByStatus', () => {
    it('should return events by status', async () => {
      const mockEvents = [
        {
          id: '1',
          title: 'UN General Assembly',
          description: 'Annual meeting of the United Nations General Assembly',
          event_type: 'conference',
          start_date: '2025-09-15T00:00:00Z',
          end_date: '2025-09-30T23:59:59Z',
          location: 'New York, NY, USA',
          venue: 'United Nations Headquarters',
          organizer: 'United Nations',
          status: 'scheduled',
          capacity: 1000,
          registration_required: true,
          registration_deadline: '2025-09-01T23:59:59Z',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
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

      const result = await eventsService.getEventsByStatus('scheduled')

      expect(result).toEqual(mockEvents)
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'scheduled')
    })
  })

  describe('getEventsByOrganizer', () => {
    it('should return events by organizer', async () => {
      const mockEvents = [
        {
          id: '1',
          title: 'UN General Assembly',
          description: 'Annual meeting of the United Nations General Assembly',
          event_type: 'conference',
          start_date: '2025-09-15T00:00:00Z',
          end_date: '2025-09-30T23:59:59Z',
          location: 'New York, NY, USA',
          venue: 'United Nations Headquarters',
          organizer: 'United Nations',
          status: 'scheduled',
          capacity: 1000,
          registration_required: true,
          registration_deadline: '2025-09-01T23:59:59Z',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
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

      const result = await eventsService.getEventsByOrganizer('United Nations')

      expect(result).toEqual(mockEvents)
      expect(mockQuery.eq).toHaveBeenCalledWith('organizer', 'United Nations')
    })
  })

  describe('getEventsByLocation', () => {
    it('should return events by location', async () => {
      const mockEvents = [
        {
          id: '1',
          title: 'UN General Assembly',
          description: 'Annual meeting of the United Nations General Assembly',
          event_type: 'conference',
          start_date: '2025-09-15T00:00:00Z',
          end_date: '2025-09-30T23:59:59Z',
          location: 'New York, NY, USA',
          venue: 'United Nations Headquarters',
          organizer: 'United Nations',
          status: 'scheduled',
          capacity: 1000,
          registration_required: true,
          registration_deadline: '2025-09-01T23:59:59Z',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          ilike: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockEvents,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await eventsService.getEventsByLocation('New York')

      expect(result).toEqual(mockEvents)
      expect(mockQuery.ilike).toHaveBeenCalledWith('location', '%New York%')
    })
  })

  describe('getUpcomingEvents', () => {
    it('should return upcoming events', async () => {
      const mockEvents = [
        {
          id: '1',
          title: 'UN General Assembly',
          description: 'Annual meeting of the United Nations General Assembly',
          event_type: 'conference',
          start_date: '2025-09-15T00:00:00Z',
          end_date: '2025-09-30T23:59:59Z',
          location: 'New York, NY, USA',
          venue: 'United Nations Headquarters',
          organizer: 'United Nations',
          status: 'scheduled',
          capacity: 1000,
          registration_required: true,
          registration_deadline: '2025-09-01T23:59:59Z',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
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

      const result = await eventsService.getUpcomingEvents()

      expect(result).toEqual(mockEvents)
    })
  })

  describe('getPastEvents', () => {
    it('should return past events', async () => {
      const mockEvents = [
        {
          id: '1',
          title: 'Past Event',
          description: 'A past event',
          event_type: 'conference',
          start_date: '2024-09-15T00:00:00Z',
          end_date: '2024-09-30T23:59:59Z',
          location: 'New York, NY, USA',
          venue: 'United Nations Headquarters',
          organizer: 'United Nations',
          status: 'completed',
          capacity: 1000,
          registration_required: true,
          registration_deadline: '2024-09-01T23:59:59Z',
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          lt: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockEvents,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await eventsService.getPastEvents()

      expect(result).toEqual(mockEvents)
    })
  })

  describe('validateEventData', () => {
    it('should validate event data structure', () => {
      const validEvent = {
        title: 'New Event',
        description: 'A new event',
        event_type: 'conference',
        start_date: '2025-12-01T00:00:00Z',
        end_date: '2025-12-03T23:59:59Z',
        location: 'New York, NY, USA',
        venue: 'New Venue',
        organizer: 'New Organizer',
        status: 'scheduled',
        capacity: 500,
        registration_required: true,
        registration_deadline: '2025-11-15T23:59:59Z'
      }

      expect(() => eventsService.validateEventData(validEvent)).not.toThrow()
    })

    it('should throw error for missing required fields', () => {
      const invalidEvent = {
        title: 'New Event',
        // Missing required fields
      }

      expect(() => eventsService.validateEventData(invalidEvent as any)).toThrow()
    })

    it('should throw error for invalid event type', () => {
      const invalidEvent = {
        title: 'New Event',
        description: 'A new event',
        event_type: 'invalid-type',
        start_date: '2025-12-01T00:00:00Z',
        end_date: '2025-12-03T23:59:59Z',
        location: 'New York, NY, USA',
        venue: 'New Venue',
        organizer: 'New Organizer',
        status: 'scheduled',
        capacity: 500,
        registration_required: true,
        registration_deadline: '2025-11-15T23:59:59Z'
      }

      expect(() => eventsService.validateEventData(invalidEvent)).toThrow()
    })

    it('should throw error for invalid status', () => {
      const invalidEvent = {
        title: 'New Event',
        description: 'A new event',
        event_type: 'conference',
        start_date: '2025-12-01T00:00:00Z',
        end_date: '2025-12-03T23:59:59Z',
        location: 'New York, NY, USA',
        venue: 'New Venue',
        organizer: 'New Organizer',
        status: 'invalid-status',
        capacity: 500,
        registration_required: true,
        registration_deadline: '2025-11-15T23:59:59Z'
      }

      expect(() => eventsService.validateEventData(invalidEvent)).toThrow()
    })

    it('should throw error for invalid date range', () => {
      const invalidEvent = {
        title: 'New Event',
        description: 'A new event',
        event_type: 'conference',
        start_date: '2025-12-03T00:00:00Z', // Start date after end date
        end_date: '2025-12-01T23:59:59Z',
        location: 'New York, NY, USA',
        venue: 'New Venue',
        organizer: 'New Organizer',
        status: 'scheduled',
        capacity: 500,
        registration_required: true,
        registration_deadline: '2025-11-15T23:59:59Z'
      }

      expect(() => eventsService.validateEventData(invalidEvent)).toThrow()
    })

    it('should throw error for negative capacity', () => {
      const invalidEvent = {
        title: 'New Event',
        description: 'A new event',
        event_type: 'conference',
        start_date: '2025-12-01T00:00:00Z',
        end_date: '2025-12-03T23:59:59Z',
        location: 'New York, NY, USA',
        venue: 'New Venue',
        organizer: 'New Organizer',
        status: 'scheduled',
        capacity: -100, // Negative capacity
        registration_required: true,
        registration_deadline: '2025-11-15T23:59:59Z'
      }

      expect(() => eventsService.validateEventData(invalidEvent)).toThrow()
    })
  })
})