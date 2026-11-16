/**
 * Modal Component
 * Accessible dialog with focus trapping, escape key handling, and portal rendering
 */

'use client';

import { forwardRef, ReactNode, useEffect, useRef, useCallback, Fragment, useId } from 'react';
import { createPortal } from 'react-dom';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export type ModalSize = 'sm' | 'md' | 'lg' | 'xl' | 'full';
export type ModalVariant = 'default' | 'alert' | 'confirmation' | 'form';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  size?: ModalSize;
  variant?: ModalVariant;
  showCloseButton?: boolean;
  closeOnOverlayClick?: boolean;
  closeOnEscape?: boolean;
  footer?: ReactNode;
  header?: ReactNode;
  className?: string;
  overlayClassName?: string;
  contentClassName?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  role?: 'dialog' | 'alertdialog';
  initialFocusRef?: React.RefObject<HTMLElement>;
  returnFocusRef?: React.RefObject<HTMLElement>;
  preventScroll?: boolean;
}

const sizeStyles: Record<ModalSize, string> = {
  sm: 'max-width: 400px;',
  md: 'max-width: 560px;',
  lg: 'max-width: 720px;',
  xl: 'max-width: 960px;',
  full: 'max-width: calc(100vw - var(--spacing-8)); width: calc(100vw - var(--spacing-8));',
};

const baseStyles = `
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: var(--color-surface-primary);
  border-radius: 12px;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.16), 0 8px 16px rgba(0, 0, 0, 0.08);
  z-index: var(--z-index-modal);
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const overlayStyles = `
  position: fixed;
  inset: 0;
  background-color: var(--color-overlay-modal);
  z-index: var(--z-index-modal-backdrop);
`;

const headerStyles = `
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-4);
  padding: var(--spacing-6) var(--spacing-6) var(--spacing-4);
  border-bottom: 1px solid var(--color-border-primary);
  flex-shrink: 0;
`;

const titleStyles = `
  font-size: var(--font-size-component-modalTitle);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-tight);
  color: var(--color-text-primary);
  margin: 0;
  flex: 1;
`;

const descriptionStyles = `
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
  color: var(--color-text-secondary);
  margin: var(--spacing-1) 0 0 0;
`;

const closeButtonStyles = `
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  background-color: transparent;
  border: none;
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: var(--transition-component-button);
  flex-shrink: 0;
  &:hover {
    background-color: var(--color-interactive-hover);
    color: var(--color-text-primary);
  }
  &:focus-visible {
    outline: 2px solid var(--color-border-focus);
    outline-offset: 2px;
  }
`;

const contentStyles = `
  padding: var(--spacing-6);
  overflow-y: auto;
  flex: 1;
  min-height: 0;
`;

const footerStyles = `
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--spacing-3);
  padding: var(--spacing-4) var(--spacing-6) var(--spacing-6);
  border-top: 1px solid var(--color-border-primary);
  flex-shrink: 0;
`;

const animationStyles = `
  @keyframes modal-enter {
    from {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
  }
  @keyframes modal-exit {
    from {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
    to {
      opacity: 0;
      transform: translate(-50%, -50%) scale(0.95);
    }
  }
  @keyframes overlay-enter {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes overlay-exit {
    from { opacity: 1; }
    to { opacity: 0; }
  }
`;

export const Modal = forwardRef<HTMLDivElement, ModalProps>((
  {
    isOpen,
    onClose,
    title,
    description,
    children,
    size = 'md',
    // variant = 'default', // Reserved for future use
    showCloseButton = true,
    closeOnOverlayClick = true,
    closeOnEscape = true,
    footer,
    header,
    className = '',
    overlayClassName = '',
    contentClassName = '',
    'aria-labelledby': ariaLabelledby,
    'aria-describedby': ariaDescribedby,
    role = 'dialog',
    initialFocusRef,
    returnFocusRef,
    preventScroll = true,
  },
  _forwardedRef // eslint-disable-line @typescript-eslint/no-unused-vars
) => {
  const prefersReduced = useReducedMotion();
  const contentRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const titleId = useId();
  const descriptionId = useId();

  const trapFocus = useCallback((event: KeyboardEvent) => {
    const modalContent = contentRef.current;
    if (!modalContent) return;

    const focusableElements = modalContent.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey) {
      if (document.activeElement === firstElement) {
        event.preventDefault();
        lastElement?.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        event.preventDefault();
        firstElement?.focus();
      }
    }
  }, []);

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isOpen) return;

    if (event.key === 'Escape' && closeOnEscape) {
      event.preventDefault();
      onClose();
      return;
    }

    if (event.key === 'Tab') {
      trapFocus(event);
    }
  }, [isOpen, closeOnEscape, onClose, trapFocus]);

  const handleOverlayClick = useCallback((event: React.MouseEvent) => {
    if (event.target === event.currentTarget && closeOnOverlayClick) {
      onClose();
    }
  }, [closeOnOverlayClick, onClose]);

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;

      // Focus management
      setTimeout(() => {
        if (initialFocusRef?.current) {
          initialFocusRef.current.focus();
        } else {
          const firstFocusable = contentRef.current?.querySelector<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          firstFocusable?.focus();
        }
      }, 0);

      // Prevent body scroll
      if (preventScroll) {
        document.body.style.overflow = 'hidden';
        document.body.style.paddingRight = `${window.innerWidth - document.body.clientWidth}px`;
      }

      // Add event listeners
      document.addEventListener('keydown', handleKeyDown);

      // Capture refs at effect run time to avoid stale values in cleanup
      const returnFocusEl = returnFocusRef?.current;
      const prevActiveEl = previousActiveElement.current;

      return () => {
        if (preventScroll) {
          document.body.style.overflow = '';
          document.body.style.paddingRight = '';
        }
        document.removeEventListener('keydown', handleKeyDown);

        // Return focus to trigger element - use captured values
        if (returnFocusEl) {
          returnFocusEl.focus();
        } else if (prevActiveEl) {
          prevActiveEl.focus();
        }
      };
    }
  }, [isOpen, handleKeyDown, preventScroll, initialFocusRef, returnFocusRef]);

  if (!isOpen) return null;

  const ariaLabelledBy = ariaLabelledby || (title ? titleId : undefined);
  const ariaDescribedBy = ariaDescribedby || (description ? descriptionId : undefined);

  const modalContent = (
    <div
      className={overlayClassName}
      style={{
        ...overlayStyles as React.CSSProperties,
        animation: prefersReduced ? 'none' : 'overlay-enter 200ms cubic-bezier(0.4, 0, 0.2, 1)',
      } as React.CSSProperties}
      onClick={handleOverlayClick}
      aria-hidden="true"
    >
      <div
        ref={contentRef}
        role={role}
        aria-modal="true"
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        className={className}
        style={{
          ...baseStyles as React.CSSProperties,
          ...sizeStyles[size] as React.CSSProperties,
          animation: prefersReduced ? 'none' : 'modal-enter 200ms cubic-bezier(0.4, 0, 0.2, 1)',
        } as React.CSSProperties}
      >
        {(title || header || showCloseButton) && (
          <header style={headerStyles as React.CSSProperties}>
            {header ? (
              header
            ) : (
              <div style={{ flex: 1 }}>
                {title && (
                  <h2
                    id={titleId}
                    style={titleStyles as React.CSSProperties}
                  >
                    {title}
                  </h2>
                )}
                {description && (
                  <p
                    id={descriptionId}
                    style={descriptionStyles as React.CSSProperties}
                  >
                    {description}
                  </p>
                )}
              </div>
            )}
            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                style={closeButtonStyles as React.CSSProperties}
                aria-label="Close modal"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            )}
          </header>
        )}

        <div
          className={contentClassName}
          style={contentStyles as React.CSSProperties}
        >
          {children}
        </div>

        {footer && (
          <footer style={footerStyles as React.CSSProperties}>
            {footer}
          </footer>
        )}
      </div>

      <style jsx>{animationStyles}</style>
    </div>
  );

  if (typeof window === 'undefined') return null;

  return createPortal(modalContent, document.body);
});

Modal.displayName = 'Modal';

// Compound components for common modal patterns
export interface ModalHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

export const ModalHeader = ({ title, description, children }: ModalHeaderProps) => (
  <Fragment>
    {children || (
      <>
        <h2 style={titleStyles as React.CSSProperties}>{title}</h2>
        {description && <p style={descriptionStyles as React.CSSProperties}>{description}</p>}
      </>
    )}
  </Fragment>
);

export interface ModalBodyProps {
  children: ReactNode;
}

export const ModalBody = ({ children }: ModalBodyProps) => (
  <div style={contentStyles as React.CSSProperties}>{children}</div>
);

export interface ModalFooterProps {
  children: ReactNode;
}

export const ModalFooter = ({ children }: ModalFooterProps) => (
  <footer style={footerStyles as React.CSSProperties}>{children}</footer>
);

export interface ModalCloseButtonProps {
  onClick: () => void;
  'aria-label'?: string;
}

export const ModalCloseButton = forwardRef<HTMLButtonElement, ModalCloseButtonProps>(
  ({ onClick, 'aria-label': ariaLabel = 'Close', ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      onClick={onClick}
      aria-label={ariaLabel}
      style={closeButtonStyles as React.CSSProperties}
      {...props}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </button>
  )
);
ModalCloseButton.displayName = 'ModalCloseButton';