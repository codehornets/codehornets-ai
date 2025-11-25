/**
 * @fileoverview StatusBadge Component Tests
 * Tests for status badge rendering and styles
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatusBadge from '../StatusBadge';

describe('StatusBadge Component', () => {
  describe('Status Variants', () => {
    it('should render active status', () => {
      const { container } = render(<StatusBadge status="active" />);

      expect(screen.getByText('Active')).toBeInTheDocument();

      const badge = container.querySelector('.bg-green-500\\/10');
      expect(badge).toBeInTheDocument();
    });

    it('should render inactive status', () => {
      const { container } = render(<StatusBadge status="inactive" />);

      expect(screen.getByText('Inactive')).toBeInTheDocument();

      const badge = container.querySelector('.bg-slate-500\\/10');
      expect(badge).toBeInTheDocument();
    });

    it('should render pending status', () => {
      const { container } = render(<StatusBadge status="pending" />);

      expect(screen.getByText('Pending')).toBeInTheDocument();

      const badge = container.querySelector('.bg-amber-500\\/10');
      expect(badge).toBeInTheDocument();
    });

    it('should render running status with animation', () => {
      const { container } = render(<StatusBadge status="running" />);

      expect(screen.getByText('Running')).toBeInTheDocument();

      const badge = container.querySelector('.animate-pulse');
      expect(badge).toBeInTheDocument();

      const icon = container.querySelector('.animate-spin');
      expect(icon).toBeInTheDocument();
    });

    it('should render completed status', () => {
      const { container } = render(<StatusBadge status="completed" />);

      expect(screen.getByText('Completed')).toBeInTheDocument();

      const badge = container.querySelector('.bg-green-500\\/10');
      expect(badge).toBeInTheDocument();
    });

    it('should render failed status', () => {
      const { container } = render(<StatusBadge status="failed" />);

      expect(screen.getByText('Failed')).toBeInTheDocument();

      const badge = container.querySelector('.bg-red-500\\/10');
      expect(badge).toBeInTheDocument();
    });

    it('should render cancelled status', () => {
      const { container } = render(<StatusBadge status="cancelled" />);

      expect(screen.getByText('Cancelled')).toBeInTheDocument();

      const badge = container.querySelector('.bg-slate-500\\/10');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Unknown Status', () => {
    it('should fallback to pending for unknown status', () => {
      const { container } = render(<StatusBadge status="unknown" />);

      expect(screen.getByText('Pending')).toBeInTheDocument();

      const badge = container.querySelector('.bg-amber-500\\/10');
      expect(badge).toBeInTheDocument();
    });
  });

  describe('Icons', () => {
    it('should render correct icon for each status', () => {
      const { container: activeContainer } = render(<StatusBadge status="active" />);
      expect(activeContainer.querySelector('svg')).toBeInTheDocument();

      const { container: failedContainer } = render(<StatusBadge status="failed" />);
      expect(failedContainer.querySelector('svg')).toBeInTheDocument();

      const { container: runningContainer } = render(<StatusBadge status="running" />);
      const runningIcon = runningContainer.querySelector('.animate-spin');
      expect(runningIcon).toBeInTheDocument();
    });
  });

  describe('Size Prop', () => {
    it('should accept size prop', () => {
      // Size prop is defined but not used in implementation
      // This test ensures it doesn't break
      render(<StatusBadge status="active" size="small" />);

      expect(screen.getByText('Active')).toBeInTheDocument();
    });

    it('should use default size', () => {
      render(<StatusBadge status="active" />);

      expect(screen.getByText('Active')).toBeInTheDocument();
    });
  });

  describe('Styling', () => {
    it('should have border class', () => {
      const { container } = render(<StatusBadge status="active" />);

      const badge = container.querySelector('.border');
      expect(badge).toBeInTheDocument();
    });

    it('should apply color-specific classes', () => {
      const { container } = render(<StatusBadge status="failed" />);

      const badge = container.querySelector('.text-red-400');
      expect(badge).toBeInTheDocument();
    });
  });
});
