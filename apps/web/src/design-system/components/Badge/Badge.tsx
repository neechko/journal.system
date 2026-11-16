/**
 * Badge Component
 * Small status indicator or label
 */

'use client';

import { forwardRef, HTMLAttributes, ReactNode } from 'react';

export type BadgeVariant =
  | 'default'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'neutral'
  | 'brand'
  | 'outline'
  | 'outline-success'
  | 'outline-warning'
  | 'outline-error'
  | 'outline-info';

export type BadgeSize = 'sm' | 'md' | 'lg';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  icon?: ReactNode;
  children: ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: `
    background-color: var(--color-brand-primary-light);
    color: var(--color-brand-primary);
    border: 1px solid transparent;
  `,
  success: `
    background-color: var(--color-status-success-light);
    color: var(--color-status-success);
    border: 1px solid transparent;
  `,
  warning: `
    background-color: var(--color-status-warning-light);
    color: var(--color-status-warning);
    border: 1px solid transparent;
  `,
  error: `
    background-color: var(--color-status-error-light);
    color: var(--color-status-error);
    border: 1px solid transparent;
  `,
  info: `
    background-color: var(--color-status-info-light);
    color: var(--color-status-info);
    border: 1px solid transparent;
  `,
  neutral: `
    background-color: var(--color-background-tertiary);
    color: var(--color-text-secondary);
    border: 1px solid transparent;
  `,
  brand: `
    background-color: var(--color-brand-primary);
    color: var(--color-text-inverse);
    border: 1px solid transparent;
  `,
  outline: `
    background-color: transparent;
    color: var(--color-brand-primary);
    border: 1px solid var(--color-brand-primary);
  `,
  'outline-success': `
    background-color: transparent;
    color: var(--color-status-success);
    border: 1px solid var(--color-status-success);
  `,
  'outline-warning': `
    background-color: transparent;
    color: var(--color-status-warning);
    border: 1px solid var(--color-status-warning);
  `,
  'outline-error': `
    background-color: transparent;
    color: var(--color-status-error);
    border: 1px solid var(--color-status-error);
  `,
  'outline-info': `
    background-color: transparent;
    color: var(--color-status-info);
    border: 1px solid var(--color-status-info);
  `,
};

const sizeStyles: Record<BadgeSize, string> = {
  sm: `
    padding: 2px 6px;
    font-size: var(--font-size-component-caption);
    border-radius: 9999px;
    gap: var(--spacing-1);
  `,
  md: `
    padding: 3px 8px;
    font-size: var(--font-size-component-caption);
    border-radius: 9999px;
    gap: var(--spacing-1);
  `,
  lg: `
    padding: 4px 10px;
    font-size: var(--font-size-sm);
    border-radius: 9999px;
    gap: var(--spacing-2);
  `,
};

const baseStyles = `
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: inherit;
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-normal);
  letter-spacing: var(--letter-spacing-wide);
  white-space: nowrap;
  vertical-align: middle;
`;

const dotStyles = `
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
  background-color: currentColor;
`;

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    {
      variant = 'default',
      size = 'md',
      dot = false,
      icon,
      children,
      className = '',
      style,
      ...props
    },
    ref
  ) => {
    const badgeStyle: React.CSSProperties = {
      ...style,
    } as React.CSSProperties;

    const css = `
      ${baseStyles}
      ${variantStyles[variant]}
      ${sizeStyles[size]}
    `;

    const dotColorMap: Record<string, string> = {
      default: 'var(--color-brand-primary)',
      success: 'var(--color-status-success)',
      warning: 'var(--color-status-warning)',
      error: 'var(--color-status-error)',
      info: 'var(--color-status-info)',
      neutral: 'var(--color-text-secondary)',
      brand: 'var(--color-text-inverse)',
      outline: 'var(--color-brand-primary)',
      'outline-success': 'var(--color-status-success)',
      'outline-warning': 'var(--color-status-warning)',
      'outline-error': 'var(--color-status-error)',
      'outline-info': 'var(--color-status-info)',
    };

    return (
      <span
        ref={ref}
        className={className}
        style={badgeStyle}
        {...props}
      >
        {(dot || icon) && (
          <span
            style={{
              ...dotStyles as React.CSSProperties,
              backgroundColor: icon ? 'currentColor' : dotColorMap[variant],
            }}
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
        <span>{children}</span>
        <style jsx>{css}</style>
      </span>
    );
  }
);

Badge.displayName = 'Badge';

// Status badge helper
export interface StatusBadgeProps {
  status: 'draft' | 'submitted' | 'under_review' | 'revision_required' | 'accepted' | 'published' | 'rejected' | 'withdrawn';
  size?: BadgeSize;
  showIcon?: boolean;
}

export const StatusBadge = ({ status, size = 'md', showIcon = true }: StatusBadgeProps) => {
  const statusConfig: Record<StatusBadgeProps['status'], { label: string; variant: BadgeVariant; icon?: ReactNode }> = {
    draft: { label: 'Draft', variant: 'neutral' },
    submitted: { label: 'Submitted', variant: 'info' },
    under_review: { label: 'Under Review', variant: 'warning' },
    revision_required: { label: 'Revision Required', variant: 'warning' },
    accepted: { label: 'Accepted', variant: 'success' },
    published: { label: 'Published', variant: 'brand' },
    rejected: { label: 'Rejected', variant: 'error' },
    withdrawn: { label: 'Withdrawn', variant: 'neutral' },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} size={size} dot={showIcon}>
      {config.label}
    </Badge>
  );
};

// Count badge (for notifications, etc.)
export interface CountBadgeProps {
  count: number;
  max?: number;
  variant?: BadgeVariant;
  size?: BadgeSize;
}

export const CountBadge = ({ count, max = 99, variant = 'error', size = 'sm' }: CountBadgeProps) => {
  if (count <= 0) return null;

  const displayCount = count > max ? `${max}+` : count.toString();

  return (
    <Badge variant={variant} size={size}>
      {displayCount}
    </Badge>
  );
};

// Dot indicator (for online status, etc.)
export interface DotBadgeProps {
  status: 'online' | 'offline' | 'busy' | 'away';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
}

export const DotBadge = ({ status, size = 'md', label }: DotBadgeProps) => {
  const statusConfig: Record<DotBadgeProps['status'], { variant: BadgeVariant; label: string }> = {
    online: { variant: 'success', label: 'Online' },
    offline: { variant: 'neutral', label: 'Offline' },
    busy: { variant: 'error', label: 'Busy' },
    away: { variant: 'warning', label: 'Away' },
  };

  const config = statusConfig[status];

  return (
    <Badge variant={config.variant} size={size} dot>
      {label || config.label}
    </Badge>
  );
};