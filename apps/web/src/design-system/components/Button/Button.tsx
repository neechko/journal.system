/**
 * Button Component
 * Accessible, theme-aware, motion-aware
 */

'use client';

import { forwardRef, ButtonHTMLAttributes, ReactNode } from 'react';
import { useReducedMotion, useTransition } from '../../hooks/useReducedMotion';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'ghost'
  | 'danger'
  | 'success';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: `
    background-color: var(--color-brand-primary);
    color: var(--color-text-inverse);
    border: 1px solid var(--color-brand-primary);
  `,
  secondary: `
    background-color: var(--color-surface-secondary);
    color: var(--color-text-primary);
    border: 1px solid var(--color-border-primary);
  `,
  outline: `
    background-color: transparent;
    color: var(--color-brand-primary);
    border: 1px solid var(--color-brand-primary);
  `,
  ghost: `
    background-color: transparent;
    color: var(--color-text-primary);
    border: 1px solid transparent;
  `,
  danger: `
    background-color: var(--color-status-error);
    color: var(--color-text-inverse);
    border: 1px solid var(--color-status-error);
  `,
  success: `
    background-color: var(--color-status-success);
    color: var(--color-text-inverse);
    border: 1px solid var(--color-status-success);
  `,
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: `
    padding: var(--spacing-component-buttonPaddingYSm) var(--spacing-component-buttonPaddingXSm);
    font-size: var(--font-size-component-buttonSm);
    gap: var(--spacing-1);
  `,
  md: `
    padding: var(--spacing-component-buttonPaddingY) var(--spacing-component-buttonPaddingX);
    font-size: var(--font-size-component-button);
    gap: var(--spacing-2);
  `,
  lg: `
    padding: var(--spacing-component-buttonPaddingYLg) var(--spacing-component-buttonPaddingXLg);
    font-size: var(--font-size-component-buttonLg);
    gap: var(--spacing-3);
  `,
};

const hoverStyles: Record<ButtonVariant, string> = {
  primary: `
    background-color: var(--color-brand-primary-hover);
    border-color: var(--color-brand-primary-hover);
  `,
  secondary: `
    background-color: var(--color-interactive-hover);
    border-color: var(--color-border-secondary);
  `,
  outline: `
    background-color: var(--color-brand-primary-light);
  `,
  ghost: `
    background-color: var(--color-interactive-hover);
  `,
  danger: `
    background-color: #b91c1c;
    border-color: #b91c1c;
  `,
  success: `
    background-color: #15803d;
    border-color: #15803d;
  `,
};

const activeStyles: Record<ButtonVariant, string> = {
  primary: `
    background-color: var(--color-brand-primary-hover);
    border-color: var(--color-brand-primary-hover);
  `,
  secondary: `
    background-color: var(--color-interactive-active);
  `,
  outline: `
    background-color: var(--color-brand-primary-light);
  `,
  ghost: `
    background-color: var(--color-interactive-active);
  `,
  danger: `
    background-color: #991b1b;
    border-color: #991b1b;
  `,
  success: `
    background-color: #166534;
    border-color: #166534;
  `,
};

const baseStyles = `
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: inherit;
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-normal);
  letter-spacing: var(--letter-spacing-component-button);
  border-radius: 8px;
  cursor: pointer;
  text-decoration: none;
  white-space: nowrap;
  user-select: none;
  transition: var(--transition-component-button);
  outline: none;
`;

const focusStyles = `
  &:focus-visible {
    outline: 2px solid var(--color-border-focus);
    outline-offset: 2px;
  }
`;

const disabledStyles = `
  &:disabled,
  &[aria-disabled="true"] {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }
`;

const loadingStyles = `
  position: relative;
  color: transparent !important;
  pointer-events: none;
`;

const spinnerStyles = `
  position: absolute;
  width: 1em;
  height: 1em;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
`;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      fullWidth = false,
      disabled,
      children,
      className = '',
      style,
      ...props
    },
    ref
  ) => {
    const prefersReduced = useReducedMotion();
    const transition = useTransition(
      'background-color 200ms cubic-bezier(0, 0, 0.2, 1), color 200ms cubic-bezier(0, 0, 0.2, 1), box-shadow 200ms cubic-bezier(0, 0, 0.2, 1), border-color 200ms cubic-bezier(0, 0, 0.2, 1)',
      'none'
    );

    const combinedStyle: React.CSSProperties = {
      ...style,
      transition: prefersReduced ? 'none' : transition,
    } as React.CSSProperties;

    const css = `
      ${baseStyles}
      ${variantStyles[variant]}
      ${sizeStyles[size]}
      ${hoverStyles[variant]}
      ${activeStyles[variant]}
      ${focusStyles}
      ${disabledStyles}
      ${loading ? loadingStyles : ''}
      ${fullWidth ? 'width: 100%;' : ''}
    `;

    return (
      <button
        ref={ref}
        className={className}
        style={combinedStyle}
        disabled={disabled || loading}
        aria-disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading && (
          <span
            className="btn-spinner"
            style={{ color: 'currentColor' }}
            aria-hidden="true"
          />
        )}
        {!loading && icon && iconPosition === 'left' && <span className="btn-icon-left">{icon}</span>}
        <span className="btn-text">{children}</span>
        {!loading && icon && iconPosition === 'right' && <span className="btn-icon-right">{icon}</span>}
        <style jsx>{`
          button {
            ${css}
          }
          .btn-spinner {
            ${spinnerStyles}
          }
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `}</style>
      </button>
    );
  }
);

Button.displayName = 'Button';

// Compound components for icon buttons
export const IconButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, 'children' | 'iconPosition'> & { label: string }>(
  ({ label, icon, size = 'md', variant = 'ghost', ...props }, ref) => (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      aria-label={label}
      className="btn-icon-only"
      {...props}
    >
      <span aria-hidden="true">{icon}</span>
      <span className="sr-only">{label}</span>
    </Button>
  )
);

IconButton.displayName = 'IconButton';
