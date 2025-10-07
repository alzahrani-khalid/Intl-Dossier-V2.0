/**
 * ConsistencyPanel Component - Example Usage
 *
 * This file demonstrates how to use the ConsistencyPanel component
 * in the Positions & Talking Points Lifecycle feature.
 */

import { useState } from 'react';
import { ConsistencyPanel } from './ConsistencyPanel';
import { Button } from './ui/button';

// Example consistency check data
const exampleConsistencyCheck = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  position_id: '123e4567-e89b-12d3-a456-426614174001',
  check_trigger: 'automatic_on_submit' as const,
  consistency_score: 75,
  ai_service_available: true,
  conflicts: [
    {
      conflict_position_id: '123e4567-e89b-12d3-a456-426614174002',
      conflict_type: 'contradiction' as const,
      severity: 'high' as const,
      description: 'Position contradicts existing stance on data privacy',
      suggested_resolution: 'Revise section 2.3 to align with policy framework',
      affected_sections: ['Section 2.3', 'Appendix A'],
    },
    {
      conflict_position_id: '123e4567-e89b-12d3-a456-426614174003',
      conflict_type: 'ambiguity' as const,
      severity: 'medium' as const,
      description: 'Ambiguous wording regarding international cooperation',
      suggested_resolution: 'Clarify scope of international partnerships',
      affected_sections: ['Section 4.1'],
    },
  ],
  checked_at: new Date().toISOString(),
  checked_by: '123e4567-e89b-12d3-a456-426614174005',
};

/**
 * Example 1: Basic Usage
 * Simple implementation showing the consistency panel with data
 */
export function BasicExample() {
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Basic Consistency Panel</h2>
      <ConsistencyPanel consistencyCheck={exampleConsistencyCheck} />
    </div>
  );
}

/**
 * Example 2: With Callbacks
 * Implementation with action handlers
 */
export function WithCallbacksExample() {
  const handleResolveConflict = (
    conflictPositionId: string,
    action: 'modify' | 'accept' | 'escalate'
  ) => {
    console.log(`Resolving conflict ${conflictPositionId} with action: ${action}`);
    // In a real application, this would:
    // - Navigate to edit page (modify)
    // - Mark conflict as accepted (accept)
    // - Create escalation ticket (escalate)
  };

  const handleViewConflictingPosition = (positionId: string) => {
    console.log(`Viewing conflicting position: ${positionId}`);
    // In a real application, this would navigate to the position detail page
    // or open it in a modal
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Consistency Panel with Callbacks</h2>
      <ConsistencyPanel
        consistencyCheck={exampleConsistencyCheck}
        onResolveConflict={handleResolveConflict}
        onViewConflictingPosition={handleViewConflictingPosition}
      />
    </div>
  );
}

/**
 * Example 3: Empty State
 * Shows what happens when no consistency check is available
 */
export function EmptyStateExample() {
  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Empty State</h2>
      <ConsistencyPanel consistencyCheck={null} />
    </div>
  );
}

/**
 * Example 4: No Conflicts
 * Shows a successful consistency check with no conflicts
 */
export function NoConflictsExample() {
  const cleanCheck = {
    ...exampleConsistencyCheck,
    consistency_score: 95,
    conflicts: [],
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">No Conflicts</h2>
      <ConsistencyPanel consistencyCheck={cleanCheck} />
    </div>
  );
}

/**
 * Example 5: AI Service Unavailable
 * Shows the panel when AI service is down
 */
export function AIUnavailableExample() {
  const checkWithoutAI = {
    ...exampleConsistencyCheck,
    ai_service_available: false,
    consistency_score: 50,
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">AI Service Unavailable</h2>
      <ConsistencyPanel consistencyCheck={checkWithoutAI} />
    </div>
  );
}

/**
 * Example 6: Full Integration Example
 * Complete example showing integration with TanStack Query
 */
export function FullIntegrationExample() {
  const [consistencyCheck, setConsistencyCheck] = useState(exampleConsistencyCheck);

  // Simulate running a consistency check
  const runConsistencyCheck = async () => {
    // In a real application, this would call the API
    // const response = await fetch(`/api/positions/${positionId}/consistency`, {
    //   method: 'POST',
    // });
    // const data = await response.json();
    // setConsistencyCheck(data);

    console.log('Running consistency check...');
    setTimeout(() => {
      setConsistencyCheck({
        ...exampleConsistencyCheck,
        checked_at: new Date().toISOString(),
      });
    }, 1000);
  };

  const handleResolveConflict = async (
    conflictPositionId: string,
    action: 'modify' | 'accept' | 'escalate'
  ) => {
    // In a real application, this would call the reconcile API
    // await fetch(`/api/positions/consistency/${consistencyCheck.id}/reconcile`, {
    //   method: 'PUT',
    //   body: JSON.stringify({
    //     conflict_position_id: conflictPositionId,
    //     action,
    //   }),
    // });

    console.log(`Resolving conflict ${conflictPositionId} with action: ${action}`);

    // Update local state
    if (action === 'accept') {
      setConsistencyCheck((prev) => ({
        ...prev!,
        conflicts: prev!.conflicts.filter(
          (c) => c.conflict_position_id !== conflictPositionId
        ),
      }));
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Full Integration Example</h2>
        <Button onClick={runConsistencyCheck}>Run Consistency Check</Button>
      </div>
      <ConsistencyPanel
        consistencyCheck={consistencyCheck}
        onResolveConflict={handleResolveConflict}
        onViewConflictingPosition={(id) => {
          window.location.href = `/positions/${id}`;
        }}
      />
    </div>
  );
}

/**
 * Example 7: Different Severity Levels
 * Shows conflicts with different severity levels
 */
export function SeverityLevelsExample() {
  const severityCheck = {
    ...exampleConsistencyCheck,
    consistency_score: 60,
    conflicts: [
      {
        conflict_position_id: '1',
        conflict_type: 'contradiction' as const,
        severity: 'high' as const,
        description: 'Critical contradiction requiring immediate attention',
        suggested_resolution: 'Urgent revision needed',
        affected_sections: ['Main Policy'],
      },
      {
        conflict_position_id: '2',
        conflict_type: 'ambiguity' as const,
        severity: 'medium' as const,
        description: 'Moderate ambiguity that should be addressed',
        suggested_resolution: 'Clarify language in next revision',
        affected_sections: ['Section 3'],
      },
      {
        conflict_position_id: '3',
        conflict_type: 'overlap' as const,
        severity: 'low' as const,
        description: 'Minor overlap with minimal impact',
        suggested_resolution: 'Consider consolidating in future',
        affected_sections: ['Appendix'],
      },
    ],
  };

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Different Severity Levels</h2>
      <ConsistencyPanel consistencyCheck={severityCheck} />
    </div>
  );
}

/**
 * Example 8: Loading State
 * Shows how to handle loading state
 */
export function LoadingStateExample() {
  const [loading, setLoading] = useState(false);
  const [consistencyCheck, setConsistencyCheck] = useState<typeof exampleConsistencyCheck | null>(
    null
  );

  const loadCheck = () => {
    setLoading(true);
    setTimeout(() => {
      setConsistencyCheck(exampleConsistencyCheck);
      setLoading(false);
    }, 2000);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Loading State</h2>
        <Button onClick={loadCheck} disabled={loading}>
          {loading ? 'Loading...' : 'Load Check'}
        </Button>
      </div>
      {loading ? (
        <div className="text-center py-8">Loading consistency check...</div>
      ) : (
        <ConsistencyPanel consistencyCheck={consistencyCheck} loading={loading} />
      )}
    </div>
  );
}
