import { createClient } from '@supabase/supabase-js';
import { Database } from '../../types/database';

type MoU = Database['public']['Tables']['mous']['Row'];
type User = Database['public']['Tables']['users']['Row'];

export type WorkflowState = 
  | 'draft'
  | 'internal_review'
  | 'external_review'
  | 'negotiation'
  | 'signed'
  | 'active'
  | 'renewed'
  | 'expired';

export interface WorkflowTransition {
  from: WorkflowState;
  to: WorkflowState;
  label: string;
  requiredRole?: 'admin' | 'editor' | 'viewer';
  requiredFields?: Array<keyof MoU>;
  validationRules?: Array<(mou: MoU) => boolean | string>;
}

export interface TransitionRequest {
  mouId: string;
  fromState: WorkflowState;
  toState: WorkflowState;
  userId: string;
  comment?: string;
  metadata?: Record<string, any>;
}

export interface TransitionResult {
  success: boolean;
  newState?: WorkflowState;
  error?: string;
  warnings?: string[];
  auditLog?: {
    id: string;
    timestamp: string;
    userId: string;
    action: string;
  };
}

export class MoUWorkflowService {
  private supabase: ReturnType<typeof createClient<Database>>;
  private transitions: Map<string, WorkflowTransition>;

  constructor(supabaseUrl: string, supabaseKey: string) {
    this.supabase = createClient<Database>(supabaseUrl, supabaseKey);
    this.transitions = this.initializeTransitions();
  }

  private initializeTransitions(): Map<string, WorkflowTransition> {
    const transitions: WorkflowTransition[] = [
      // Draft transitions
      {
        from: 'draft',
        to: 'internal_review',
        label: 'Submit for Internal Review',
        requiredRole: 'editor',
        requiredFields: ['title_en', 'title_ar', 'primary_party_id', 'secondary_party_id'],
        validationRules: [
          (mou) => mou.primary_party_id !== mou.secondary_party_id || 'Primary and secondary parties must be different',
          (mou) => (mou.document_url && mou.document_url.length > 0) || 'Document must be uploaded'
        ]
      },
      
      // Internal review transitions
      {
        from: 'internal_review',
        to: 'external_review',
        label: 'Approve for External Review',
        requiredRole: 'admin',
        validationRules: [
          (mou) => mou.document_version >= 1 || 'Document must be versioned'
        ]
      },
      {
        from: 'internal_review',
        to: 'draft',
        label: 'Return to Draft',
        requiredRole: 'editor'
      },

      // External review transitions
      {
        from: 'external_review',
        to: 'negotiation',
        label: 'Begin Negotiation',
        requiredRole: 'admin'
      },
      {
        from: 'external_review',
        to: 'internal_review',
        label: 'Return to Internal Review',
        requiredRole: 'editor'
      },

      // Negotiation transitions
      {
        from: 'negotiation',
        to: 'signed',
        label: 'Mark as Signed',
        requiredRole: 'admin',
        requiredFields: ['signing_date'],
        validationRules: [
          (mou) => mou.signing_date !== null || 'Signing date is required'
        ]
      },
      {
        from: 'negotiation',
        to: 'external_review',
        label: 'Return to External Review',
        requiredRole: 'editor'
      },

      // Signed transitions
      {
        from: 'signed',
        to: 'active',
        label: 'Activate MoU',
        requiredRole: 'admin',
        requiredFields: ['effective_date', 'expiry_date'],
        validationRules: [
          (mou) => mou.effective_date !== null || 'Effective date is required',
          (mou) => mou.expiry_date !== null || 'Expiry date is required',
          (mou) => {
            if (!mou.effective_date || !mou.expiry_date) return true;
            return new Date(mou.expiry_date) > new Date(mou.effective_date) || 'Expiry date must be after effective date';
          }
        ]
      },

      // Active transitions
      {
        from: 'active',
        to: 'renewed',
        label: 'Renew MoU',
        requiredRole: 'admin',
        validationRules: [
          (mou) => {
            if (!mou.expiry_date) return 'Expiry date required for renewal';
            const expiryDate = new Date(mou.expiry_date);
            const now = new Date();
            const gracePeriod = 30 * 24 * 60 * 60 * 1000; // 30 days in ms
            return (expiryDate.getTime() - now.getTime()) < gracePeriod || 'Can only renew within 30 days of expiry';
          }
        ]
      },
      {
        from: 'active',
        to: 'expired',
        label: 'Mark as Expired',
        requiredRole: 'admin'
      },

      // Expired transitions
      {
        from: 'expired',
        to: 'renewed',
        label: 'Renew Expired MoU',
        requiredRole: 'admin',
        validationRules: [
          (mou) => {
            if (!mou.expiry_date) return 'Expiry date required';
            const expiryDate = new Date(mou.expiry_date);
            const now = new Date();
            const gracePeriod = 90 * 24 * 60 * 60 * 1000; // 90 days grace period
            return (now.getTime() - expiryDate.getTime()) < gracePeriod || 'Grace period for renewal has expired';
          }
        ]
      }
    ];

    const map = new Map<string, WorkflowTransition>();
    transitions.forEach(t => {
      map.set(`${t.from}->${t.to}`, t);
    });
    return map;
  }

  async validateTransition(request: TransitionRequest): Promise<TransitionResult> {
    const transitionKey = `${request.fromState}->${request.toState}`;
    const transition = this.transitions.get(transitionKey);

    if (!transition) {
      return {
        success: false,
        error: `Invalid transition from ${request.fromState} to ${request.toState}`
      };
    }

    // Fetch MoU
    const { data: mou, error: mouError } = await this.supabase
      .from('mous')
      .select('*')
      .eq('id', request.mouId)
      .single();

    if (mouError || !mou) {
      return {
        success: false,
        error: 'MoU not found'
      };
    }

    // Verify current state
    if (mou.workflow_state !== request.fromState) {
      return {
        success: false,
        error: `MoU is in state ${mou.workflow_state}, not ${request.fromState}`
      };
    }

    // Check user role if required
    if (transition.requiredRole) {
      const { data: user, error: userError } = await this.supabase
        .from('users')
        .select('role')
        .eq('id', request.userId)
        .single();

      if (userError || !user) {
        return {
          success: false,
          error: 'User not found'
        };
      }

      if (!this.hasRequiredRole(user.role, transition.requiredRole)) {
        return {
          success: false,
          error: `Requires ${transition.requiredRole} role`
        };
      }
    }

    // Check required fields
    const warnings: string[] = [];
    if (transition.requiredFields) {
      for (const field of transition.requiredFields) {
        if (!mou[field]) {
          return {
            success: false,
            error: `Required field missing: ${field}`
          };
        }
      }
    }

    // Run validation rules
    if (transition.validationRules) {
      for (const rule of transition.validationRules) {
        const result = rule(mou);
        if (result !== true) {
          return {
            success: false,
            error: typeof result === 'string' ? result : 'Validation failed'
          };
        }
      }
    }

    return {
      success: true,
      newState: request.toState,
      warnings
    };
  }

  async executeTransition(request: TransitionRequest): Promise<TransitionResult> {
    // Validate transition first
    const validation = await this.validateTransition(request);
    if (!validation.success) {
      return validation;
    }

    // Begin transaction
    const { data: updatedMou, error: updateError } = await this.supabase
      .from('mous')
      .update({
        workflow_state: request.toState,
        updated_at: new Date().toISOString()
      })
      .eq('id', request.mouId)
      .eq('workflow_state', request.fromState) // Optimistic locking
      .select()
      .single();

    if (updateError) {
      return {
        success: false,
        error: `Failed to update MoU: ${updateError.message}`
      };
    }

    // Log the transition
    const auditLog = await this.logTransition(request, updatedMou);

    // Handle post-transition actions
    await this.handlePostTransitionActions(request.toState, updatedMou);

    return {
      success: true,
      newState: request.toState,
      warnings: validation.warnings,
      auditLog
    };
  }

  async getAvailableTransitions(mouId: string, userId: string): Promise<WorkflowTransition[]> {
    // Get MoU current state
    const { data: mou, error } = await this.supabase
      .from('mous')
      .select('workflow_state')
      .eq('id', mouId)
      .single();

    if (error || !mou) {
      return [];
    }

    // Get user role
    const { data: user } = await this.supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    // Find all transitions from current state
    const available: WorkflowTransition[] = [];
    for (const [key, transition] of this.transitions) {
      if (transition.from === mou.workflow_state) {
        // Check role requirement
        if (!transition.requiredRole || 
            (user && this.hasRequiredRole(user.role, transition.requiredRole))) {
          available.push(transition);
        }
      }
    }

    return available;
  }

  async getWorkflowHistory(mouId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('audit_log')
      .select('*')
      .eq('table_name', 'mous')
      .eq('row_id', mouId)
      .order('timestamp', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch workflow history: ${error.message}`);
    }

    return data || [];
  }

  async checkExpiringMous(daysAhead: number = 30): Promise<MoU[]> {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + daysAhead);

    const { data, error } = await this.supabase
      .from('mous')
      .select('*')
      .eq('workflow_state', 'active')
      .lte('expiry_date', futureDate.toISOString())
      .gte('expiry_date', new Date().toISOString())
      .order('expiry_date');

    if (error) {
      throw new Error(`Failed to check expiring MoUs: ${error.message}`);
    }

    return data || [];
  }

  async autoExpireMous(): Promise<number> {
    const now = new Date().toISOString();
    
    const { data, error } = await this.supabase
      .from('mous')
      .update({ workflow_state: 'expired' })
      .eq('workflow_state', 'active')
      .lt('expiry_date', now)
      .select();

    if (error) {
      throw new Error(`Failed to auto-expire MoUs: ${error.message}`);
    }

    // Log transitions for each expired MoU
    if (data && data.length > 0) {
      for (const mou of data) {
        await this.logTransition(
          {
            mouId: mou.id,
            fromState: 'active',
            toState: 'expired',
            userId: 'system',
            comment: 'Auto-expired due to expiry date'
          },
          mou
        );
      }
    }

    return data?.length || 0;
  }

  async autoRenewMous(): Promise<number> {
    const { data, error } = await this.supabase
      .from('mous')
      .select('*')
      .eq('workflow_state', 'active')
      .eq('auto_renewal', true)
      .not('renewal_period_months', 'is', null);

    if (error) {
      throw new Error(`Failed to fetch auto-renewable MoUs: ${error.message}`);
    }

    let renewedCount = 0;
    const now = new Date();

    for (const mou of data || []) {
      if (mou.expiry_date && mou.renewal_period_months) {
        const expiryDate = new Date(mou.expiry_date);
        const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        // Auto-renew if within 30 days of expiry
        if (daysUntilExpiry <= 30 && daysUntilExpiry > 0) {
          const newExpiryDate = new Date(expiryDate);
          newExpiryDate.setMonth(newExpiryDate.getMonth() + mou.renewal_period_months);

          const { error: renewError } = await this.supabase
            .from('mous')
            .update({
              workflow_state: 'renewed',
              expiry_date: newExpiryDate.toISOString(),
              document_version: (mou.document_version || 1) + 1
            })
            .eq('id', mou.id);

          if (!renewError) {
            renewedCount++;
            await this.logTransition(
              {
                mouId: mou.id,
                fromState: 'active',
                toState: 'renewed',
                userId: 'system',
                comment: `Auto-renewed for ${mou.renewal_period_months} months`
              },
              mou
            );
          }
        }
      }
    }

    return renewedCount;
  }

  private hasRequiredRole(userRole: string, requiredRole: string): boolean {
    const roleHierarchy = ['viewer', 'editor', 'admin'];
    const userLevel = roleHierarchy.indexOf(userRole);
    const requiredLevel = roleHierarchy.indexOf(requiredRole);
    return userLevel >= requiredLevel;
  }

  private async logTransition(request: TransitionRequest, mou: MoU): Promise<any> {
    const logEntry = {
      table_name: 'mous',
      operation: 'workflow_transition',
      row_id: request.mouId,
      old_data: { workflow_state: request.fromState },
      new_data: { workflow_state: request.toState, comment: request.comment },
      user_id: request.userId,
      timestamp: new Date().toISOString()
    };

    const { data, error } = await this.supabase
      .from('audit_log')
      .insert(logEntry)
      .select()
      .single();

    if (error) {
      console.error('Failed to log transition:', error);
    }

    return data ? {
      id: data.id,
      timestamp: data.timestamp,
      userId: data.user_id,
      action: `${request.fromState} → ${request.toState}`
    } : null;
  }

  private async handlePostTransitionActions(newState: WorkflowState, mou: MoU): Promise<void> {
    switch (newState) {
      case 'active':
        // Send notification to parties
        await this.notifyParties(mou, 'MoU is now active');
        break;
      case 'expired':
        // Archive related documents
        await this.archiveMouDocuments(mou.id);
        break;
      case 'renewed':
        // Create new version of document
        await this.createNewDocumentVersion(mou);
        break;
    }
  }

  private async notifyParties(mou: MoU, message: string): Promise<void> {
    // Implementation would send notifications to relevant parties
    console.log(`Notifying parties of MoU ${mou.id}: ${message}`);
  }

  private async archiveMouDocuments(mouId: string): Promise<void> {
    // Implementation would archive documents
    console.log(`Archiving documents for MoU ${mouId}`);
  }

  private async createNewDocumentVersion(mou: MoU): Promise<void> {
    // Implementation would create new document version
    console.log(`Creating new document version for MoU ${mou.id}`);
  }
}

// Export factory function
export function createMoUWorkflowService(
  supabaseUrl: string,
  supabaseKey: string
): MoUWorkflowService {
  return new MoUWorkflowService(supabaseUrl, supabaseKey);
}