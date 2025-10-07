/**
 * ApprovalChain Component - Usage Examples
 *
 * This file demonstrates various usage scenarios for the ApprovalChain component.
 * These examples are for documentation and testing purposes only.
 */

import { ApprovalChain } from './ApprovalChain';
import type { ApprovalChainConfig, Approval } from './ApprovalChain';

// Example 1: Simple 3-stage approval chain (in progress)
export function Example1_ThreeStageInProgress() {
  const approvalChainConfig: ApprovalChainConfig = {
    stages: [
      {
        order: 1,
        role: 'Section Chief',
        approver_id: 'user-1',
        approver_name: 'Ahmed Al-Zahrani',
      },
      {
        order: 2,
        role: 'Department Director',
        approver_id: 'user-2',
        approver_name: 'Sarah Mohammed',
      },
      {
        order: 3,
        role: 'Executive Committee',
        approver_id: 'user-3',
        approver_name: 'Dr. Khalid Ibrahim',
      },
    ],
  };

  const approvals: Approval[] = [
    {
      id: 'approval-1',
      stage: 1,
      approver_id: 'user-1',
      approver_name: 'Ahmed Al-Zahrani',
      action: 'approve',
      comments: 'Approved with minor suggestions for alignment notes.',
      step_up_verified: true,
      created_at: '2025-09-28T10:30:00Z',
    },
  ];

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold">Example 1: 3-Stage Chain (Stage 2)</h2>
      <ApprovalChain
        approvalChainConfig={approvalChainConfig}
        currentStage={2}
        approvals={approvals}
        status="under_review"
      />
    </div>
  );
}

// Example 2: 5-stage approval chain with delegations
export function Example2_FiveStageWithDelegation() {
  const approvalChainConfig: ApprovalChainConfig = {
    stages: [
      {
        order: 1,
        role: 'Policy Officer',
        approver_id: 'user-1',
        approver_name: 'Fatima Al-Otaibi',
      },
      {
        order: 2,
        role: 'Legal Review',
        approver_id: 'user-2',
        approver_name: 'Omar Al-Harthi',
      },
      {
        order: 3,
        role: 'Department Head',
        approver_id: 'user-3',
        approver_name: 'Noura Al-Shehri',
      },
      {
        order: 4,
        role: 'Executive VP',
        approver_id: 'user-4',
        approver_name: 'Abdullah Al-Mutairi',
      },
      {
        order: 5,
        role: 'CEO',
        approver_id: 'user-5',
        approver_name: 'Dr. Mansour Al-Dosari',
      },
    ],
  };

  const approvals: Approval[] = [
    {
      id: 'approval-1',
      stage: 1,
      approver_id: 'user-1',
      approver_name: 'Fatima Al-Otaibi',
      action: 'approve',
      step_up_verified: true,
      created_at: '2025-09-25T09:00:00Z',
    },
    {
      id: 'approval-2',
      stage: 2,
      approver_id: 'user-2b',
      approver_name: 'Saleh Al-Qahtani',
      original_approver_id: 'user-2',
      original_approver_name: 'Omar Al-Harthi',
      action: 'approve',
      comments: 'Legal terms updated as per regional compliance requirements.',
      step_up_verified: true,
      delegated_from: 'user-2',
      delegated_from_name: 'Omar Al-Harthi',
      delegated_until: '2025-10-05T23:59:59Z',
      created_at: '2025-09-26T14:20:00Z',
    },
    {
      id: 'approval-3',
      stage: 3,
      approver_id: 'user-3',
      approver_name: 'Noura Al-Shehri',
      action: 'approve',
      step_up_verified: true,
      created_at: '2025-09-27T11:45:00Z',
    },
  ];

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold">Example 2: 5-Stage Chain with Delegation</h2>
      <ApprovalChain
        approvalChainConfig={approvalChainConfig}
        currentStage={4}
        approvals={approvals}
        status="under_review"
      />
    </div>
  );
}

// Example 3: Completed approval chain (published)
export function Example3_CompletedChain() {
  const approvalChainConfig: ApprovalChainConfig = {
    stages: [
      {
        order: 1,
        role: 'Drafter Review',
        approver_id: 'user-1',
        approver_name: 'Layla Al-Mansour',
      },
      {
        order: 2,
        role: 'Senior Analyst',
        approver_id: 'user-2',
        approver_name: 'Yousef Al-Ghamdi',
      },
      {
        order: 3,
        role: 'Director',
        approver_id: 'user-3',
        approver_name: 'Maha Al-Saud',
      },
      {
        order: 4,
        role: 'President',
        approver_id: 'user-4',
        approver_name: 'Dr. Bandar Al-Rashid',
      },
    ],
  };

  const approvals: Approval[] = [
    {
      id: 'approval-1',
      stage: 1,
      approver_id: 'user-1',
      approver_name: 'Layla Al-Mansour',
      action: 'approve',
      step_up_verified: true,
      created_at: '2025-09-20T08:30:00Z',
    },
    {
      id: 'approval-2',
      stage: 2,
      approver_id: 'user-2',
      approver_name: 'Yousef Al-Ghamdi',
      action: 'approve',
      step_up_verified: true,
      created_at: '2025-09-21T10:15:00Z',
    },
    {
      id: 'approval-3',
      stage: 3,
      approver_id: 'user-3',
      approver_name: 'Maha Al-Saud',
      action: 'approve',
      comments: 'Excellent work. Ready for final approval.',
      step_up_verified: true,
      created_at: '2025-09-22T13:45:00Z',
    },
    {
      id: 'approval-4',
      stage: 4,
      approver_id: 'user-4',
      approver_name: 'Dr. Bandar Al-Rashid',
      action: 'approve',
      step_up_verified: true,
      created_at: '2025-09-23T16:20:00Z',
    },
  ];

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold">Example 3: Completed & Published</h2>
      <ApprovalChain
        approvalChainConfig={approvalChainConfig}
        currentStage={4}
        approvals={approvals}
        status="published"
      />
    </div>
  );
}

// Example 4: Chain with revision request and reassignment
export function Example4_WithRevisionsAndReassignment() {
  const approvalChainConfig: ApprovalChainConfig = {
    stages: [
      {
        order: 1,
        role: 'Team Lead',
        approver_id: 'user-1',
        approver_name: 'Hind Al-Dosari',
      },
      {
        order: 2,
        role: 'Quality Assurance',
        approver_id: 'user-2',
        approver_name: 'Saad Al-Zahrani',
      },
      {
        order: 3,
        role: 'Division Chief',
        approver_id: 'user-3',
        approver_name: 'Reem Al-Shammari',
      },
    ],
  };

  const approvals: Approval[] = [
    {
      id: 'approval-1',
      stage: 1,
      approver_id: 'user-1',
      approver_name: 'Hind Al-Dosari',
      action: 'approve',
      step_up_verified: true,
      created_at: '2025-09-28T09:00:00Z',
    },
    {
      id: 'approval-2a',
      stage: 2,
      approver_id: 'user-2',
      approver_name: 'Saad Al-Zahrani',
      action: 'request_revisions',
      comments:
        'Please clarify the rationale for Section 3.2 and provide supporting data for the claims made.',
      step_up_verified: false,
      created_at: '2025-09-29T11:30:00Z',
    },
    {
      id: 'approval-2b',
      stage: 2,
      approver_id: 'user-2b',
      approver_name: 'Tariq Al-Anazi',
      original_approver_id: 'user-2',
      original_approver_name: 'Saad Al-Zahrani',
      action: 'approve',
      comments: 'Revisions addressed. Approved after review.',
      step_up_verified: true,
      reassigned_by: 'admin-1',
      reassigned_by_name: 'System Administrator',
      reassignment_reason:
        'Original approver unavailable due to medical leave. Reassigned to qualified alternate.',
      created_at: '2025-09-30T15:00:00Z',
    },
  ];

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold">Example 4: With Revisions & Reassignment</h2>
      <ApprovalChain
        approvalChainConfig={approvalChainConfig}
        currentStage={3}
        approvals={approvals}
        status="under_review"
      />
    </div>
  );
}

// Example 5: Maximum 10-stage approval chain
export function Example5_MaximumStages() {
  const approvalChainConfig: ApprovalChainConfig = {
    stages: Array.from({ length: 10 }, (_, i) => ({
      order: i + 1,
      role: `Stage ${i + 1} Approver`,
      approver_id: `user-${i + 1}`,
      approver_name: `Approver ${i + 1}`,
    })),
  };

  const approvals: Approval[] = Array.from({ length: 6 }, (_, i) => ({
    id: `approval-${i + 1}`,
    stage: i + 1,
    approver_id: `user-${i + 1}`,
    approver_name: `Approver ${i + 1}`,
    action: 'approve' as const,
    step_up_verified: true,
    created_at: new Date(2025, 8, 20 + i, 10, 0, 0).toISOString(),
  }));

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold">Example 5: Maximum 10 Stages</h2>
      <ApprovalChain
        approvalChainConfig={approvalChainConfig}
        currentStage={7}
        approvals={approvals}
        status="under_review"
      />
    </div>
  );
}

// Example 6: Draft position (no approvals yet)
export function Example6_DraftPosition() {
  const approvalChainConfig: ApprovalChainConfig = {
    stages: [
      {
        order: 1,
        role: 'Manager',
        approver_id: 'user-1',
        approver_name: 'Ali Al-Harbi',
      },
      {
        order: 2,
        role: 'Director',
        approver_id: 'user-2',
        approver_name: 'Nada Al-Jaber',
      },
    ],
  };

  const approvals: Approval[] = [];

  return (
    <div className="p-6 space-y-4">
      <h2 className="text-2xl font-bold">Example 6: Draft (Not Submitted)</h2>
      <ApprovalChain
        approvalChainConfig={approvalChainConfig}
        currentStage={0}
        approvals={approvals}
        status="draft"
      />
    </div>
  );
}

// Example 7: All examples in a single view
export function ApprovalChainExamplesShowcase() {
  return (
    <div className="space-y-8 p-8 bg-gray-50 min-h-screen">
      <h1 className="text-4xl font-bold text-center mb-8">
        Approval Chain Component Examples
      </h1>

      <div className="space-y-12">
        <div className="bg-white rounded-lg shadow-md">
          <Example1_ThreeStageInProgress />
        </div>

        <div className="bg-white rounded-lg shadow-md">
          <Example2_FiveStageWithDelegation />
        </div>

        <div className="bg-white rounded-lg shadow-md">
          <Example3_CompletedChain />
        </div>

        <div className="bg-white rounded-lg shadow-md">
          <Example4_WithRevisionsAndReassignment />
        </div>

        <div className="bg-white rounded-lg shadow-md overflow-x-auto">
          <Example5_MaximumStages />
        </div>

        <div className="bg-white rounded-lg shadow-md">
          <Example6_DraftPosition />
        </div>
      </div>
    </div>
  );
}
