// Enhanced Custom React Flow Edges with Dotted Lines and Impact Badges
import { memo } from 'react';
import { EdgeProps, getBezierPath, EdgeLabelRenderer, BaseEdge } from 'reactflow';

interface CustomEdgeData {
  label?: string;
  strength?: 'primary' | 'secondary' | 'observer';
}

// Custom Edge Component with dotted lines and impact badges
export const CustomEdge = memo((({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps<CustomEdgeData>) => {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const { label, strength = 'secondary' } = data || {};

  // Get edge styling based on strength (matching impact levels) - Theme aware
  const getEdgeStyle = () => {
    switch (strength) {
      case 'primary':
        return {
          stroke: 'hsl(var(--success))',
          strokeWidth: 3,
          impactLabel: 'High Impact',
          impactBg: 'bg-success',
          impactText: 'text-success-foreground',
          dotColor: 'hsl(var(--success))',
        };
      case 'secondary':
        return {
          stroke: 'hsl(var(--warning))',
          strokeWidth: 2.5,
          impactLabel: 'Medium Impact',
          impactBg: 'bg-warning',
          impactText: 'text-warning-foreground',
          dotColor: 'hsl(var(--warning))',
        };
      case 'observer':
        return {
          stroke: 'hsl(var(--muted-foreground))',
          strokeWidth: 2,
          impactLabel: 'Low Impact',
          impactBg: 'bg-muted',
          impactText: 'text-muted-foreground',
          dotColor: 'hsl(var(--muted-foreground))',
        };
      default:
        return {
          stroke: 'hsl(var(--muted-foreground))',
          strokeWidth: 2,
          impactLabel: 'Impact',
          impactBg: 'bg-muted',
          impactText: 'text-muted-foreground',
          dotColor: 'hsl(var(--muted-foreground))',
        };
    }
  };

  const style = getEdgeStyle();

  return (
    <>
      {/* Dotted edge path */}
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          stroke: style.stroke,
          strokeWidth: style.strokeWidth,
          strokeDasharray: '8 6', // Dotted pattern
          opacity: 0.7,
        }}
      />

      {/* Impact Badge positioned along the edge */}
      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
        >
          <div className={`${style.impactBg} ${style.impactText} px-3 py-1.5 rounded-full shadow-lg text-xs font-semibold whitespace-nowrap`}>
            {style.impactLabel}
          </div>
        </div>
      </EdgeLabelRenderer>

      {/* Optional: Relationship label (if provided) - Theme aware */}
      {label && (
        <EdgeLabelRenderer>
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -50%) translate(${labelX}px,${labelY - 35}px)`,
              pointerEvents: 'all',
            }}
            className="nodrag nopan"
          >
            <div className="bg-card border-2 border-border px-2.5 py-1 rounded-md shadow-md">
              <span className="text-xs font-medium text-card-foreground whitespace-nowrap">
                {label}
              </span>
            </div>
          </div>
        </EdgeLabelRenderer>
      )}
    </>
  );
}) as any);

CustomEdge.displayName = 'CustomEdge';

// Simplified Custom Edge (for performance)
export const SimpleCustomEdge = memo((({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
  markerEnd,
}: EdgeProps<CustomEdgeData>) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const { strength = 'secondary' } = data || {};

  // Theme-aware stroke colors
  const strokeColor =
    strength === 'primary' ? 'hsl(var(--success))' :
    strength === 'secondary' ? 'hsl(var(--warning))' :
    'hsl(var(--muted-foreground))';
  const strokeWidth = strength === 'primary' ? 3 : strength === 'secondary' ? 2.5 : 2;

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      markerEnd={markerEnd}
      style={{
        stroke: strokeColor,
        strokeWidth,
        strokeDasharray: '8 6',
        opacity: 0.7,
      }}
    />
  );
}) as any);

SimpleCustomEdge.displayName = 'SimpleCustomEdge';
