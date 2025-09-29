import React from 'react';
import { Badge } from '../ui/badge';
import { useCompliance } from '../../hooks/use-compliance';
import { cn } from '../../lib/utils';
import { CheckCircle2, AlertCircle, AlertTriangle, Info } from 'lucide-react';

export interface ValidationBadgeProps {
  componentName: string;
  showDetails?: boolean;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  position?: 'inline' | 'floating';
}

export function ValidationBadge({
  componentName,
  showDetails = false,
  className,
  size = 'sm',
  position = 'inline',
}: ValidationBadgeProps) {
  const { enableValidation } = useCompliance();
  const { lastValidation, isValid } = useComponentCompliance({
    componentName,
    validateOnMount: true,
  });
  
  if (!enableValidation || process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  const errors = lastValidation.errors.filter(e => e.severity === 'error');
  const warnings = lastValidation.errors.filter(e => e.severity === 'warning');
  const info = lastValidation.errors.filter(e => e.severity === 'info');
  
  const sizeClasses = {
    sm: 'text-xs px-1.5 py-0.5',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5',
  };
  
  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5',
  };
  
  const getVariant = () => {
    if (errors.length > 0) return 'destructive';
    if (warnings.length > 0) return 'outline';
    if (info.length > 0) return 'secondary';
    return 'default';
  };
  
  const getIcon = () => {
    if (isValid) {
      return <CheckCircle2 className={cn(iconSizes[size], 'text-green-600')} />;
    }
    if (errors.length > 0) {
      return <AlertCircle className={cn(iconSizes[size], 'text-destructive')} />;
    }
    if (warnings.length > 0) {
      return <AlertTriangle className={cn(iconSizes[size], 'text-warning')} />;
    }
    return <Info className={cn(iconSizes[size], 'text-info')} />;
  };
  
  const badgeContent = (
    <Badge
      variant={getVariant()}
      className={cn(
        'flex items-center gap-1',
        sizeClasses[size],
        position === 'floating' && 'absolute top-2 right-2 z-10',
        className
      )}
    >
      {getIcon()}
      <span className="font-medium">
        {isValid ? 'Valid' : `${errors.length + warnings.length} issues`}
      </span>
    </Badge>
  );
  
  if (!showDetails) {
    return badgeContent;
  }
  
  return (
    <div className="relative">
      {badgeContent}
      {!isValid && (
        <div className="mt-2 space-y-1 text-xs">
          {errors.map((error, index) => (
            <div key={index} className="flex items-start gap-1 text-destructive">
              <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>{error.message}</span>
            </div>
          ))}
          {warnings.map((warning, index) => (
            <div key={index} className="flex items-start gap-1 text-warning">
              <AlertTriangle className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>{warning.message}</span>
            </div>
          ))}
          {info.map((item, index) => (
            <div key={index} className="flex items-start gap-1 text-muted-foreground">
              <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>{item.message}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export interface ValidationSummaryProps {
  componentNames: string[];
  className?: string;
}

export function ValidationSummary({
  componentNames,
  className,
}: ValidationSummaryProps) {
  const { enableValidation } = useCompliance();
  
  if (!enableValidation || process.env.NODE_ENV !== 'development') {
    return null;
  }
  
  const validComponents = componentNames.filter(name => {
    const { isValid } = useComponentCompliance({
      componentName: name,
      validateOnMount: true,
    });
    return isValid;
  });
  
  const percentage = Math.round((validComponents.length / componentNames.length) * 100);
  
  return (
    <div className={cn(
      'p-4 rounded-md border bg-card',
      className
    )}>
      <h3 className="text-sm font-semibold mb-2">Compliance Summary</h3>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Components</span>
          <span className="text-sm font-medium">
            {validComponents.length}/{componentNames.length}
          </span>
        </div>
        <div className="w-full bg-secondary rounded-full h-2">
          <div
            className={cn(
              'h-2 rounded-full transition-all',
              percentage === 100 && 'bg-green-600',
              percentage >= 75 && percentage < 100 && 'bg-yellow-600',
              percentage < 75 && 'bg-red-600'
            )}
            style={{ width: `${percentage}%` }}
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {percentage}% compliance
        </p>
      </div>
    </div>
  );
}

import { useComponentCompliance } from '../../hooks/use-compliance';