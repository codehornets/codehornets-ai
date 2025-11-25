/**
 * @fileoverview EmptyState Component Tests
 * Tests for empty state display variations
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import EmptyState, {
  NoResultsEmptyState,
  NoDataEmptyState,
  ErrorEmptyState,
  LoadingEmptyState,
} from '../EmptyState';

describe('EmptyState Component', () => {
  describe('Basic Rendering', () => {
    it('should render with default props', () => {
      render(<EmptyState />);

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('No items yet')).toBeInTheDocument();
      expect(screen.getByText('Get started by creating your first item')).toBeInTheDocument();
    });

    it('should render with custom title and description', () => {
      render(
        <EmptyState
          title="Custom Title"
          description="Custom Description"
        />
      );

      expect(screen.getByText('Custom Title')).toBeInTheDocument();
      expect(screen.getByText('Custom Description')).toBeInTheDocument();
    });

    it('should render without description', () => {
      render(<EmptyState title="No Description" description="" />);

      expect(screen.getByText('No Description')).toBeInTheDocument();
      expect(screen.queryByRole('paragraph')).not.toBeInTheDocument();
    });
  });

  describe('Icons', () => {
    it('should render default inbox icon', () => {
      const { container } = render(<EmptyState icon="inbox" />);

      const iconContainer = container.querySelector('[aria-hidden="true"]');
      expect(iconContainer).toBeInTheDocument();
    });

    it('should render different icon types', () => {
      const { rerender } = render(<EmptyState icon="search" />);
      expect(screen.getByRole('status')).toBeInTheDocument();

      rerender(<EmptyState icon="users" />);
      expect(screen.getByRole('status')).toBeInTheDocument();

      rerender(<EmptyState icon="alert" />);
      expect(screen.getByRole('status')).toBeInTheDocument();
    });

    it('should render custom illustration', () => {
      const customIllustration = <div data-testid="custom-illustration">Custom</div>;

      render(<EmptyState illustration={customIllustration} />);

      expect(screen.getByTestId('custom-illustration')).toBeInTheDocument();
    });
  });

  describe('Variants', () => {
    it('should apply default variant styles', () => {
      const { container } = render(<EmptyState variant="default" />);

      const emptyState = container.firstChild;
      expect(emptyState).toHaveClass('bg-slate-50');
    });

    it('should apply error variant styles', () => {
      const { container } = render(<EmptyState variant="error" />);

      const emptyState = container.firstChild;
      expect(emptyState).toHaveClass('bg-red-50');
    });

    it('should apply success variant styles', () => {
      const { container } = render(<EmptyState variant="success" />);

      const emptyState = container.firstChild;
      expect(emptyState).toHaveClass('bg-green-50');
    });

    it('should apply info variant styles', () => {
      const { container } = render(<EmptyState variant="info" />);

      const emptyState = container.firstChild;
      expect(emptyState).toHaveClass('bg-blue-50');
    });
  });

  describe('Actions', () => {
    it('should render action button', () => {
      const handleAction = vi.fn();

      render(
        <EmptyState
          actionLabel="Create Item"
          onAction={handleAction}
        />
      );

      const button = screen.getByRole('button', { name: /create item/i });
      expect(button).toBeInTheDocument();
    });

    it('should call onAction when button clicked', async () => {
      const user = userEvent.setup();
      const handleAction = vi.fn();

      render(
        <EmptyState
          actionLabel="Create Item"
          onAction={handleAction}
        />
      );

      const button = screen.getByRole('button', { name: /create item/i });
      await user.click(button);

      expect(handleAction).toHaveBeenCalledTimes(1);
    });

    it('should render secondary action button', () => {
      const handlePrimary = vi.fn();
      const handleSecondary = vi.fn();

      render(
        <EmptyState
          actionLabel="Primary"
          onAction={handlePrimary}
          secondaryActionLabel="Secondary"
          onSecondaryAction={handleSecondary}
        />
      );

      expect(screen.getByRole('button', { name: 'Primary' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Secondary' })).toBeInTheDocument();
    });

    it('should call secondary action handler', async () => {
      const user = userEvent.setup();
      const handleSecondary = vi.fn();

      render(
        <EmptyState
          secondaryActionLabel="Secondary Action"
          onSecondaryAction={handleSecondary}
        />
      );

      const button = screen.getByRole('button', { name: /secondary action/i });
      await user.click(button);

      expect(handleSecondary).toHaveBeenCalledTimes(1);
    });

    it('should not render action button without handler', () => {
      render(<EmptyState actionLabel="Create Item" />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('Compact Mode', () => {
    it('should apply compact padding', () => {
      const { container } = render(<EmptyState compact />);

      const emptyState = container.firstChild;
      expect(emptyState).toHaveClass('py-8');
    });

    it('should apply normal padding by default', () => {
      const { container } = render(<EmptyState />);

      const emptyState = container.firstChild;
      expect(emptyState).toHaveClass('py-12');
    });
  });

  describe('Custom Children', () => {
    it('should render custom children', () => {
      render(
        <EmptyState>
          <div data-testid="custom-content">Custom Content</div>
        </EmptyState>
      );

      expect(screen.getByTestId('custom-content')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper aria-label', () => {
      render(<EmptyState title="No Items" />);

      const emptyState = screen.getByRole('status');
      expect(emptyState).toHaveAttribute('aria-label', 'No Items');
    });

    it('should mark icon as aria-hidden', () => {
      const { container } = render(<EmptyState />);

      const iconContainer = container.querySelector('[aria-hidden="true"]');
      expect(iconContainer).toBeInTheDocument();
    });
  });
});

describe('NoResultsEmptyState Component', () => {
  it('should render no results message', () => {
    render(<NoResultsEmptyState />);

    expect(screen.getByText('No results found')).toBeInTheDocument();
  });

  it('should display search query in description', () => {
    render(<NoResultsEmptyState searchQuery="test query" />);

    expect(screen.getByText(/No results for "test query"/i)).toBeInTheDocument();
  });

  it('should render clear filters button', () => {
    const handleClear = vi.fn();

    render(<NoResultsEmptyState onClear={handleClear} />);

    expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument();
  });

  it('should call onClear when button clicked', async () => {
    const user = userEvent.setup();
    const handleClear = vi.fn();

    render(<NoResultsEmptyState onClear={handleClear} />);

    const button = screen.getByRole('button', { name: /clear filters/i });
    await user.click(button);

    expect(handleClear).toHaveBeenCalledTimes(1);
  });
});

describe('NoDataEmptyState Component', () => {
  it('should render no data message with entity', () => {
    render(<NoDataEmptyState entity="lead" />);

    expect(screen.getByText('No leads yet')).toBeInTheDocument();
    expect(screen.getByText(/Get started by creating your first lead/i)).toBeInTheDocument();
  });

  it('should use default entity "item"', () => {
    render(<NoDataEmptyState />);

    expect(screen.getByText('No items yet')).toBeInTheDocument();
  });

  it('should render create button', () => {
    const handleCreate = vi.fn();

    render(<NoDataEmptyState entity="agent" onCreate={handleCreate} />);

    expect(screen.getByRole('button', { name: /create agent/i })).toBeInTheDocument();
  });

  it('should call onCreate when button clicked', async () => {
    const user = userEvent.setup();
    const handleCreate = vi.fn();

    render(<NoDataEmptyState onCreate={handleCreate} />);

    const button = screen.getByRole('button');
    await user.click(button);

    expect(handleCreate).toHaveBeenCalledTimes(1);
  });
});

describe('ErrorEmptyState Component', () => {
  it('should render error message', () => {
    render(<ErrorEmptyState />);

    expect(screen.getByText('Failed to load data')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument();
  });

  it('should render custom error title', () => {
    render(<ErrorEmptyState title="Custom Error" />);

    expect(screen.getByText('Custom Error')).toBeInTheDocument();
  });

  it('should render retry button', () => {
    const handleRetry = vi.fn();

    render(<ErrorEmptyState onRetry={handleRetry} />);

    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('should call onRetry when button clicked', async () => {
    const user = userEvent.setup();
    const handleRetry = vi.fn();

    render(<ErrorEmptyState onRetry={handleRetry} />);

    const button = screen.getByRole('button', { name: /try again/i });
    await user.click(button);

    expect(handleRetry).toHaveBeenCalledTimes(1);
  });
});

describe('LoadingEmptyState Component', () => {
  it('should render loading state', () => {
    const { container } = render(<LoadingEmptyState />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    // Check for spinner
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });
});
