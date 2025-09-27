import { describe, it, expect, beforeEach, vi } from 'vitest'
import { WordAssistantService } from '../../../backend/src/services/WordAssistantService'
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

describe('WordAssistantService', () => {
  let wordAssistantService: WordAssistantService

  beforeEach(() => {
    wordAssistantService = new WordAssistantService()
    vi.clearAllMocks()
  })

  describe('getAllWordAssistantEntries', () => {
    it('should return all word assistant entries with pagination', async () => {
      const mockEntries = [
        {
          id: '1',
          word: 'diplomatic',
          definition: 'Relating to diplomacy or international relations',
          context: 'diplomatic relations',
          language: 'en',
          category: 'diplomacy',
          usage_examples: ['diplomatic immunity', 'diplomatic mission'],
          synonyms: ['ambassadorial', 'consular'],
          antonyms: ['undiplomatic', 'rude'],
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        },
        {
          id: '2',
          word: 'protocol',
          definition: 'The official procedure or system of rules',
          context: 'diplomatic protocol',
          language: 'en',
          category: 'diplomacy',
          usage_examples: ['protocol officer', 'protocol violation'],
          synonyms: ['procedure', 'etiquette'],
          antonyms: ['informality', 'casualness'],
          created_at: '2025-01-02T00:00:00Z',
          updated_at: '2025-01-02T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            range: vi.fn().mockResolvedValue({
              data: mockEntries,
              error: null,
              count: 2
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await wordAssistantService.getAllWordAssistantEntries({
        page: 1,
        limit: 10
      })

      expect(result.data).toEqual(mockEntries)
      expect(result.pagination.total).toBe(2)
      expect(supabaseAdmin.from).toHaveBeenCalledWith('word_assistant')
    })

    it('should filter entries by language', async () => {
      const mockEntries = [
        {
          id: '1',
          word: 'diplomatic',
          definition: 'Relating to diplomacy or international relations',
          context: 'diplomatic relations',
          language: 'en',
          category: 'diplomacy',
          usage_examples: ['diplomatic immunity', 'diplomatic mission'],
          synonyms: ['ambassadorial', 'consular'],
          antonyms: ['undiplomatic', 'rude'],
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: mockEntries,
                error: null,
                count: 1
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await wordAssistantService.getAllWordAssistantEntries({
        page: 1,
        limit: 10,
        language: 'en'
      })

      expect(result.data).toEqual(mockEntries)
      expect(mockQuery.eq).toHaveBeenCalledWith('language', 'en')
    })

    it('should filter entries by category', async () => {
      const mockEntries = [
        {
          id: '1',
          word: 'diplomatic',
          definition: 'Relating to diplomacy or international relations',
          context: 'diplomatic relations',
          language: 'en',
          category: 'diplomacy',
          usage_examples: ['diplomatic immunity', 'diplomatic mission'],
          synonyms: ['ambassadorial', 'consular'],
          antonyms: ['undiplomatic', 'rude'],
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: mockEntries,
                error: null,
                count: 1
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await wordAssistantService.getAllWordAssistantEntries({
        page: 1,
        limit: 10,
        category: 'diplomacy'
      })

      expect(result.data).toEqual(mockEntries)
      expect(mockQuery.eq).toHaveBeenCalledWith('category', 'diplomacy')
    })

    it('should search entries by word', async () => {
      const mockEntries = [
        {
          id: '1',
          word: 'diplomatic',
          definition: 'Relating to diplomacy or international relations',
          context: 'diplomatic relations',
          language: 'en',
          category: 'diplomacy',
          usage_examples: ['diplomatic immunity', 'diplomatic mission'],
          synonyms: ['ambassadorial', 'consular'],
          antonyms: ['undiplomatic', 'rude'],
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          ilike: vi.fn().mockReturnValue({
            order: vi.fn().mockReturnValue({
              range: vi.fn().mockResolvedValue({
                data: mockEntries,
                error: null,
                count: 1
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await wordAssistantService.getAllWordAssistantEntries({
        page: 1,
        limit: 10,
        search: 'diplomatic'
      })

      expect(result.data).toEqual(mockEntries)
      expect(mockQuery.ilike).toHaveBeenCalledWith('word', '%diplomatic%')
    })
  })

  describe('getWordAssistantEntryById', () => {
    it('should return word assistant entry by ID', async () => {
      const mockEntry = {
        id: '1',
        word: 'diplomatic',
        definition: 'Relating to diplomacy or international relations',
        context: 'diplomatic relations',
        language: 'en',
        category: 'diplomacy',
        usage_examples: ['diplomatic immunity', 'diplomatic mission'],
        synonyms: ['ambassadorial', 'consular'],
        antonyms: ['undiplomatic', 'rude'],
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockEntry,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await wordAssistantService.getWordAssistantEntryById('1')

      expect(result).toEqual(mockEntry)
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1')
    })

    it('should throw error when word assistant entry not found', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Word assistant entry not found' }
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      await expect(wordAssistantService.getWordAssistantEntryById('999')).rejects.toThrow('Word assistant entry not found')
    })
  })

  describe('createWordAssistantEntry', () => {
    it('should create new word assistant entry', async () => {
      const newEntry = {
        word: 'ambassador',
        definition: 'A diplomatic representative of a country',
        context: 'diplomatic relations',
        language: 'en',
        category: 'diplomacy',
        usage_examples: ['ambassador to France', 'ambassador plenipotentiary'],
        synonyms: ['envoy', 'representative'],
        antonyms: ['citizen', 'resident']
      }

      const mockCreatedEntry = {
        id: '3',
        ...newEntry,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }

      const mockQuery = {
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: mockCreatedEntry,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await wordAssistantService.createWordAssistantEntry(newEntry)

      expect(result).toEqual(mockCreatedEntry)
      expect(mockQuery.insert).toHaveBeenCalledWith(newEntry)
    })

    it('should validate required fields', async () => {
      const invalidEntry = {
        word: 'ambassador',
        // Missing required fields
      }

      await expect(wordAssistantService.createWordAssistantEntry(invalidEntry as any)).rejects.toThrow()
    })

    it('should validate language code', async () => {
      const invalidEntry = {
        word: 'ambassador',
        definition: 'A diplomatic representative of a country',
        context: 'diplomatic relations',
        language: 'invalid-lang',
        category: 'diplomacy',
        usage_examples: ['ambassador to France'],
        synonyms: ['envoy'],
        antonyms: ['citizen']
      }

      await expect(wordAssistantService.createWordAssistantEntry(invalidEntry)).rejects.toThrow()
    })

    it('should validate category', async () => {
      const invalidEntry = {
        word: 'ambassador',
        definition: 'A diplomatic representative of a country',
        context: 'diplomatic relations',
        language: 'en',
        category: 'invalid-category',
        usage_examples: ['ambassador to France'],
        synonyms: ['envoy'],
        antonyms: ['citizen']
      }

      await expect(wordAssistantService.createWordAssistantEntry(invalidEntry)).rejects.toThrow()
    })

    it('should validate word format', async () => {
      const invalidEntry = {
        word: '', // Empty word
        definition: 'A diplomatic representative of a country',
        context: 'diplomatic relations',
        language: 'en',
        category: 'diplomacy',
        usage_examples: ['ambassador to France'],
        synonyms: ['envoy'],
        antonyms: ['citizen']
      }

      await expect(wordAssistantService.createWordAssistantEntry(invalidEntry)).rejects.toThrow()
    })
  })

  describe('updateWordAssistantEntry', () => {
    it('should update existing word assistant entry', async () => {
      const updates = {
        definition: 'Updated definition',
        usage_examples: ['updated example']
      }

      const mockUpdatedEntry = {
        id: '1',
        word: 'diplomatic',
        definition: 'Updated definition',
        context: 'diplomatic relations',
        language: 'en',
        category: 'diplomacy',
        usage_examples: ['updated example'],
        synonyms: ['ambassadorial', 'consular'],
        antonyms: ['undiplomatic', 'rude'],
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }

      const mockQuery = {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: mockUpdatedEntry,
                error: null
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await wordAssistantService.updateWordAssistantEntry('1', updates)

      expect(result).toEqual(mockUpdatedEntry)
      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1')
    })

    it('should throw error when word assistant entry not found for update', async () => {
      const updates = { definition: 'Updated definition' }

      const mockQuery = {
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              single: vi.fn().mockResolvedValue({
                data: null,
                error: { message: 'Word assistant entry not found' }
              })
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      await expect(wordAssistantService.updateWordAssistantEntry('999', updates)).rejects.toThrow('Word assistant entry not found')
    })
  })

  describe('deleteWordAssistantEntry', () => {
    it('should delete word assistant entry', async () => {
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

      await wordAssistantService.deleteWordAssistantEntry('1')

      expect(mockQuery.eq).toHaveBeenCalledWith('id', '1')
    })

    it('should throw error when word assistant entry not found for deletion', async () => {
      const mockQuery = {
        delete: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            single: vi.fn().mockResolvedValue({
              data: null,
              error: { message: 'Word assistant entry not found' }
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      await expect(wordAssistantService.deleteWordAssistantEntry('999')).rejects.toThrow('Word assistant entry not found')
    })
  })

  describe('searchWordAssistantEntries', () => {
    it('should search word assistant entries by word', async () => {
      const mockEntries = [
        {
          id: '1',
          word: 'diplomatic',
          definition: 'Relating to diplomacy or international relations',
          context: 'diplomatic relations',
          language: 'en',
          category: 'diplomacy',
          usage_examples: ['diplomatic immunity', 'diplomatic mission'],
          synonyms: ['ambassadorial', 'consular'],
          antonyms: ['undiplomatic', 'rude'],
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          or: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockEntries,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await wordAssistantService.searchWordAssistantEntries('diplomatic')

      expect(result).toEqual(mockEntries)
    })
  })

  describe('getWordAssistantEntriesByLanguage', () => {
    it('should return word assistant entries by language', async () => {
      const mockEntries = [
        {
          id: '1',
          word: 'diplomatic',
          definition: 'Relating to diplomacy or international relations',
          context: 'diplomatic relations',
          language: 'en',
          category: 'diplomacy',
          usage_examples: ['diplomatic immunity', 'diplomatic mission'],
          synonyms: ['ambassadorial', 'consular'],
          antonyms: ['undiplomatic', 'rude'],
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockEntries,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await wordAssistantService.getWordAssistantEntriesByLanguage('en')

      expect(result).toEqual(mockEntries)
      expect(mockQuery.eq).toHaveBeenCalledWith('language', 'en')
    })
  })

  describe('getWordAssistantEntriesByCategory', () => {
    it('should return word assistant entries by category', async () => {
      const mockEntries = [
        {
          id: '1',
          word: 'diplomatic',
          definition: 'Relating to diplomacy or international relations',
          context: 'diplomatic relations',
          language: 'en',
          category: 'diplomacy',
          usage_examples: ['diplomatic immunity', 'diplomatic mission'],
          synonyms: ['ambassadorial', 'consular'],
          antonyms: ['undiplomatic', 'rude'],
          created_at: '2025-01-01T00:00:00Z',
          updated_at: '2025-01-01T00:00:00Z'
        }
      ]

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            order: vi.fn().mockResolvedValue({
              data: mockEntries,
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await wordAssistantService.getWordAssistantEntriesByCategory('diplomacy')

      expect(result).toEqual(mockEntries)
      expect(mockQuery.eq).toHaveBeenCalledWith('category', 'diplomacy')
    })
  })

  describe('getRandomWordAssistantEntry', () => {
    it('should return random word assistant entry', async () => {
      const mockEntry = {
        id: '1',
        word: 'diplomatic',
        definition: 'Relating to diplomacy or international relations',
        context: 'diplomatic relations',
        language: 'en',
        category: 'diplomacy',
        usage_examples: ['diplomatic immunity', 'diplomatic mission'],
        synonyms: ['ambassadorial', 'consular'],
        antonyms: ['undiplomatic', 'rude'],
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z'
      }

      const mockQuery = {
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: [mockEntry],
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await wordAssistantService.getRandomWordAssistantEntry()

      expect(result).toEqual(mockEntry)
    })

    it('should return null when no entries found', async () => {
      const mockQuery = {
        select: vi.fn().mockReturnValue({
          order: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue({
              data: [],
              error: null
            })
          })
        })
      }

      vi.mocked(supabaseAdmin.from).mockReturnValue(mockQuery as any)

      const result = await wordAssistantService.getRandomWordAssistantEntry()

      expect(result).toBeNull()
    })
  })

  describe('validateWordAssistantEntryData', () => {
    it('should validate word assistant entry data structure', () => {
      const validEntry = {
        word: 'diplomatic',
        definition: 'Relating to diplomacy or international relations',
        context: 'diplomatic relations',
        language: 'en',
        category: 'diplomacy',
        usage_examples: ['diplomatic immunity', 'diplomatic mission'],
        synonyms: ['ambassadorial', 'consular'],
        antonyms: ['undiplomatic', 'rude']
      }

      expect(() => wordAssistantService.validateWordAssistantEntryData(validEntry)).not.toThrow()
    })

    it('should throw error for missing required fields', () => {
      const invalidEntry = {
        word: 'diplomatic',
        // Missing required fields
      }

      expect(() => wordAssistantService.validateWordAssistantEntryData(invalidEntry as any)).toThrow()
    })

    it('should throw error for invalid language code', () => {
      const invalidEntry = {
        word: 'diplomatic',
        definition: 'Relating to diplomacy or international relations',
        context: 'diplomatic relations',
        language: 'invalid-lang',
        category: 'diplomacy',
        usage_examples: ['diplomatic immunity'],
        synonyms: ['ambassadorial'],
        antonyms: ['undiplomatic']
      }

      expect(() => wordAssistantService.validateWordAssistantEntryData(invalidEntry)).toThrow()
    })

    it('should throw error for invalid category', () => {
      const invalidEntry = {
        word: 'diplomatic',
        definition: 'Relating to diplomacy or international relations',
        context: 'diplomatic relations',
        language: 'en',
        category: 'invalid-category',
        usage_examples: ['diplomatic immunity'],
        synonyms: ['ambassadorial'],
        antonyms: ['undiplomatic']
      }

      expect(() => wordAssistantService.validateWordAssistantEntryData(invalidEntry)).toThrow()
    })

    it('should throw error for empty word', () => {
      const invalidEntry = {
        word: '', // Empty word
        definition: 'Relating to diplomacy or international relations',
        context: 'diplomatic relations',
        language: 'en',
        category: 'diplomacy',
        usage_examples: ['diplomatic immunity'],
        synonyms: ['ambassadorial'],
        antonyms: ['undiplomatic']
      }

      expect(() => wordAssistantService.validateWordAssistantEntryData(invalidEntry)).toThrow()
    })
  })
})