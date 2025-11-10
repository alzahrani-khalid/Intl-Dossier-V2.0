import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ConsistencyPanel } from '../ConsistencyPanel';
import '../../../i18n';

// Mock data
const mockConsistencyCheck = {
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
 {
 conflict_position_id: '123e4567-e89b-12d3-a456-426614174004',
 conflict_type: 'overlap' as const,
 severity: 'low' as const,
 description: 'Minor overlap with existing position on statistical methodology',
 suggested_resolution: 'Reference existing position or consolidate',
 affected_sections: ['Section 3.2'],
 },
 ],
 checked_at: '2025-10-01T10:30:00Z',
 checked_by: '123e4567-e89b-12d3-a456-426614174005',
};

describe('ConsistencyPanel', () => {
 it('renders empty state when no consistency check is provided', () => {
 render(<ConsistencyPanel consistencyCheck={null} />);

 expect(screen.getByText(/No Consistency Check Available/i)).toBeInTheDocument();
 expect(screen.getByText(/Run a consistency check/i)).toBeInTheDocument();
 });

 it('renders consistency score correctly', () => {
 render(<ConsistencyPanel consistencyCheck={mockConsistencyCheck} />);

 expect(screen.getByText('75')).toBeInTheDocument();
 expect(screen.getByText(/Good/i)).toBeInTheDocument();
 });

 it('displays AI service status badge', () => {
 render(<ConsistencyPanel consistencyCheck={mockConsistencyCheck} />);

 expect(screen.getByText(/Available/i)).toBeInTheDocument();
 });

 it('displays check trigger information', () => {
 render(<ConsistencyPanel consistencyCheck={mockConsistencyCheck} />);

 expect(screen.getByText(/Automatic on Submit/i)).toBeInTheDocument();
 });

 it('displays conflicts count when conflicts exist', () => {
 render(<ConsistencyPanel consistencyCheck={mockConsistencyCheck} />);

 expect(screen.getByText(/Conflicts Found/i)).toBeInTheDocument();
 expect(screen.getByText(/\(3\)/)).toBeInTheDocument();
 });

 it('displays no conflicts message when no conflicts exist', () => {
 const checkWithoutConflicts = {
 ...mockConsistencyCheck,
 consistency_score: 95,
 conflicts: [],
 };

 render(<ConsistencyPanel consistencyCheck={checkWithoutConflicts} />);

 expect(screen.getByText(/No conflicts detected/i)).toBeInTheDocument();
 });

 it('displays severity badges correctly', () => {
 render(<ConsistencyPanel consistencyCheck={mockConsistencyCheck} />);

 expect(screen.getByText(/High/i)).toBeInTheDocument();
 expect(screen.getByText(/Medium/i)).toBeInTheDocument();
 expect(screen.getByText(/Low/i)).toBeInTheDocument();
 });

 it('displays conflict type badges correctly', () => {
 render(<ConsistencyPanel consistencyCheck={mockConsistencyCheck} />);

 expect(screen.getByText(/Contradiction/i)).toBeInTheDocument();
 expect(screen.getByText(/Ambiguity/i)).toBeInTheDocument();
 expect(screen.getByText(/Overlap/i)).toBeInTheDocument();
 });

 it('expands conflict details when clicked', () => {
 render(<ConsistencyPanel consistencyCheck={mockConsistencyCheck} />);

 // Initially, suggested resolutions should not be visible
 expect(screen.queryByText(/Revise section 2.3/i)).not.toBeInTheDocument();

 // Click to expand first conflict
 const conflictButton = screen.getByText(/Position contradicts existing stance/i);
 fireEvent.click(conflictButton);

 // Now suggested resolution should be visible
 expect(screen.getByText(/Revise section 2.3/i)).toBeInTheDocument();
 });

 it('calls onResolveConflict when action buttons are clicked', () => {
 const onResolveConflict = vi.fn();

 render(
 <ConsistencyPanel
 consistencyCheck={mockConsistencyCheck}
 onResolveConflict={onResolveConflict}
 />
 );

 // Expand first conflict
 const conflictButton = screen.getByText(/Position contradicts existing stance/i);
 fireEvent.click(conflictButton);

 // Click modify button
 const modifyButton = screen.getAllByText(/Modify Position/i)[0];
 fireEvent.click(modifyButton);

 expect(onResolveConflict).toHaveBeenCalledWith(
 '123e4567-e89b-12d3-a456-426614174002',
 'modify'
 );
 });

 it('calls onViewConflictingPosition when view button is clicked', () => {
 const onViewConflictingPosition = vi.fn();

 render(
 <ConsistencyPanel
 consistencyCheck={mockConsistencyCheck}
 onViewConflictingPosition={onViewConflictingPosition}
 />
 );

 // Expand first conflict
 const conflictButton = screen.getByText(/Position contradicts existing stance/i);
 fireEvent.click(conflictButton);

 // Click view position button
 const viewButton = screen.getAllByText(/View Conflicting Position/i)[0];
 fireEvent.click(viewButton);

 expect(onViewConflictingPosition).toHaveBeenCalledWith(
 '123e4567-e89b-12d3-a456-426614174002'
 );
 });

 it('displays affected sections when expanded', () => {
 render(<ConsistencyPanel consistencyCheck={mockConsistencyCheck} />);

 // Expand first conflict
 const conflictButton = screen.getByText(/Position contradicts existing stance/i);
 fireEvent.click(conflictButton);

 expect(screen.getByText('Section 2.3')).toBeInTheDocument();
 expect(screen.getByText('Appendix A')).toBeInTheDocument();
 });

 it('uses correct color for different consistency scores', () => {
 const { rerender } = render(
 <ConsistencyPanel consistencyCheck={{ ...mockConsistencyCheck, consistency_score: 95 }} />
 );
 expect(screen.getByText(/Excellent/i)).toBeInTheDocument();

 rerender(
 <ConsistencyPanel consistencyCheck={{ ...mockConsistencyCheck, consistency_score: 75 }} />
 );
 expect(screen.getByText(/Good/i)).toBeInTheDocument();

 rerender(
 <ConsistencyPanel consistencyCheck={{ ...mockConsistencyCheck, consistency_score: 60 }} />
 );
 expect(screen.getByText(/Fair/i)).toBeInTheDocument();

 rerender(
 <ConsistencyPanel consistencyCheck={{ ...mockConsistencyCheck, consistency_score: 40 }} />
 );
 expect(screen.getByText(/Poor/i)).toBeInTheDocument();

 rerender(
 <ConsistencyPanel consistencyCheck={{ ...mockConsistencyCheck, consistency_score: 20 }} />
 );
 expect(screen.getByText(/Critical/i)).toBeInTheDocument();
 });

 it('shows AI unavailable badge when AI service is not available', () => {
 const checkWithoutAI = {
 ...mockConsistencyCheck,
 ai_service_available: false,
 };

 render(<ConsistencyPanel consistencyCheck={checkWithoutAI} />);

 expect(screen.getByText(/Unavailable/i)).toBeInTheDocument();
 });

 it('formats date correctly', () => {
 render(<ConsistencyPanel consistencyCheck={mockConsistencyCheck} />);

 // Check that some date/time is displayed (format may vary by locale)
 expect(screen.getByText(/Oct|10/i)).toBeInTheDocument();
 });

 it('displays all action buttons when conflict is expanded', () => {
 render(<ConsistencyPanel consistencyCheck={mockConsistencyCheck} />);

 // Expand first conflict
 const conflictButton = screen.getByText(/Position contradicts existing stance/i);
 fireEvent.click(conflictButton);

 expect(screen.getAllByText(/Modify Position/i)[0]).toBeInTheDocument();
 expect(screen.getAllByText(/View Conflicting Position/i)[0]).toBeInTheDocument();
 expect(screen.getAllByText(/Accept Risk/i)[0]).toBeInTheDocument();
 expect(screen.getAllByText(/Escalate to Admin/i)[0]).toBeInTheDocument();
 });

 it('toggles conflict expansion state correctly', () => {
 render(<ConsistencyPanel consistencyCheck={mockConsistencyCheck} />);

 const conflictButton = screen.getByText(/Position contradicts existing stance/i);

 // Expand
 fireEvent.click(conflictButton);
 expect(screen.getByText(/Revise section 2.3/i)).toBeInTheDocument();

 // Collapse
 fireEvent.click(conflictButton);
 expect(screen.queryByText(/Revise section 2.3/i)).not.toBeInTheDocument();
 });
});
