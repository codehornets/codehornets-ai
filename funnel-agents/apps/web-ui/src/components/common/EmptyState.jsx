import React from 'react';
import {
  Inbox,
  FileText,
  Users,
  Folder,
  Search,
  Plus,
  AlertCircle,
  PackageOpen,
  Database,
  FolderOpen,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

/**
 * EmptyState Component
 * Displays when lists, tables, or containers have no data
 *
 * @param {Object} props
 * @param {string} props.icon - Icon name or custom icon component
 * @param {string} props.title - Main heading
 * @param {string} props.description - Supporting text
 * @param {string} props.actionLabel - Button text
 * @param {Function} props.onAction - Button click handler
 * @param {string} props.variant - Visual style variant
 * @param {boolean} props.compact - Reduced padding
 * @param {React.ReactNode} props.children - Additional content
 * @param {React.ReactNode} props.illustration - Custom illustration
 */
export default function EmptyState({
  icon = 'inbox',
  title = 'No items yet',
  description = 'Get started by creating your first item',
  actionLabel,
  onAction,
  actionIcon: ActionIcon = Plus,
  variant = 'default',
  compact = false,
  className,
  children,
  illustration,
  secondaryAction,
  secondaryActionLabel,
  onSecondaryAction,
}) {
  // Icon mapping
  const iconMap = {
    inbox: Inbox,
    file: FileText,
    users: Users,
    folder: Folder,
    search: Search,
    alert: AlertCircle,
    package: PackageOpen,
    database: Database,
    folderOpen: FolderOpen,
  };

  const Icon = typeof icon === 'string' ? iconMap[icon] || Inbox : icon;

  // Variant styles
  const variants = {
    default: {
      container: 'bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800',
      icon: 'text-slate-400 dark:text-slate-600',
      title: 'text-slate-900 dark:text-slate-100',
      description: 'text-slate-600 dark:text-slate-400',
    },
    error: {
      container: 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-900',
      icon: 'text-red-400 dark:text-red-600',
      title: 'text-red-900 dark:text-red-100',
      description: 'text-red-700 dark:text-red-300',
    },
    success: {
      container: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-900',
      icon: 'text-green-400 dark:text-green-600',
      title: 'text-green-900 dark:text-green-100',
      description: 'text-green-700 dark:text-green-300',
    },
    info: {
      container: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900',
      icon: 'text-blue-400 dark:text-blue-600',
      title: 'text-blue-900 dark:text-blue-100',
      description: 'text-blue-700 dark:text-blue-300',
    },
  };

  const variantStyles = variants[variant] || variants.default;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        'rounded-lg border-2 border-dashed',
        variantStyles.container,
        compact ? 'py-8 px-4' : 'py-12 px-6',
        className
      )}
      role="status"
      aria-label={title}
    >
      {/* Custom illustration or icon */}
      {illustration ? (
        <div className="mb-4">{illustration}</div>
      ) : (
        <div
          className={cn(
            'rounded-full p-3 mb-4',
            variant === 'default' && 'bg-slate-100 dark:bg-slate-800',
            variant === 'error' && 'bg-red-100 dark:bg-red-900',
            variant === 'success' && 'bg-green-100 dark:bg-green-900',
            variant === 'info' && 'bg-blue-100 dark:bg-blue-900'
          )}
          aria-hidden="true"
        >
          <Icon className={cn('h-8 w-8', variantStyles.icon)} />
        </div>
      )}

      {/* Title */}
      <h3
        className={cn(
          'text-lg font-semibold mb-2',
          variantStyles.title
        )}
      >
        {title}
      </h3>

      {/* Description */}
      {description && (
        <p
          className={cn(
            'text-sm max-w-md mb-6',
            variantStyles.description
          )}
        >
          {description}
        </p>
      )}

      {/* Custom children */}
      {children}

      {/* Action buttons */}
      {(actionLabel || secondaryActionLabel) && (
        <div className="flex flex-wrap gap-2 justify-center mt-4">
          {actionLabel && onAction && (
            <Button
              onClick={onAction}
              variant={variant === 'default' ? 'default' : 'outline'}
              className="flex items-center gap-2"
            >
              <ActionIcon className="h-4 w-4" />
              {actionLabel}
            </Button>
          )}

          {secondaryActionLabel && onSecondaryAction && (
            <Button
              onClick={onSecondaryAction}
              variant="outline"
              className="flex items-center gap-2"
            >
              {secondaryActionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// Preset empty states for common use cases
export function NoResultsEmptyState({ searchQuery, onClear }) {
  return (
    <EmptyState
      icon="search"
      title="No results found"
      description={
        searchQuery
          ? `No results for "${searchQuery}". Try adjusting your search.`
          : 'Try adjusting your filters or search criteria.'
      }
      actionLabel={onClear ? 'Clear filters' : undefined}
      onAction={onClear}
      actionIcon={Search}
      variant="default"
    />
  );
}

export function NoDataEmptyState({ entity = 'item', onCreate }) {
  return (
    <EmptyState
      icon="inbox"
      title={`No ${entity}s yet`}
      description={`Get started by creating your first ${entity}.`}
      actionLabel={`Create ${entity}`}
      onAction={onCreate}
      actionIcon={Plus}
    />
  );
}

export function ErrorEmptyState({ title = 'Failed to load data', onRetry }) {
  return (
    <EmptyState
      icon="alert"
      title={title}
      description="Something went wrong. Please try again."
      actionLabel="Try again"
      onAction={onRetry}
      actionIcon={AlertCircle}
      variant="error"
    />
  );
}

export function LoadingEmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6">
      <div className="h-8 w-8 border-4 border-slate-200 border-t-slate-800 dark:border-slate-800 dark:border-t-slate-200 rounded-full animate-spin mb-4" />
      <p className="text-sm text-slate-600 dark:text-slate-400">Loading...</p>
    </div>
  );
}

// Export individual presets
export {
  EmptyState,
};
