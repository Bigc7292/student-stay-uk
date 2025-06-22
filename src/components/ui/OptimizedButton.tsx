// Optimized Button Component
// Clean, accessible, and performant button implementation

import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface OptimizedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  loading?: boolean;
  loadingText?: string;
  icon?: React.ComponentType<{ className?: string }>;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const buttonVariants = {
  default: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
  destructive: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500',
  secondary: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500',
  ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
  link: 'text-blue-600 underline-offset-4 hover:underline focus:ring-blue-500'
};

const buttonSizes = {
  default: 'h-10 px-4 py-2 text-sm',
  sm: 'h-8 px-3 py-1 text-xs',
  lg: 'h-12 px-8 py-3 text-base',
  icon: 'h-10 w-10 p-0'
};

export const OptimizedButton = React.forwardRef<HTMLButtonElement, OptimizedButtonProps>(
  ({
    className,
    variant = 'default',
    size = 'default',
    loading = false,
    loadingText,
    icon: Icon,
    iconPosition = 'left',
    fullWidth = false,
    children,
    disabled,
    type = 'button',
    ...props
  }, ref) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        type={type}
        disabled={isDisabled}
        className={cn(
          // Base styles
          'inline-flex items-center justify-center rounded-md font-medium transition-colors',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'disabled:opacity-50 disabled:pointer-events-none',
          
          // Variant styles
          buttonVariants[variant],
          
          // Size styles
          buttonSizes[size],
          
          // Full width
          fullWidth && 'w-full',
          
          // Custom className
          className
        )}
        {...props}
      >
        {loading && (
          <Loader2 className={cn(
            'animate-spin',
            size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4',
            children && 'mr-2'
          )} />
        )}
        
        {!loading && Icon && iconPosition === 'left' && (
          <Icon className={cn(
            size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4',
            children && 'mr-2'
          )} />
        )}
        
        {loading ? (loadingText || 'Loading...') : children}
        
        {!loading && Icon && iconPosition === 'right' && (
          <Icon className={cn(
            size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4',
            children && 'ml-2'
          )} />
        )}
      </button>
    );
  }
);

OptimizedButton.displayName = 'OptimizedButton';

// Specialized button variants for common use cases
export const PrimaryButton: React.FC<OptimizedButtonProps> = (props) => (
  <OptimizedButton variant="default" {...props} />
);

export const SecondaryButton: React.FC<OptimizedButtonProps> = (props) => (
  <OptimizedButton variant="outline" {...props} />
);

export const DangerButton: React.FC<OptimizedButtonProps> = (props) => (
  <OptimizedButton variant="destructive" {...props} />
);

export const GhostButton: React.FC<OptimizedButtonProps> = (props) => (
  <OptimizedButton variant="ghost" {...props} />
);

export const LinkButton: React.FC<OptimizedButtonProps> = (props) => (
  <OptimizedButton variant="link" {...props} />
);

// Button group component for related actions
interface ButtonGroupProps {
  children: React.ReactNode;
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  size?: 'sm' | 'default' | 'lg';
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  children,
  className,
  orientation = 'horizontal',
  size = 'default'
}) => {
  return (
    <div
      className={cn(
        'inline-flex',
        orientation === 'horizontal' ? 'flex-row' : 'flex-col',
        '[&>button]:rounded-none',
        '[&>button:first-child]:rounded-l-md',
        '[&>button:last-child]:rounded-r-md',
        orientation === 'vertical' && '[&>button:first-child]:rounded-t-md [&>button:first-child]:rounded-l-none',
        orientation === 'vertical' && '[&>button:last-child]:rounded-b-md [&>button:last-child]:rounded-r-none',
        '[&>button:not(:first-child)]:border-l-0',
        orientation === 'vertical' && '[&>button:not(:first-child)]:border-l [&>button:not(:first-child)]:border-t-0',
        className
      )}
      role="group"
    >
      {children}
    </div>
  );
};

// Floating Action Button for mobile
interface FABProps extends OptimizedButtonProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

export const FloatingActionButton: React.FC<FABProps> = ({
  position = 'bottom-right',
  className,
  ...props
}) => {
  const positionClasses = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'top-right': 'fixed top-6 right-6',
    'top-left': 'fixed top-6 left-6'
  };

  return (
    <OptimizedButton
      size="icon"
      className={cn(
        positionClasses[position],
        'h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow z-50',
        className
      )}
      {...props}
    />
  );
};

// Icon button with tooltip
interface IconButtonProps extends OptimizedButtonProps {
  tooltip?: string;
  'aria-label': string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  tooltip,
  'aria-label': ariaLabel,
  ...props
}) => {
  return (
    <OptimizedButton
      size="icon"
      variant="ghost"
      aria-label={ariaLabel}
      title={tooltip}
      {...props}
    />
  );
};

// Loading button with progress
interface LoadingButtonProps extends OptimizedButtonProps {
  progress?: number; // 0-100
}

export const LoadingButton: React.FC<LoadingButtonProps> = ({
  progress,
  loading,
  children,
  className,
  ...props
}) => {
  return (
    <div className="relative">
      <OptimizedButton
        loading={loading}
        className={cn(className)}
        {...props}
      >
        {children}
      </OptimizedButton>
      
      {typeof progress === 'number' && (
        <div className="absolute bottom-0 left-0 h-1 bg-blue-200 rounded-b-md overflow-hidden">
          <div
            className="h-full bg-blue-600 transition-all duration-300 ease-out"
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}
    </div>
  );
};

export default OptimizedButton;
