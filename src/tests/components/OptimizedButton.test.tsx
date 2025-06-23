
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { OptimizedButton } from '../../components/ui/OptimizedButton';

describe('OptimizedButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders button with children', () => {
    render(<OptimizedButton>Test Button</OptimizedButton>);
    expect(screen.getByRole('button', { name: 'Test Button' })).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<OptimizedButton onClick={handleClick}>Click Me</OptimizedButton>);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies variant styles', () => {
    render(<OptimizedButton variant="destructive">Delete</OptimizedButton>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('bg-destructive');
  });

  it('applies size styles', () => {
    render(<OptimizedButton size="lg">Large Button</OptimizedButton>);
    const button = screen.getByRole('button');
    expect(button).toHaveClass('h-11');
  });

  it('can be disabled', () => {
    render(<OptimizedButton disabled>Disabled Button</OptimizedButton>);
    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  describe('Loading state', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('shows loading spinner when loading', () => {
      render(<OptimizedButton loading>Loading</OptimizedButton>);
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
    });
  });

  describe('Icon variants', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('renders with icon', () => {
      const Icon = () => <span data-testid="icon">Icon</span>;
      render(<OptimizedButton icon={Icon}>With Icon</OptimizedButton>);
      expect(screen.getByTestId('icon')).toBeInTheDocument();
    });
  });

  describe('Animation states', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('handles hover animations', async () => {
      render(<OptimizedButton animate>Animated</OptimizedButton>);
      const button = screen.getByRole('button');
      
      fireEvent.mouseEnter(button);
      await waitFor(() => {
        expect(button).toHaveClass('hover:scale-105');
      });
    });
  });

  describe('Accessibility', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('supports keyboard navigation', () => {
      const handleClick = vi.fn();
      render(<OptimizedButton onClick={handleClick}>Keyboard</OptimizedButton>);
      
      const button = screen.getByRole('button');
      fireEvent.keyDown(button, { key: 'Enter' });
      expect(handleClick).toHaveBeenCalled();
    });
  });

  describe('Custom styling', () => {
    beforeEach(() => {
      vi.clearAllMocks();
    });

    it('accepts custom className', () => {
      render(<OptimizedButton className="custom-class">Custom</OptimizedButton>);
      expect(screen.getByRole('button')).toHaveClass('custom-class');
    });
  });
