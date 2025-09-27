import { describe, it, expect, vi, beforeEach } from 'vitest'
import { EventConflictService, createEventConflictService } from '../../../backend/src/services/event-conflicts'

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      lte: vi.fn(() => ({
        gte: vi.fn(() => ({
          neq: vi.fn(() => ({
            eq: vi.fn(() => ({
              data: [],
              error: null,
              count: 0
            }))
          }))
        }))
      }))
    }))
  }))
}

// Mock createClient
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => mockSupabase)
}))

describe('EventConflictService', () => {
  let conflictService: EventConflictService

  beforeEach(() => {
    vi.clearAllMocks()
    conflictService = new EventConflictService('http://test.supabase.co', 'test-key')
  })

  describe('checkConflicts', () => {
    it('should return no conflicts for valid event', async () => {
      const request = {
        start_datetime: '2025-01-15T10:00:00Z',
        end_datetime: '2025-01-15T12:00:00Z',
        venue_en: 'Conference Room A'
      }

      // Mock no overlapping events
      mockSupabase.from().select().lte().gte().neq().eq().data = []

      const result = await conflictService.checkConflicts(request)

      expect(result.hasConflicts).toBe(false)
      expect(result.conflicts).toHaveLength(0)
    })

    it('should detect venue conflicts', async () => {
      const request = {
        start_datetime: '2025-01-15T10:00:00Z',
        end_datetime: '2025-01-15T12:00:00Z',
        venue_en: 'Conference Room A'
      }

      const conflictingEvent = {
        id: 'event-1',
        title_en: 'Existing Event',
        start_datetime: '2025-01-15T11:00:00Z',
        end_datetime: '2025-01-15T13:00:00Z'
      }

      mockSupabase.from().select().lte().gte().neq().eq().data = [conflictingEvent]

      const result = await conflictService.checkConflicts(request)

      expect(result.hasConflicts).toBe(true)
      expect(result.conflicts).toHaveLength(1)
      expect(result.conflicts[0].type).toBe('venue')
      expect(result.conflicts[0].severity).toBe('high')
      expect(result.conflicts[0].message).toContain('Venue already booked')
    })

    it('should detect participant conflicts', async () => {
      const request = {
        start_datetime: '2025-01-15T10:00:00Z',
        end_datetime: '2025-01-15T12:00:00Z',
        participantIds: ['user-1', 'user-2']
      }

      const conflictingEvent = {
        id: 'event-1',
        title_en: 'Existing Event',
        start_datetime: '2025-01-15T11:00:00Z',
        end_datetime: '2025-01-15T13:00:00Z'
      }

      mockSupabase.from().select().lte().gte().neq().data = [conflictingEvent]

      // Mock random to simulate participant conflict
      vi.spyOn(Math, 'random').mockReturnValue(0.8) // 80% chance of conflict

      const result = await conflictService.checkConflicts(request)

      expect(result.hasConflicts).toBe(true)
      expect(result.conflicts.some(c => c.type === 'participant')).toBe(true)
    })

    it('should detect organizer conflicts', async () => {
      const request = {
        start_datetime: '2025-01-15T10:00:00Z',
        end_datetime: '2025-01-15T12:00:00Z',
        organizer_id: 'org-1'
      }

      const conflictingEvent = {
        id: 'event-1',
        title_en: 'Existing Event',
        start_datetime: '2025-01-15T11:00:00Z',
        end_datetime: '2025-01-15T13:00:00Z'
      }

      mockSupabase.from().select().lte().gte().neq().eq().data = [conflictingEvent]

      const result = await conflictService.checkConflicts(request)

      expect(result.hasConflicts).toBe(true)
      expect(result.conflicts.some(c => c.type === 'organizer')).toBe(true)
    })

    it('should detect holiday conflicts', async () => {
      const request = {
        start_datetime: '2025-09-23T10:00:00Z', // Saudi National Day
        end_datetime: '2025-09-23T12:00:00Z',
        countryId: 'country-sa'
      }

      // Mock country lookup
      mockSupabase.from().select().eq().single().data = { iso_code_2: 'SA' }

      const result = await conflictService.checkConflicts(request)

      expect(result.hasConflicts).toBe(true)
      expect(result.conflicts.some(c => c.type === 'holiday')).toBe(true)
    })

    it('should detect resource conflicts during peak hours', async () => {
      const request = {
        start_datetime: '2025-01-15T09:00:00Z', // Peak morning hour
        end_datetime: '2025-01-15T11:00:00Z'
      }

      // Mock high event count during peak hours
      mockSupabase.from().select().lte().gte().neq().count = 6

      const result = await conflictService.checkConflicts(request)

      expect(result.hasConflicts).toBe(true)
      expect(result.conflicts.some(c => c.type === 'resource')).toBe(true)
    })

    it('should generate warnings for weekend events', async () => {
      const request = {
        start_datetime: '2025-01-18T10:00:00Z', // Saturday
        end_datetime: '2025-01-18T12:00:00Z'
      }

      mockSupabase.from().select().lte().gte().neq().eq().data = []

      const result = await conflictService.checkConflicts(request)

      expect(result.warnings).toContain('Event scheduled during weekend')
    })

    it('should generate warnings for outside working hours', async () => {
      const request = {
        start_datetime: '2025-01-15T19:00:00Z', // 7 PM
        end_datetime: '2025-01-15T21:00:00Z'
      }

      mockSupabase.from().select().lte().gte().neq().eq().data = []

      const result = await conflictService.checkConflicts(request)

      expect(result.warnings).toContain('Event scheduled outside standard working hours')
    })

    it('should generate suggestions when conflicts exist', async () => {
      const request = {
        start_datetime: '2025-01-15T10:00:00Z',
        end_datetime: '2025-01-15T12:00:00Z',
        venue_en: 'Conference Room A'
      }

      const conflictingEvent = {
        id: 'event-1',
        title_en: 'Existing Event',
        start_datetime: '2025-01-15T11:00:00Z',
        end_datetime: '2025-01-15T13:00:00Z'
      }

      mockSupabase.from().select().lte().gte().neq().eq().data = [conflictingEvent]

      const result = await conflictService.checkConflicts(request)

      expect(result.suggestions).toBeDefined()
      expect(result.suggestions?.alternativeTimeSlots).toBeDefined()
      expect(result.suggestions?.alternativeVenues).toBeDefined()
    })

    it('should exclude the same event when checking conflicts', async () => {
      const request = {
        eventId: 'event-1',
        start_datetime: '2025-01-15T10:00:00Z',
        end_datetime: '2025-01-15T12:00:00Z',
        venue_en: 'Conference Room A'
      }

      mockSupabase.from().select().lte().gte().neq().eq().data = []

      await conflictService.checkConflicts(request)

      expect(mockSupabase.from().select().lte().gte().neq).toHaveBeenCalledWith('id', 'event-1')
    })
  })

  describe('findAvailableSlot', () => {
    it('should find available slot within constraints', async () => {
      const constraints = {
        earliestDate: new Date('2025-01-15'),
        latestDate: new Date('2025-01-20'),
        avoidWeekends: true
      }

      // Mock no conflicts for the found slot
      mockSupabase.from().select().lte().gte().neq().eq().data = []

      const result = await conflictService.findAvailableSlot(120, constraints) // 2 hours

      expect(result).toBeDefined()
      expect(result?.start).toBeInstanceOf(Date)
      expect(result?.end).toBeInstanceOf(Date)
    })

    it('should return null when no available slot found', async () => {
      const constraints = {
        earliestDate: new Date('2025-01-15'),
        latestDate: new Date('2025-01-16'),
        avoidWeekends: true
      }

      // Mock conflicts for all slots
      const conflictingEvent = {
        id: 'event-1',
        title_en: 'Existing Event',
        start_datetime: '2025-01-15T09:00:00Z',
        end_datetime: '2025-01-15T11:00:00Z'
      }

      mockSupabase.from().select().lte().gte().neq().eq().data = [conflictingEvent]

      const result = await conflictService.findAvailableSlot(120, constraints)

      expect(result).toBeNull()
    })

    it('should respect preferred times', async () => {
      const constraints = {
        earliestDate: new Date('2025-01-15'),
        latestDate: new Date('2025-01-16'),
        preferredTimes: [
          { hour: 10, minute: 30 },
          { hour: 15, minute: 0 }
        ]
      }

      mockSupabase.from().select().lte().gte().neq().eq().data = []

      const result = await conflictService.findAvailableSlot(60, constraints)

      expect(result).toBeDefined()
      if (result) {
        const hour = result.start.getHours()
        expect([10, 15]).toContain(hour)
      }
    })
  })

  describe('calculateOverlap', () => {
    it('should calculate overlap between two time ranges', () => {
      const start1 = new Date('2025-01-15T10:00:00Z')
      const end1 = new Date('2025-01-15T12:00:00Z')
      const start2 = new Date('2025-01-15T11:00:00Z')
      const end2 = new Date('2025-01-15T13:00:00Z')

      const overlap = (conflictService as any).calculateOverlap(start1, end1, start2, end2)

      expect(overlap).toBeDefined()
      expect(overlap?.durationMinutes).toBe(60) // 1 hour overlap
    })

    it('should return undefined for non-overlapping ranges', () => {
      const start1 = new Date('2025-01-15T10:00:00Z')
      const end1 = new Date('2025-01-15T12:00:00Z')
      const start2 = new Date('2025-01-15T14:00:00Z')
      const end2 = new Date('2025-01-15T16:00:00Z')

      const overlap = (conflictService as any).calculateOverlap(start1, end1, start2, end2)

      expect(overlap).toBeUndefined()
    })
  })

  describe('isWeekend', () => {
    it('should identify Friday as weekend', () => {
      const friday = new Date('2025-01-17T10:00:00Z') // Friday
      const isWeekend = (conflictService as any).isWeekend(friday)
      expect(isWeekend).toBe(true)
    })

    it('should identify Saturday as weekend', () => {
      const saturday = new Date('2025-01-18T10:00:00Z') // Saturday
      const isWeekend = (conflictService as any).isWeekend(saturday)
      expect(isWeekend).toBe(true)
    })

    it('should identify Sunday as weekday', () => {
      const sunday = new Date('2025-01-19T10:00:00Z') // Sunday
      const isWeekend = (conflictService as any).isWeekend(sunday)
      expect(isWeekend).toBe(false)
    })
  })

  describe('isOutsideWorkingHours', () => {
    it('should identify early morning as outside working hours', () => {
      const earlyMorning = new Date('2025-01-15T07:00:00Z') // 7 AM
      const isOutside = (conflictService as any).isOutsideWorkingHours(earlyMorning)
      expect(isOutside).toBe(true)
    })

    it('should identify evening as outside working hours', () => {
      const evening = new Date('2025-01-15T18:00:00Z') // 6 PM
      const isOutside = (conflictService as any).isOutsideWorkingHours(evening)
      expect(isOutside).toBe(true)
    })

    it('should identify working hours as inside', () => {
      const workingHour = new Date('2025-01-15T10:00:00Z') // 10 AM
      const isOutside = (conflictService as any).isOutsideWorkingHours(workingHour)
      expect(isOutside).toBe(false)
    })
  })

  describe('getDurationMinutes', () => {
    it('should calculate duration in minutes', () => {
      const start = new Date('2025-01-15T10:00:00Z')
      const end = new Date('2025-01-15T12:00:00Z')
      const duration = (conflictService as any).getDurationMinutes(start, end)
      expect(duration).toBe(120) // 2 hours
    })
  })

  describe('createEventConflictService factory', () => {
    it('should create an EventConflictService instance', () => {
      const service = createEventConflictService('http://test.supabase.co', 'test-key')
      expect(service).toBeInstanceOf(EventConflictService)
    })
  })
})