// Optimized Loading Components
// Clean, accessible loading states with performance optimization

import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2, Search, Home, MapPin } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  color?: 'primary' | 'secondary' | 'white';
}

const spinnerSizes = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12'
};

const spinnerColors = {
  primary: 'text-blue-600',
  secondary: 'text-gray-600',
  white: 'text-white'
};

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className,
  color = 'primary'
}) => {
  return (
    <Loader2
      className={cn(
        'animate-spin',
        spinnerSizes[size],
        spinnerColors[color],
        className
      )}
      aria-label="Loading"
    />
  );
};

// Skeleton loading for content
interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string | number;
  height?: string | number;
  lines?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className,
  variant = 'text',
  width,
  height,
  lines = 1
}) => {
  const baseClasses = 'animate-pulse bg-gray-200 rounded';
  
  const variantClasses = {
    text: 'h-4',
    rectangular: 'h-24',
    circular: 'rounded-full'
  };

  if (variant === 'text' && lines > 1) {
    return (
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, index) => (
          <div
            key={index}
            className={cn(
              baseClasses,
              variantClasses[variant],
              index === lines - 1 && 'w-3/4', // Last line shorter
              className
            )}
            style={{ width, height }}
          />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        className
      )}
      style={{ width, height }}
    />
  );
};

// Property card skeleton
export const PropertyCardSkeleton: React.FC = () => {
  return (
    <div className="border rounded-lg p-4 space-y-4">
      <Skeleton variant="rectangular" height="200px" />
      <div className="space-y-2">
        <Skeleton width="75%" />
        <Skeleton width="50%" />
      </div>
      <div className="flex justify-between items-center">
        <Skeleton width="80px" />
        <Skeleton variant="circular" width="24px" height="24px" />
      </div>
      <div className="flex gap-2">
        <Skeleton width="60px" height="20px" />
        <Skeleton width="80px" height="20px" />
        <Skeleton width="70px" height="20px" />
      </div>
      <Skeleton height="36px" />
    </div>
  );
};

// Full page loading
interface PageLoadingProps {
  message?: string;
  showProgress?: boolean;
  progress?: number;
}

export const PageLoading: React.FC<PageLoadingProps> = ({
  message = 'Loading...',
  showProgress = false,
  progress = 0
}) => {
  return (
    <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50">
      <div className="text-center space-y-4">
        <LoadingSpinner size="xl" />
        <p className="text-lg font-medium text-gray-700">{message}</p>
        
        {showProgress && (
          <div className="w-64 bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Section loading
interface SectionLoadingProps {
  message?: string;
  icon?: React.ComponentType<{ className?: string }>;
  className?: string;
}

export const SectionLoading: React.FC<SectionLoadingProps> = ({
  message = 'Loading...',
  icon: Icon = LoadingSpinner,
  className
}) => {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 space-y-4', className)}>
      {Icon === LoadingSpinner ? (
        <LoadingSpinner size="lg" />
      ) : (
        <Icon className="h-8 w-8 text-gray-400" />
      )}
      <p className="text-gray-600">{message}</p>
    </div>
  );
};

// Property search loading with context
export const PropertySearchLoading: React.FC = () => {
  return (
    <SectionLoading
      message="Searching properties across multiple platforms..."
      icon={Search}
    />
  );
};

// Map loading
export const MapLoading: React.FC = () => {
  return (
    <SectionLoading
      message="Loading interactive map..."
      icon={MapPin}
    />
  );
};

// Property details loading
export const PropertyDetailsLoading: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Skeleton variant="rectangular" height="300px" />
        <div className="grid grid-cols-4 gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height="80px" />
          ))}
        </div>
      </div>
      
      <div className="space-y-4">
        <Skeleton width="200px" height="32px" />
        <Skeleton lines={3} />
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Skeleton width="100px" />
          <Skeleton width="80px" />
        </div>
        <div className="space-y-2">
          <Skeleton width="120px" />
          <Skeleton width="90px" />
        </div>
      </div>
    </div>
  );
};

// Inline loading for buttons and small components
interface InlineLoadingProps {
  size?: 'sm' | 'md';
  text?: string;
  className?: string;
}

export const InlineLoading: React.FC<InlineLoadingProps> = ({
  size = 'sm',
  text,
  className
}) => {
  return (
    <div className={cn('flex items-center space-x-2', className)}>
      <LoadingSpinner size={size} />
      {text && <span className="text-sm text-gray-600">{text}</span>}
    </div>
  );
};

// Loading overlay for existing content
interface LoadingOverlayProps {
  loading: boolean;
  children: React.ReactNode;
  message?: string;
  blur?: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  loading,
  children,
  message = 'Loading...',
  blur = true
}) => {
  return (
    <div className="relative">
      <div className={cn(loading && blur && 'filter blur-sm transition-all duration-200')}>
        {children}
      </div>
      
      {loading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <div className="text-center space-y-2">
            <LoadingSpinner size="lg" />
            <p className="text-sm font-medium text-gray-700">{message}</p>
          </div>
        </div>
      )}
    </div>
  );
};

// Progressive loading for lists
interface ProgressiveLoadingProps {
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  skeleton: React.ComponentType;
  loading: boolean;
  loadingCount?: number;
  className?: string;
}

export const ProgressiveLoading: React.FC<ProgressiveLoadingProps> = ({
  items,
  renderItem,
  skeleton: SkeletonComponent,
  loading,
  loadingCount = 3,
  className
}) => {
  return (
    <div className={className}>
      {items.map(renderItem)}
      
      {loading && Array.from({ length: loadingCount }).map((_, index) => (
        <SkeletonComponent key={`skeleton-${index}`} />
      ))}
    </div>
  );
};

// Error boundary loading fallback
export const ErrorBoundaryLoading: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
      <Home className="h-12 w-12 text-gray-400" />
      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900">Loading StudentHome</h3>
        <p className="text-gray-600">Please wait while we prepare your accommodation search...</p>
      </div>
      <LoadingSpinner size="lg" />
    </div>
  );
};

// Lazy loading wrapper
interface LazyLoadingProps {
  children: React.ReactNode;
  fallback?: React.ComponentType;
  className?: string;
}

export const LazyLoading: React.FC<LazyLoadingProps> = ({
  children,
  fallback: Fallback = SectionLoading,
  className
}) => {
  return (
    <React.Suspense fallback={<Fallback />}>
      <div className={className}>
        {children}
      </div>
    </React.Suspense>
  );
};

export default LoadingSpinner;
