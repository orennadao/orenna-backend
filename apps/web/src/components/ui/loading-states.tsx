'use client';

import { Card } from './card';
import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6', 
    lg: 'h-8 w-8'
  };

  return (
    <div className={cn("animate-spin rounded-full border-b-2 border-blue-600", sizeClasses[size], className)} />
  );
}

interface LoadingStateProps {
  title?: string;
  description?: string;
  className?: string;
}

export function LoadingState({ 
  title = "Loading...", 
  description,
  className 
}: LoadingStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-8", className)}>
      <LoadingSpinner size="lg" className="mb-4" />
      <h3 className="text-lg font-medium text-gray-900">{title}</h3>
      {description && (
        <p className="text-gray-600 mt-2 text-center max-w-md">{description}</p>
      )}
    </div>
  );
}

export function CardLoadingState({ className }: { className?: string }) {
  return (
    <Card className={cn("p-6", className)}>
      <LoadingState />
    </Card>
  );
}

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
}

export function Skeleton({ className, variant = 'text' }: SkeletonProps) {
  const baseClasses = "animate-pulse bg-gray-200";
  
  const variantClasses = {
    text: "h-4 rounded",
    circular: "rounded-full",
    rectangular: "rounded"
  };

  return (
    <div className={cn(baseClasses, variantClasses[variant], className)} />
  );
}

// Skeleton layouts for common components
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <Card className={cn("p-6", className)}>
      <div className="space-y-4">
        <div className="flex justify-between items-start">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-5 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
          <Skeleton className="h-6 w-20" />
        </div>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </Card>
  );
}

export function TableSkeleton({ 
  rows = 5, 
  columns = 4,
  className 
}: { 
  rows?: number; 
  columns?: number;
  className?: string; 
}) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <div className="p-4 border-b bg-gray-50">
        <div className="flex gap-4">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-24" />
          ))}
        </div>
      </div>
      <div className="divide-y">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div key={rowIndex} className="p-4 flex gap-4">
            {Array.from({ length: columns }).map((_, colIndex) => (
              <Skeleton key={colIndex} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </Card>
  );
}

export function ListSkeleton({ 
  items = 3, 
  className 
}: { 
  items?: number; 
  className?: string; 
}) {
  return (
    <div className={cn("space-y-4", className)}>
      {Array.from({ length: items }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

interface InlineLoadingProps {
  text?: string;
  size?: 'sm' | 'md';
  className?: string;
}

export function InlineLoading({ 
  text = "Loading...", 
  size = 'sm',
  className 
}: InlineLoadingProps) {
  return (
    <div className={cn("flex items-center gap-2 text-gray-600", className)}>
      <LoadingSpinner size={size} />
      <span className="text-sm">{text}</span>
    </div>
  );
}

// Button loading state
interface LoadingButtonProps {
  isLoading: boolean;
  children: React.ReactNode;
  loadingText?: string;
  className?: string;
  disabled?: boolean;
  [key: string]: any;
}

export function LoadingButton({ 
  isLoading, 
  children, 
  loadingText,
  className,
  disabled,
  ...props 
}: LoadingButtonProps) {
  return (
    <button 
      className={cn(
        "inline-flex items-center gap-2",
        className
      )}
      disabled={isLoading || disabled}
      {...props}
    >
      {isLoading && <LoadingSpinner size="sm" />}
      {isLoading && loadingText ? loadingText : children}
    </button>
  );
}