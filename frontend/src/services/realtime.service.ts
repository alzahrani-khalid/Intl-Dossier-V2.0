/**
 * Supabase Realtime Service
 *
 * Manages WebSocket connections for real-time updates to assignments and queue.
 * Provides automatic reconnection with exponential backoff for reliability.
 */

import { RealtimeChannel, RealtimePostgresChangesPayload } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

type AssignmentPayload = RealtimePostgresChangesPayload<{
  id: string;
  work_item_id: string;
  work_item_type: string;
  assignee_id: string;
  sla_deadline: string;
  priority: string;
  status: string;
  warning_sent_at: string | null;
  escalated_at: string | null;
}>;

type QueuePayload = RealtimePostgresChangesPayload<{
  id: string;
  work_item_id: string;
  work_item_type: string;
  priority: string;
  created_at: string;
}>;

export interface RealtimeServiceConfig {
  userId?: string;
  unitId?: string;
  onAssignmentUpdate?: (payload: AssignmentPayload) => void;
  onQueueUpdate?: (payload: QueuePayload) => void;
  onError?: (error: Error) => void;
}

export class RealtimeService {
  private assignmentChannel: RealtimeChannel | null = null;
  private queueChannel: RealtimeChannel | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectDelay = 1000; // Start with 1 second
  private isConnected = false;

  constructor(private config: RealtimeServiceConfig) {}

  /**
   * Subscribe to assignment updates for a specific user
   */
  async subscribeToAssignments(): Promise<void> {
    if (!this.config.userId) {
      throw new Error('userId is required to subscribe to assignments');
    }

    try {
      // Unsubscribe from existing channel if present
      if (this.assignmentChannel) {
        await this.assignmentChannel.unsubscribe();
      }

      this.assignmentChannel = supabase
        .channel('assignment-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'assignments',
            filter: `assignee_id=eq.${this.config.userId}`,
          },
          (payload: AssignmentPayload) => {
            this.handleAssignmentUpdate(payload);
          }
        )
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            this.isConnected = true;
            this.reconnectAttempts = 0;
            console.log('[Realtime] Connected to assignment updates');
          } else if (status === 'CHANNEL_ERROR') {
            this.handleConnectionError(new Error('Assignment channel error'));
          } else if (status === 'TIMED_OUT') {
            this.handleConnectionError(new Error('Assignment channel timeout'));
          }
        });
    } catch (error) {
      this.handleConnectionError(error as Error);
    }
  }

  /**
   * Subscribe to queue updates for a specific unit (supervisors/admins only)
   */
  async subscribeToQueue(): Promise<void> {
    try {
      // Unsubscribe from existing channel if present
      if (this.queueChannel) {
        await this.queueChannel.unsubscribe();
      }

      const channelConfig = this.config.unitId
        ? {
            event: '*' as const,
            schema: 'public' as const,
            table: 'assignment_queue' as const,
            filter: `target_unit_id=eq.${this.config.unitId}`,
          }
        : {
            event: '*' as const,
            schema: 'public' as const,
            table: 'assignment_queue' as const,
          };

      this.queueChannel = supabase
        .channel('queue-updates')
        .on('postgres_changes', channelConfig, (payload: QueuePayload) => {
          this.handleQueueUpdate(payload);
        })
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log('[Realtime] Connected to queue updates');
          } else if (status === 'CHANNEL_ERROR') {
            this.handleConnectionError(new Error('Queue channel error'));
          } else if (status === 'TIMED_OUT') {
            this.handleConnectionError(new Error('Queue channel timeout'));
          }
        });
    } catch (error) {
      this.handleConnectionError(error as Error);
    }
  }

  /**
   * Unsubscribe from all channels
   */
  async unsubscribe(): Promise<void> {
    const promises: Promise<'ok' | 'timed out' | 'error'>[] = [];

    if (this.assignmentChannel) {
      promises.push(this.assignmentChannel.unsubscribe());
      this.assignmentChannel = null;
    }

    if (this.queueChannel) {
      promises.push(this.queueChannel.unsubscribe());
      this.queueChannel = null;
    }

    await Promise.all(promises);
    this.isConnected = false;
    console.log('[Realtime] Unsubscribed from all channels');
  }

  /**
   * Handle assignment update events
   */
  private handleAssignmentUpdate(payload: AssignmentPayload): void {
    if (this.config.onAssignmentUpdate) {
      this.config.onAssignmentUpdate(payload);
    }
  }

  /**
   * Handle queue update events
   */
  private handleQueueUpdate(payload: QueuePayload): void {
    if (this.config.onQueueUpdate) {
      this.config.onQueueUpdate(payload);
    }
  }

  /**
   * Handle connection errors with exponential backoff reconnection
   */
  private handleConnectionError(error: Error): void {
    console.error('[Realtime] Connection error:', error);

    if (this.config.onError) {
      this.config.onError(error);
    }

    // Attempt reconnection with exponential backoff
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

      console.log(
        `[Realtime] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`
      );

      setTimeout(async () => {
        try {
          if (this.config.userId) {
            await this.subscribeToAssignments();
          }
          if (this.config.unitId !== undefined) {
            await this.subscribeToQueue();
          }
        } catch (reconnectError) {
          console.error('[Realtime] Reconnection failed:', reconnectError);
        }
      }, delay);
    } else {
      console.error('[Realtime] Max reconnection attempts reached. Please refresh the page.');
    }
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  /**
   * Reset reconnection attempts (call after successful manual reconnection)
   */
  resetReconnectionAttempts(): void {
    this.reconnectAttempts = 0;
  }
}

/**
 * Create a new Realtime service instance
 */
export function createRealtimeService(config: RealtimeServiceConfig): RealtimeService {
  return new RealtimeService(config);
}
