/**
 * Card Component
 * Flexible container with consistent styling
 */

'use client';

import { forwardRef, HTMLAttributes, ReactNode } from 'react';

export type CardVariant = 'default' | 'outlined' | 'elevated' | 'filled';
export type CardPadding = 'none' | 'sm' | 'md' | 'lg';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant;
  padding?: CardPadding;
  hoverable?: boolean;
  children: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  image?: ReactNode;
  imagePosition?: 'top' | 'bottom' | 'cover';
}

const variantStyles: Record<CardVariant, string> = {
  default: `
    background-color: var(--color-surface-primary);
    border: 1px solid var(--color-border-primary);
  `,
  outlined: `
    background-color: var(--color-surface-primary);
    border: 2px solid var(--color-border-primary);
  `,
  elevated: `
    background-color: var(--color-surface-primary);
    border: none;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04);
  `,
  filled: `
    background-color: var(--color-background-secondary);
    border: 1px solid var(--color-border-primary);
  `,
};

const paddingStyles: Record<CardPadding, string> = {
  none: 'padding: 0;',
  sm: 'padding: var(--spacing-component-cardPaddingSm);',
  md: 'padding: var(--spacing-component-cardPadding);',
  lg: 'padding: var(--spacing-8);',
};

const baseStyles = `
  border-radius: 12px;
  overflow: hidden;
`;

const hoverableStyles = `
  transition: var(--transition-component-card);
  &:hover {
    border-color: var(--color-border-secondary);
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
  }
`;

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      padding = 'md',
      hoverable = false,
      children,
      header,
      footer,
      image,
      imagePosition = 'top',
      className = '',
      style,
      ...props
    },
    ref
  ) => {
    const cardStyle: React.CSSProperties = {
      ...style,
    } as React.CSSProperties;

    const css = `
      ${baseStyles}
      ${variantStyles[variant]}
      ${paddingStyles[padding]}
      ${hoverable ? hoverableStyles : ''}
    `;

    return (
      <div ref={ref} className={className} style={cardStyle} {...props}>
        <style jsx>{`
          div {
            ${css}
          }
        `}</style>

        {image && imagePosition === 'top' && (
          <div className="card-image card-image-top">{image}</div>
        )}

        {header && (
          <div className="card-header" style={{ padding: '0 0 var(--spacing-4) 0', borderBottom: '1px solid var(--color-border-primary)', marginBottom: 'var(--spacing-4)' }}>
            {header}
          </div>
        )}

        <div className="card-content" style={{ padding: padding === 'none' ? '0' : undefined }}>
          {children}
        </div>

        {footer && (
          <div className="card-footer" style={{ padding: 'var(--spacing-4) 0 0 0', borderTop: '1px solid var(--color-border-primary)', marginTop: 'var(--spacing-4)' }}>
            {footer}
          </div>
        )}

        {image && imagePosition === 'bottom' && (
          <div className="card-image card-image-bottom">{image}</div>
        )}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Card sub-components
export const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = '', children, ...props }, ref) => (
    <div
      ref={ref}
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 'var(--spacing-4)',
        padding: 'var(--spacing-4) var(--spacing-4) 0',
        ...props.style,
      }}
      {...props}
    >
      {children}
    </div>
  )
);
CardHeader.displayName = 'CardHeader';

export const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className = '', children, ...props }, ref) => (
    <h3
      ref={ref}
      className={className}
      style={{
        fontSize: 'var(--font-size-xl)',
        fontWeight: 'var(--font-weight-semibold)',
        lineHeight: 'var(--line-height-tight)',
        margin: 0,
        ...props.style,
      }}
      {...props}
    >
      {children}
    </h3>
  )
);
CardTitle.displayName = 'CardTitle';

export const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className = '', children, ...props }, ref) => (
    <p
      ref={ref}
      className={className}
      style={{
        fontSize: 'var(--font-size-sm)',
        color: 'var(--color-text-secondary)',
        margin: 'var(--spacing-1) 0 0 0',
        ...props.style,
      }}
      {...props}
    >
      {children}
    </p>
  )
);
CardDescription.displayName = 'CardDescription';

export const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = '', children, ...props }, ref) => (
    <div
      ref={ref}
      className={className}
      style={{ ...props.style }}
      {...props}
    >
      {children}
    </div>
  )
);
CardContent.displayName = 'CardContent';

export const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className = '', children, ...props }, ref) => (
    <div
      ref={ref}
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        gap: 'var(--spacing-3)',
        padding: '0 var(--spacing-4) var(--spacing-4)',
        borderTop: '1px solid var(--color-border-primary)',
        marginTop: 'var(--spacing-4)',
        ...props.style,
      }}
      {...props}
    >
      {children}
    </div>
  )
);
CardFooter.displayName = 'CardFooter';

export const CardImage = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement> & { position?: 'top' | 'bottom' | 'cover' }>(
  ({ position = 'top', className = '', children, ...props }, ref) => (
    <div
      ref={ref}
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        ...(position === 'cover' ? { height: '100%', position: 'absolute', top: 0, left: 0, zIndex: 0 } : {}),
        ...props.style,
      }}
      {...props}
    >
      {children}
    </div>
  )
);
CardImage.displayName = 'CardImage';