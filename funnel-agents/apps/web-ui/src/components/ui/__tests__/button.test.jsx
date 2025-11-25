/**
 * @fileoverview Button Component Tests
 * Tests for the base Button UI component
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../button';

describe('Button Component', () => {
  describe('Basic Rendering', () => {
    it('should render with children', () => {
      render(<Button>Click me</Button>);
      expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
    });

    it('should render as button element by default', () => {
      const { container } = render(<Button>Test</Button>);
      expect(container.querySelector('button')).toBeInTheDocument();
    });

    it('should have default classes', () => {
      const { container } = render(<Button>Test</Button>);
      const button = container.querySelector('button');

      expect(button).toHaveClass('inline-flex');
      expect(button).toHaveClass('items-center');
      expect(button).toHaveClass('justify-center');
    });
  });

  describe('Variants', () => {
    it('should apply default variant', () => {
      const { container } = render(<Button variant="default">Default</Button>);
      const button = container.querySelector('button');

      expect(button).toHaveClass('bg-primary');
      expect(button).toHaveClass('text-primary-foreground');
    });

    it('should apply destructive variant', () => {
      const { container } = render(<Button variant="destructive">Delete</Button>);
      const button = container.querySelector('button');

      expect(button).toHaveClass('bg-destructive');
      expect(button).toHaveClass('text-destructive-foreground');
    });

    it('should apply outline variant', () => {
      const { container } = render(<Button variant="outline">Outline</Button>);
      const button = container.querySelector('button');

      expect(button).toHaveClass('border');
      expect(button).toHaveClass('bg-background');
    });

    it('should apply secondary variant', () => {
      const { container } = render(<Button variant="secondary">Secondary</Button>);
      const button = container.querySelector('button');

      expect(button).toHaveClass('bg-secondary');
      expect(button).toHaveClass('text-secondary-foreground');
    });

    it('should apply ghost variant', () => {
      const { container } = render(<Button variant="ghost">Ghost</Button>);
      const button = container.querySelector('button');

      expect(button).toHaveClass('hover:bg-accent');
    });

    it('should apply link variant', () => {
      const { container } = render(<Button variant="link">Link</Button>);
      const button = container.querySelector('button');

      expect(button).toHaveClass('text-primary');
      expect(button).toHaveClass('underline-offset-4');
    });
  });

  describe('Sizes', () => {
    it('should apply default size', () => {
      const { container } = render(<Button size="default">Default Size</Button>);
      const button = container.querySelector('button');

      expect(button).toHaveClass('h-9');
      expect(button).toHaveClass('px-4');
    });

    it('should apply small size', () => {
      const { container } = render(<Button size="sm">Small</Button>);
      const button = container.querySelector('button');

      expect(button).toHaveClass('h-8');
      expect(button).toHaveClass('px-3');
      expect(button).toHaveClass('text-xs');
    });

    it('should apply large size', () => {
      const { container } = render(<Button size="lg">Large</Button>);
      const button = container.querySelector('button');

      expect(button).toHaveClass('h-10');
      expect(button).toHaveClass('px-8');
    });

    it('should apply icon size', () => {
      const { container } = render(<Button size="icon">X</Button>);
      const button = container.querySelector('button');

      expect(button).toHaveClass('h-9');
      expect(button).toHaveClass('w-9');
    });
  });

  describe('Event Handlers', () => {
    it('should handle click events', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Button onClick={handleClick}>Click me</Button>);

      const button = screen.getByRole('button', { name: /click me/i });
      await user.click(button);

      expect(handleClick).toHaveBeenCalledTimes(1);
    });

    it('should not trigger click when disabled', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Button onClick={handleClick} disabled>Disabled</Button>);

      const button = screen.getByRole('button', { name: /disabled/i });
      await user.click(button);

      // Click shouldn't trigger on disabled button
      expect(handleClick).not.toHaveBeenCalled();
    });

    it('should handle keyboard events', async () => {
      const user = userEvent.setup();
      const handleClick = vi.fn();

      render(<Button onClick={handleClick}>Press me</Button>);

      const button = screen.getByRole('button', { name: /press me/i });
      button.focus();
      await user.keyboard('{Enter}');

      expect(handleClick).toHaveBeenCalled();
    });
  });

  describe('Disabled State', () => {
    it('should apply disabled styles', () => {
      const { container } = render(<Button disabled>Disabled</Button>);
      const button = container.querySelector('button');

      expect(button).toHaveClass('disabled:pointer-events-none');
      expect(button).toHaveClass('disabled:opacity-50');
      expect(button).toBeDisabled();
    });

    it('should be disabled when disabled prop is true', () => {
      render(<Button disabled>Disabled Button</Button>);
      const button = screen.getByRole('button');

      expect(button).toBeDisabled();
    });
  });

  describe('Custom Props', () => {
    it('should accept custom className', () => {
      const { container } = render(<Button className="custom-class">Custom</Button>);
      const button = container.querySelector('button');

      expect(button).toHaveClass('custom-class');
      // Should still have default classes
      expect(button).toHaveClass('inline-flex');
    });

    it('should forward additional props', () => {
      render(<Button data-testid="custom-button" aria-label="Custom Button">Test</Button>);

      const button = screen.getByTestId('custom-button');
      expect(button).toBeInTheDocument();
      expect(button).toHaveAttribute('aria-label', 'Custom Button');
    });

    it('should forward ref', () => {
      const ref = React.createRef();
      render(<Button ref={ref}>Ref Button</Button>);

      expect(ref.current).toBeInstanceOf(HTMLButtonElement);
      expect(ref.current.textContent).toBe('Ref Button');
    });
  });

  describe('AsChild Prop', () => {
    it('should render as child component when asChild is true', () => {
      const { container } = render(
        <Button asChild>
          <a href="/test">Link Button</a>
        </Button>
      );

      const link = container.querySelector('a');
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute('href', '/test');
      // Should still have button classes
      expect(link).toHaveClass('inline-flex');
    });

    it('should not render button element when asChild is true', () => {
      const { container } = render(
        <Button asChild>
          <a href="/test">Link</a>
        </Button>
      );

      expect(container.querySelector('button')).not.toBeInTheDocument();
    });
  });

  describe('Children and Content', () => {
    it('should render with icon children', () => {
      const Icon = () => <svg data-testid="icon">Icon</svg>;

      render(
        <Button>
          <Icon />
          Click me
        </Button>
      );

      expect(screen.getByTestId('icon')).toBeInTheDocument();
      expect(screen.getByText('Click me')).toBeInTheDocument();
    });

    it('should render with multiple children', () => {
      render(
        <Button>
          <span>Before</span>
          <span>After</span>
        </Button>
      );

      expect(screen.getByText('Before')).toBeInTheDocument();
      expect(screen.getByText('After')).toBeInTheDocument();
    });
  });

  describe('Type Attribute', () => {
    it('should default to button type', () => {
      render(<Button>Button</Button>);
      const button = screen.getByRole('button');

      // Default button type in HTML is "submit" if no type is specified
      // But we can explicitly set it
      expect(button).toHaveAttribute('type', 'button');
    });

    it('should accept custom type', () => {
      render(<Button type="submit">Submit</Button>);
      const button = screen.getByRole('button');

      expect(button).toHaveAttribute('type', 'submit');
    });
  });

  describe('Accessibility', () => {
    it('should have focus visible ring', () => {
      const { container } = render(<Button>Focus me</Button>);
      const button = container.querySelector('button');

      expect(button).toHaveClass('focus-visible:outline-none');
      expect(button).toHaveClass('focus-visible:ring-1');
    });

    it('should be keyboard navigable', async () => {
      const handleClick = vi.fn();
      render(<Button onClick={handleClick}>Tab to me</Button>);

      const button = screen.getByRole('button');
      button.focus();

      expect(button).toHaveFocus();
    });

    it('should support aria-label', () => {
      render(<Button aria-label="Close dialog">X</Button>);

      const button = screen.getByRole('button', { name: /close dialog/i });
      expect(button).toBeInTheDocument();
    });
  });
});
