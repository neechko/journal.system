/**
 * Tooltip Component
 * Accessible tooltip with portal rendering, position calculation, and delay handling
 */

'use client';

import { forwardRef, ReactNode, useRef, useState, useEffect, useCallback, Fragment, isValidElement } from 'react';
import { createPortal } from 'react-dom';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export type TooltipPlacement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end';

export interface TooltipProps {
  children: ReactNode;
  content: ReactNode;
  placement?: TooltipPlacement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  delayOpen?: number;
  delayClose?: number;
  offset?: number;
  flip?: boolean;
  className?: string;
  contentClassName?: string;
  arrow?: boolean;
  'aria-label'?: string;
}

const baseStyles = `
  position: absolute;
  z-index: var(--z-index-tooltip);
  padding: var(--spacing-component-tooltipPaddingY) var(--spacing-component-tooltipPaddingX);
  font-size: var(--font-size-component-tooltip);
  font-weight: var(--font-weight-normal);
  line-height: var(--line-height-normal);
  color: var(--color-text-inverse);
  background-color: var(--color-text-primary);
  border-radius: 6px;
  white-space: nowrap;
  pointer-events: none;
  max-width: 300px;
`;

const arrowStyles = `
  position: absolute;
  width: 8px;
  height: 8px;
  background-color: var(--color-text-primary);
  transform: rotate(45deg);
  pointer-events: none;
`;

const placementStyles: Record<TooltipPlacement, { position: string; arrowPosition: string }> = {
  top: {
    position: 'bottom: calc(100% + var(--spacing-1)); left: 50%; transform: translateX(-50%);',
    arrowPosition: 'bottom: -4px; left: 50%; transform: translateX(-50%);',
  },
  'top-start': {
    position: 'bottom: calc(100% + var(--spacing-1)); left: 0; transform: translateX(0);',
    arrowPosition: 'bottom: -4px; left: 16px;',
  },
  'top-end': {
    position: 'bottom: calc(100% + var(--spacing-1)); right: 0; transform: translateX(0);',
    arrowPosition: 'bottom: -4px; right: 16px;',
  },
  bottom: {
    position: 'top: calc(100% + var(--spacing-1)); left: 50%; transform: translateX(-50%);',
    arrowPosition: 'top: -4px; left: 50%; transform: translateX(-50%);',
  },
  'bottom-start': {
    position: 'top: calc(100% + var(--spacing-1)); left: 0; transform: translateX(0);',
    arrowPosition: 'top: -4px; left: 16px;',
  },
  'bottom-end': {
    position: 'top: calc(100% + var(--spacing-1)); right: 0; transform: translateX(0);',
    arrowPosition: 'top: -4px; right: 16px;',
  },
  left: {
    position: 'right: calc(100% + var(--spacing-1)); top: 50%; transform: translateY(-50%);',
    arrowPosition: 'right: -4px; top: 50%; transform: translateY(-50%);',
  },
  'left-start': {
    position: 'right: calc(100% + var(--spacing-1)); top: 0; transform: translateY(0);',
    arrowPosition: 'right: -4px; top: 16px;',
  },
  'left-end': {
    position: 'right: calc(100% + var(--spacing-1)); bottom: 0; transform: translateY(0);',
    arrowPosition: 'right: -4px; bottom: 16px;',
  },
  right: {
    position: 'left: calc(100% + var(--spacing-1)); top: 50%; transform: translateY(-50%);',
    arrowPosition: 'left: -4px; top: 50%; transform: translateY(-50%);',
  },
  'right-start': {
    position: 'left: calc(100% + var(--spacing-1)); top: 0; transform: translateY(0);',
    arrowPosition: 'left: -4px; top: 16px;',
  },
  'right-end': {
    position: 'left: calc(100% + var(--spacing-1)); bottom: 0; transform: translateY(0);',
    arrowPosition: 'left: -4px; bottom: 16px;',
  },
};

const animationStyles = `
  @keyframes tooltip-enter {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes tooltip-enter-top {
    from { opacity: 0; transform: translateY(-4px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes tooltip-enter-side {
    from { opacity: 0; transform: translateX(-4px); }
    to { opacity: 1; transform: translateX(0); }
  }
  @keyframes tooltip-exit {
    from { opacity: 1; }
    to { opacity: 0; }
  }
`;

function getAnimationName(placement: TooltipPlacement): string {
  if (placement.startsWith('top')) return 'tooltip-enter-top';
  if (placement.startsWith('bottom')) return 'tooltip-enter';
  return 'tooltip-enter-side';
}

export const Tooltip = forwardRef<HTMLDivElement, TooltipProps>(
  (
    {
      children,
      content,
      placement = 'top',
      open: controlledOpen,
      onOpenChange,
      disabled = false,
      delayOpen = 200,
      delayClose = 100,
      // _offset = 8, // Reserved for future positioning logic
      // _flip = true, // Reserved for future flip logic
      className = '',
      contentClassName = '',
      arrow = true,
      'aria-label': ariaLabel,
    },
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    ref
  ) => {
    const prefersReduced = useReducedMotion();
    const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);
    const triggerRef = useRef<HTMLDivElement>(null);
    const tooltipRef = useRef<HTMLDivElement>(null);
    const openTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const closeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const isControlled = controlledOpen !== undefined;
    const isOpen = isControlled ? controlledOpen : uncontrolledOpen;

    const updateTriggerRect = useCallback(() => {
      if (triggerRef.current) {
        setTriggerRect(triggerRef.current.getBoundingClientRect());
      }
    }, []);

    useEffect(() => {
      updateTriggerRect();
      window.addEventListener('resize', updateTriggerRect);
      window.addEventListener('scroll', updateTriggerRect, true);
      return () => {
        window.removeEventListener('resize', updateTriggerRect);
        window.removeEventListener('scroll', updateTriggerRect, true);
      };
    }, [updateTriggerRect]);

    const open = useCallback(() => {
      if (disabled) return;
      if (closeTimeoutRef.current) {
        clearTimeout(closeTimeoutRef.current);
        closeTimeoutRef.current = null;
      }
      if (!openTimeoutRef.current) {
        openTimeoutRef.current = setTimeout(() => {
          if (!isControlled) setUncontrolledOpen(true);
          onOpenChange?.(true);
          openTimeoutRef.current = null;
        }, delayOpen);
      }
    }, [disabled, isControlled, onOpenChange, delayOpen]);

    const close = useCallback(() => {
      if (openTimeoutRef.current) {
        clearTimeout(openTimeoutRef.current);
        openTimeoutRef.current = null;
      }
      if (!closeTimeoutRef.current) {
        closeTimeoutRef.current = setTimeout(() => {
          if (!isControlled) setUncontrolledOpen(false);
          onOpenChange?.(false);
          closeTimeoutRef.current = null;
        }, delayClose);
      }
    }, [isControlled, onOpenChange, delayClose]);

    const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        close();
      }
    }, [isOpen, close]);

    const handleFocus = useCallback(() => open(), [open]);
    const handleBlur = useCallback(() => close(), [close]);
    const handleMouseEnter = useCallback(() => open(), [open]);
    const handleMouseLeave = useCallback(() => close(), [close]);

    // Touch support
    const handleTouchStart = useCallback(() => open(), [open]);
    const handleTouchEnd = useCallback((e: React.TouchEvent) => {
      e.preventDefault();
      close();
    }, [close]);

    // Only accept a single child element
    if (!isValidElement(children)) {
      throw new Error('Tooltip only accepts a single child element');
    }

    // Wrap the child in a div with event handlers instead of using cloneElement
    // This avoids the ref lint warning
    const enhancedChild = (
      <div
        ref={triggerRef}
        onFocus={handleFocus}
        onBlur={handleBlur}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onKeyDown={handleKeyDown}
        aria-describedby={isOpen ? 'tooltip-content' : undefined}
        style={{ display: 'inline-flex' }}
      >
        {children}
      </div>
    );

    const tooltipContent = isOpen && content ? (
      <div
        ref={tooltipRef}
        id="tooltip-content"
        role="tooltip"
        aria-label={ariaLabel}
        className={contentClassName}
        style={{
          ...baseStyles as React.CSSProperties,
          ...placementStyles[placement].position as React.CSSProperties,
          animation: prefersReduced ? 'none' : `${getAnimationName(placement)} 150ms cubic-bezier(0.4, 0, 0.2, 1)`,
        } as React.CSSProperties}
      >
        {content}
        {arrow && (
          <div
            style={{
              ...arrowStyles as React.CSSProperties,
              ...placementStyles[placement].arrowPosition as React.CSSProperties,
            }}
            aria-hidden="true"
          />
        )}
        <style jsx>{animationStyles}</style>
      </div>
    ) : null;

    return (
      <Fragment>
        <div
          className={className}
          style={{
            display: 'inline-flex',
            position: 'relative',
          }}
        >
          {enhancedChild}
        </div>
        {typeof window !== 'undefined' && tooltipContent && createPortal(tooltipContent, document.body)}
      </Fragment>
    );
  }
);

Tooltip.displayName = 'Tooltip';

// Tooltip trigger wrapper for convenience
export interface TooltipTriggerProps {
  children: ReactNode;
  'aria-label'?: string;
}

export const TooltipTrigger = ({ children, 'aria-label': ariaLabel }: TooltipTriggerProps) => (
  <span
    style={{
      display: 'inline-flex',
      borderBottom: '1px dotted var(--color-text-tertiary)',
      cursor: 'help',
    }}
    aria-label={ariaLabel}
  >
    {children}
  </span>
);

// Tooltip with rich content
export interface TooltipContentProps {
  title?: string;
  description?: string;
  children?: ReactNode;
  action?: ReactNode;
}

export const TooltipContent = ({ title, description, children, action }: TooltipContentProps) => (
  <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-1)' }}>
    {title && (
      <div style={{ fontWeight: 'var(--font-weight-semibold)', fontSize: 'var(--font-size-sm)' }}>
        {title}
      </div>
    )}
    {description && (
      <div style={{ fontSize: 'var(--font-size-component-tooltip)', opacity: 0.9 }}>
        {description}
      </div>
    )}
    {children && (
      <div style={{ fontSize: 'var(--font-size-component-tooltip)' }}>
        {children}
      </div>
    )}
    {action && (
      <div style={{ marginTop: 'var(--spacing-2)', paddingTop: 'var(--spacing-2)', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
        {action}
      </div>
    )}
  </div>
);