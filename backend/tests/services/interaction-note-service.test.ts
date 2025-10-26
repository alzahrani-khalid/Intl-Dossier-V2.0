/**
 * Tests for InteractionNoteService
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { InteractionNoteService } from '../../src/services/interaction-note-service';
import { createClient } from '@supabase/supabase-js';

// Mock Supabase client
const mockSupabase = {
  from: vi.fn(),
  storage: {
    from: vi.fn(),
  },
};

describe('InteractionNoteService', () => {
  let service: InteractionNoteService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new InteractionNoteService(mockSupabase as any);
  });

  describe('create', () => {
    it('should create an interaction note with valid data', async () => {
      const mockNote = {
        id: 'note-123',
        contact_id: 'contact-123',
        date: '2024-01-15',
        type: 'meeting',
        details: 'Discussed project timeline and deliverables',
        attendees: ['John Doe', 'Jane Smith'],
        attachments: null,
        created_by: 'user-123',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      };

      const mockContact = { id: 'contact-123' };

      // Mock contact exists check
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockReturnValueOnce({
              single: vi.fn().mockResolvedValueOnce({
                data: mockContact,
                error: null
              }),
            }),
          }),
        }),
      });

      // Mock note insertion
      mockSupabase.from.mockReturnValueOnce({
        insert: vi.fn().mockReturnValueOnce({
          select: vi.fn().mockReturnValueOnce({
            single: vi.fn().mockResolvedValueOnce({
              data: mockNote,
              error: null
            }),
          }),
        }),
      });

      const result = await service.create({
        contact_id: 'contact-123',
        date: '2024-01-15',
        type: 'meeting',
        details: 'Discussed project timeline and deliverables',
        attendees: ['John Doe', 'Jane Smith'],
        created_by: 'user-123',
      });

      expect(result).toEqual(mockNote);
      expect(mockSupabase.from).toHaveBeenCalledTimes(2);
    });

    it('should throw error if date is in future', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      await expect(
        service.create({
          contact_id: 'contact-123',
          date: futureDate.toISOString().split('T')[0],
          type: 'meeting',
          details: 'Future meeting notes',
          created_by: 'user-123',
        })
      ).rejects.toThrow('Interaction date cannot be in the future');
    });

    it('should throw error if details are too short', async () => {
      await expect(
        service.create({
          contact_id: 'contact-123',
          date: '2024-01-15',
          type: 'meeting',
          details: 'Short',
          created_by: 'user-123',
        })
      ).rejects.toThrow('details is required and must be at least 10 characters');
    });

    it('should throw error if details exceed 10000 characters', async () => {
      const longDetails = 'a'.repeat(10001);

      await expect(
        service.create({
          contact_id: 'contact-123',
          date: '2024-01-15',
          type: 'meeting',
          details: longDetails,
          created_by: 'user-123',
        })
      ).rejects.toThrow('details cannot exceed 10,000 characters');
    });

    it('should throw error for invalid interaction type', async () => {
      await expect(
        service.create({
          contact_id: 'contact-123',
          date: '2024-01-15',
          type: 'invalid-type' as any,
          details: 'Meeting notes with details',
          created_by: 'user-123',
        })
      ).rejects.toThrow('type must be one of: meeting, email, call, conference, other');
    });

    it('should validate attachment paths', async () => {
      await expect(
        service.create({
          contact_id: 'contact-123',
          date: '2024-01-15',
          type: 'meeting',
          details: 'Meeting notes with details',
          attachments: ['../../../etc/passwd'],
          created_by: 'user-123',
        })
      ).rejects.toThrow('Invalid attachment path detected');
    });

    it('should throw error if contact does not exist', async () => {
      // Mock contact not found
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            eq: vi.fn().mockReturnValueOnce({
              single: vi.fn().mockResolvedValueOnce({
                data: null,
                error: { code: 'PGRST116', message: 'Not found' }
              }),
            }),
          }),
        }),
      });

      await expect(
        service.create({
          contact_id: 'nonexistent-contact',
          date: '2024-01-15',
          type: 'meeting',
          details: 'Meeting notes with details',
          created_by: 'user-123',
        })
      ).rejects.toThrow('Contact not found or is archived');
    });
  });

  describe('getForContact', () => {
    it('should retrieve notes for a contact sorted by date DESC', async () => {
      const mockNotes = [
        {
          id: 'note-1',
          contact_id: 'contact-123',
          date: '2024-01-20',
          type: 'meeting',
          details: 'Recent meeting',
        },
        {
          id: 'note-2',
          contact_id: 'contact-123',
          date: '2024-01-15',
          type: 'call',
          details: 'Phone call discussion',
        },
      ];

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            order: vi.fn().mockReturnValueOnce({
              range: vi.fn().mockResolvedValueOnce({
                data: mockNotes,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await service.getForContact('contact-123');

      expect(result).toEqual(mockNotes);
      expect(mockSupabase.from).toHaveBeenCalledWith('cd_interaction_notes');
    });

    it('should apply date range filters', async () => {
      const mockNotes = [
        {
          id: 'note-1',
          contact_id: 'contact-123',
          date: '2024-01-18',
          type: 'meeting',
          details: 'Meeting within range',
        },
      ];

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            order: vi.fn().mockReturnValueOnce({
              gte: vi.fn().mockReturnValueOnce({
                lte: vi.fn().mockReturnValueOnce({
                  range: vi.fn().mockResolvedValueOnce({
                    data: mockNotes,
                    error: null,
                  }),
                }),
              }),
            }),
          }),
        }),
      });

      const result = await service.getForContact('contact-123', {
        dateFrom: '2024-01-15',
        dateTo: '2024-01-20',
      });

      expect(result).toEqual(mockNotes);
    });

    it('should filter by interaction type', async () => {
      const mockNotes = [
        {
          id: 'note-1',
          contact_id: 'contact-123',
          date: '2024-01-20',
          type: 'email',
          details: 'Email correspondence',
        },
      ];

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            order: vi.fn().mockReturnValueOnce({
              eq: vi.fn().mockReturnValueOnce({
                range: vi.fn().mockResolvedValueOnce({
                  data: mockNotes,
                  error: null,
                }),
              }),
            }),
          }),
        }),
      });

      const result = await service.getForContact('contact-123', {
        type: 'email',
      });

      expect(result).toEqual(mockNotes);
    });

    it('should throw error for invalid type filter', async () => {
      await expect(
        service.getForContact('contact-123', {
          type: 'invalid' as any,
        })
      ).rejects.toThrow('Invalid type: invalid. Must be one of: meeting, email, call, conference, other');
    });
  });

  describe('search', () => {
    it('should search notes with full-text search on details', async () => {
      const mockNotes = [
        {
          id: 'note-1',
          contact_id: 'contact-123',
          date: '2024-01-20',
          type: 'meeting',
          details: 'Discussed budget allocation',
        },
      ];

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          textSearch: vi.fn().mockReturnValueOnce({
            order: vi.fn().mockReturnValueOnce({
              range: vi.fn().mockResolvedValueOnce({
                data: mockNotes,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await service.search({
        query: 'budget',
      });

      expect(result).toEqual(mockNotes);
    });

    it('should filter by multiple interaction types', async () => {
      const mockNotes = [
        {
          id: 'note-1',
          contact_id: 'contact-123',
          date: '2024-01-20',
          type: 'meeting',
          details: 'Meeting notes',
        },
        {
          id: 'note-2',
          contact_id: 'contact-124',
          date: '2024-01-19',
          type: 'call',
          details: 'Call notes',
        },
      ];

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          in: vi.fn().mockReturnValueOnce({
            order: vi.fn().mockReturnValueOnce({
              range: vi.fn().mockResolvedValueOnce({
                data: mockNotes,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await service.search({
        types: ['meeting', 'call'],
      });

      expect(result).toEqual(mockNotes);
    });

    it('should filter by contact IDs', async () => {
      const mockNotes = [
        {
          id: 'note-1',
          contact_id: 'contact-123',
          date: '2024-01-20',
          type: 'meeting',
          details: 'Meeting notes',
        },
      ];

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          in: vi.fn().mockReturnValueOnce({
            order: vi.fn().mockReturnValueOnce({
              range: vi.fn().mockResolvedValueOnce({
                data: mockNotes,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await service.search({
        contactIds: ['contact-123', 'contact-124'],
      });

      expect(result).toEqual(mockNotes);
    });

    it('should throw error for invalid type in search', async () => {
      await expect(
        service.search({
          types: ['meeting', 'invalid'] as any,
        })
      ).rejects.toThrow('Invalid type: invalid. Must be one of: meeting, email, call, conference, other');
    });
  });

  describe('update', () => {
    it('should update interaction note with valid data', async () => {
      const updatedNote = {
        id: 'note-123',
        contact_id: 'contact-123',
        date: '2024-01-15',
        type: 'meeting',
        details: 'Updated meeting details with more information',
        updated_at: new Date().toISOString(),
      };

      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            select: vi.fn().mockReturnValueOnce({
              single: vi.fn().mockResolvedValueOnce({
                data: updatedNote,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await service.update('note-123', {
        details: 'Updated meeting details with more information',
      });

      expect(result).toEqual(updatedNote);
    });

    it('should throw error if updated date is in future', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      await expect(
        service.update('note-123', {
          date: futureDate.toISOString().split('T')[0],
        })
      ).rejects.toThrow('Interaction date cannot be in the future');
    });
  });

  describe('delete', () => {
    it('should delete interaction note', async () => {
      const deletedNote = {
        id: 'note-123',
        contact_id: 'contact-123',
        date: '2024-01-15',
        type: 'meeting',
        details: 'Meeting to be deleted',
      };

      mockSupabase.from.mockReturnValueOnce({
        delete: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            select: vi.fn().mockReturnValueOnce({
              single: vi.fn().mockResolvedValueOnce({
                data: deletedNote,
                error: null,
              }),
            }),
          }),
        }),
      });

      const result = await service.delete('note-123');

      expect(result).toEqual(deletedNote);
    });
  });

  describe('getStatistics', () => {
    it('should calculate statistics for interaction notes', async () => {
      const mockNotes = [
        { id: '1', type: 'meeting', date: '2024-01-20' },
        { id: '2', type: 'meeting', date: '2024-01-15' },
        { id: '3', type: 'email', date: '2024-01-10' },
        { id: '4', type: 'call', date: '2024-01-05' },
      ];

      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockResolvedValueOnce({
          data: mockNotes,
          error: null,
        }),
      });

      const result = await service.getStatistics();

      expect(result.totalNotes).toBe(4);
      expect(result.byType.meeting).toBe(2);
      expect(result.byType.email).toBe(1);
      expect(result.byType.call).toBe(1);
      expect(result.mostRecentDate).toBe('2024-01-20');
    });
  });

  describe('uploadAttachment', () => {
    it('should upload attachment and update note', async () => {
      const mockFile = new ArrayBuffer(100);
      const storagePath = 'interaction-notes/note-123/1234567890_document.pdf';

      // Mock storage upload
      mockSupabase.storage.from.mockReturnValueOnce({
        upload: vi.fn().mockResolvedValueOnce({
          data: { path: storagePath },
          error: null,
        }),
      });

      // Mock get existing note
      mockSupabase.from.mockReturnValueOnce({
        select: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockReturnValueOnce({
            single: vi.fn().mockResolvedValueOnce({
              data: { attachments: [] },
              error: null,
            }),
          }),
        }),
      });

      // Mock update note with attachment
      mockSupabase.from.mockReturnValueOnce({
        update: vi.fn().mockReturnValueOnce({
          eq: vi.fn().mockResolvedValueOnce({
            data: null,
            error: null,
          }),
        }),
      });

      const result = await service.uploadAttachment('note-123', mockFile, 'document.pdf');

      expect(result).toContain('interaction-notes/note-123/');
      expect(result).toContain('document.pdf');
    });

    it('should throw error for empty file name', async () => {
      await expect(
        service.uploadAttachment('note-123', new ArrayBuffer(100), '')
      ).rejects.toThrow('File name is required');
    });
  });
});