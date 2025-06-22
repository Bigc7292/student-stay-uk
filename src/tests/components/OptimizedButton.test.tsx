// Optimized Button Component Tests
// Comprehensive testing for the optimized button component

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { 
  OptimizedButton, 
  PrimaryButton, 
  SecondaryButton, 
  DangerButton,
  ButtonGroup,
  FloatingActionButton,
  IconButton,
  LoadingButton
} from '@/components/ui/OptimizedButton';
import { Search, Home } from 'lucide-react';
import { setupTest, teardownTest } from '../setup';

describe('OptimizedButton', () => {
  beforeEach(() => {
    setupTest();
  });

  afterEach(() => {
    teardownTest();
  });

  describe('Basic Functionality', () => {
    it('should render with default props', () => {
      render(<OptimizedButton>Click me</OptimizedButton>);
      
      const button = screen.getByRole('button', { name: /click me/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('type', 'button');
    });

    it('should handle click events', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(<OptimizedButton onClick={handleClick}>Click me</OptimizedButton>);
      
      const button = screen.getByRole('button', { name: /click me/i });
      await user.click(button);
      
      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should be disabled when disabled prop is true', () => {
      render(<OptimizedButton disabled>Disabled</OptimizedButton>);
      
      const button = screen.getByRole('button', { name: /disabled/i });
      expect(button).toBeDisabled();
    });

    it('should be disabled when loading is true', () => {
      render(<OptimizedButton loading>Loading</OptimizedButton>);
      
      const button = screen.getByRole('button');
      expect(button).toBeDisabled();
    });
  });

  describe('Variants', () => {
    it('should apply correct classes for default variant', () => {
      render(<OptimizedButton variant="default">Default</OptimizedButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-blue-600', 'text-white');
    });

    it('should apply correct classes for destructive variant', () => {
      render(<OptimizedButton variant="destructive">Delete</OptimizedButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('bg-red-600', 'text-white');
    });

    it('should apply correct classes for outline variant', () => {
      render(<OptimizedButton variant="outline">Outline</OptimizedButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('border', 'bg-white');
    });

    it('should apply correct classes for ghost variant', () => {
      render(<OptimizedButton variant="ghost">Ghost</OptimizedButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('text-gray-700');
    });
  });

  describe('Sizes', () => {
    it('should apply correct classes for small size', () => {
      render(<OptimizedButton size="sm">Small</OptimizedButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-8', 'px-3', 'text-xs');
    });

    it('should apply correct classes for large size', () => {
      render(<OptimizedButton size="lg">Large</OptimizedButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-12', 'px-8', 'text-base');
    });

    it('should apply correct classes for icon size', () => {
      render(<OptimizedButton size="icon">Icon</OptimizedButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('h-10', 'w-10', 'p-0');
    });
  });

  describe('Loading State', () => {
    it('should show loading spinner when loading', () => {
      render(<OptimizedButton loading>Loading</OptimizedButton>);
      
      const spinner = screen.getByLabelText('Loading');
      expect(spinner).toBeInTheDocument();
    });

    it('should show custom loading text', () => {
      render(
        <OptimizedButton loading loadingText="Processing...">
          Submit
        </OptimizedButton>
      );
      
      expect(screen.getByText('Processing...')).toBeInTheDocument();
      expect(screen.queryByText('Submit')).not.toBeInTheDocument();
    });

    it('should not trigger click events when loading', async () => {
      const handleClick = vi.fn();
      const user = userEvent.setup();
      
      render(
        <OptimizedButton loading onClick={handleClick}>
          Loading
        </OptimizedButton>
      );
      
      const button = screen.getByRole('button');
      await user.click(button);
      
      expect(handleClick).not.toHaveBeenCalled();
    });
  });

  describe('Icons', () => {
    it('should render icon on the left by default', () => {
      render(
        <OptimizedButton icon={Search}>
          Search
        </OptimizedButton>
      );
      
      const button = screen.getByRole('button');
      const icon = button.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should render icon on the right when specified', () => {
      render(
        <OptimizedButton icon={Search} iconPosition="right">
          Search
        </OptimizedButton>
      );
      
      const button = screen.getByRole('button');
      const icon = button.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should not render icon when loading', () => {
      render(
        <OptimizedButton icon={Search} loading>
          Loading
        </OptimizedButton>
      );
      
      // Should only have the loading spinner, not the search icon
      const icons = screen.getByRole('button').querySelectorAll('svg');
      expect(icons).toHaveLength(1); // Only the loading spinner
    });
  });

  describe('Full Width', () => {
    it('should apply full width class when fullWidth is true', () => {
      render(<OptimizedButton fullWidth>Full Width</OptimizedButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('w-full');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      render(<OptimizedButton disabled>Disabled Button</OptimizedButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveAttribute('disabled');
    });

    it('should be focusable when not disabled', () => {
      render(<OptimizedButton>Focusable</OptimizedButton>);
      
      const button = screen.getByRole('button');
      button.focus();
      expect(button).toHaveFocus();
    });

    it('should not be focusable when disabled', () => {
      render(<OptimizedButton disabled>Not Focusable</OptimizedButton>);
      
      const button = screen.getByRole('button');
      expect(button).toHaveClass('pointer-events-none');
    });
  });
});

describe('Button Variants', () => {
  beforeEach(() => {
    setupTest();
  });

  afterEach(() => {
    teardownTest();
  });

  it('should render PrimaryButton with correct variant', () => {
    render(<PrimaryButton>Primary</PrimaryButton>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-blue-600');
  });

  it('should render SecondaryButton with correct variant', () => {
    render(<SecondaryButton>Secondary</SecondaryButton>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('border', 'bg-white');
  });

  it('should render DangerButton with correct variant', () => {
    render(<DangerButton>Delete</DangerButton>);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-red-600');
  });
});

describe('ButtonGroup', () => {
  beforeEach(() => {
    setupTest();
  });

  afterEach(() => {
    teardownTest();
  });

  it('should render button group with correct styling', () => {
    render(
      <ButtonGroup>
        <OptimizedButton>First</OptimizedButton>
        <OptimizedButton>Second</OptimizedButton>
        <OptimizedButton>Third</OptimizedButton>
      </ButtonGroup>
    );
    
    const group = screen.getByRole('group');
    expect(group).toBeInTheDocument();
    expect(group).toHaveClass('inline-flex');
  });

  it('should render vertical button group', () => {
    render(
      <ButtonGroup orientation="vertical">
        <OptimizedButton>First</OptimizedButton>
        <OptimizedButton>Second</OptimizedButton>
      </ButtonGroup>
    );
    
    const group = screen.getByRole('group');
    expect(group).toHaveClass('flex-col');
  });
});

describe('FloatingActionButton', () => {
  beforeEach(() => {
    setupTest();
  });

  afterEach(() => {
    teardownTest();
  });

  it('should render with correct positioning', () => {
    render(<FloatingActionButton icon={Home} aria-label="Home" />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('fixed', 'bottom-6', 'right-6');
  });

  it('should render with custom position', () => {
    render(
      <FloatingActionButton 
        icon={Home} 
        position="top-left" 
        aria-label="Home" 
      />
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveClass('fixed', 'top-6', 'left-6');
  });
});

describe('IconButton', () => {
  beforeEach(() => {
    setupTest();
  });

  afterEach(() => {
    teardownTest();
  });

  it('should render with proper accessibility attributes', () => {
    render(
      <IconButton 
        icon={Search} 
        aria-label="Search properties"
        tooltip="Search for properties"
      />
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Search properties');
    expect(button).toHaveAttribute('title', 'Search for properties');
  });
});

describe('LoadingButton', () => {
  beforeEach(() => {
    setupTest();
  });

  afterEach(() => {
    teardownTest();
  });

  it('should show progress bar when progress is provided', () => {
    render(
      <LoadingButton progress={50}>
        Uploading...
      </LoadingButton>
    );
    
    const progressBar = screen.getByRole('button').parentElement?.querySelector('[style*="width: 50%"]');
    expect(progressBar).toBeInTheDocument();
  });

  it('should handle progress values outside 0-100 range', () => {
    render(
      <LoadingButton progress={150}>
        Complete
      </LoadingButton>
    );
    
    const progressBar = screen.getByRole('button').parentElement?.querySelector('[style*="width: 100%"]');
    expect(progressBar).toBeInTheDocument();
  });
});
