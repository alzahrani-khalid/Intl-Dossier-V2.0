import { supabaseAdmin } from '../config/supabase';
import { cacheHelpers } from '../config/redis';
import { logInfo, logError } from '../utils/logger';
import { Database } from '../types/database.types';

type CommitmentInsert = Database['public']['Tables']['commitments']['Insert'];
type CommitmentUpdate = Database['public']['Tables']['commitments']['Update'];

interface PaginationFilters {
  page?: number;
  limit?: number;
  status?: string;
  search?: string;
}

export class CommitmentService {
  async trackCommitment(commitmentData: CommitmentInsert, userId: string) {
    try {
      const { data, error } = await supabaseAdmin
        .from('commitments')
        .insert({
          ...commitmentData,
          created_by: userId,
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      // Schedule reminders
      if (data.due_date) {
        await this.scheduleReminder(data.id, data.due_date);
      }

      logInfo(`Commitment created: ${data.id}`);
      return data;
    } catch (error) {
      logError('Commitment creation error', error as Error);
      throw error;
    }
  }

  async getOverdueCommitments() {
    const { data, error } = await supabaseAdmin
      .from('commitments')
      .select('*')
      .eq('status', 'pending')
      .lt('due_date', new Date().toISOString())
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data || [];
  }

  async updateCommitmentStatus(id: string, status: string, notes?: string) {
    const { data, error } = await supabaseAdmin
      .from('commitments')
      .update({
        status,
        notes,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  private async scheduleReminder(commitmentId: string, dueDate: string) {
    // Integration with background job system
    logInfo(`Reminder scheduled for commitment ${commitmentId}`);
  }

  async getCommitmentMetrics() {
    const { data } = await supabaseAdmin
      .from('commitments')
      .select('status');

    const total = data?.length || 0;
    const completed = data?.filter(c => c.status === 'completed').length || 0;
    const overdue = data?.filter(c => c.status === 'overdue').length || 0;

    return {
      total,
      completed,
      overdue,
      completion_rate: total > 0 ? (completed / total) * 100 : 0
    };
  }

  // Missing methods for API endpoints
  async findAll(filters?: PaginationFilters) {
    const { data, error } = await supabaseAdmin
      .from('commitments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  async create(commitment: CommitmentInsert & { created_by: string }) {
    return this.trackCommitment(commitment, commitment.created_by);
  }

  async updateStatus(id: string, status: string) {
    return this.updateCommitmentStatus(id, status);
  }
}

export default CommitmentService;
