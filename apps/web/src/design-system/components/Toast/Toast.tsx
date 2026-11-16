/**
 * Toast Component
 * Accessible toast notifications with auto-dismiss, action buttons, and portal rendering
 */

'use client';

import { forwardRef, ReactNode, useRef, useState, useEffect, useCallback, createContext, useContext } from 'react';
import { useReducedMotion } from '../../hooks/useReducedMotion';

export type ToastType = 'default' | 'success' | 'warning' | 'error' | 'info';
export type ToastPosition = 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';

export interface ToastProps {
  id: string;
  type?: ToastType;
  title?: string;
  description?: string;
  action?: ReactNode;
  dismissible?: boolean;
  duration?: number; // 0 = no auto-dismiss
  onDismiss?: (id: string) => void;
  className?: string;
  style?: React.CSSProperties;
}

export interface ToastOptions {
  type?: ToastType;
  title?: string;
  description?: string;
  action?: ReactNode;
  dismissible?: boolean;
  duration?: number;
}

const baseStyles = `
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-3);
  padding: var(--spacing-component-toastPadding);
  background-color: var(--color-surface-primary);
  border: 1px solid var(--color-border-primary);
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08);
  min-width: 300px;
  max-width: 480px;
  pointer-events: auto;
`;

const typeStyles: Record<ToastType, string> = {
  default: 'border-left: 4px solid var(--color-brand-primary);',
  success: 'border-left: 4px solid var(--color-status-success);',
  warning: 'border-left: 4px solid var(--color-status-warning);',
  error: 'border-left: 4px solid var(--color-status-error);',
  info: 'border-left: 4px solid var(--color-status-info);',
};

const iconStyles = `
  display: flex;
  align-items: flex-start;
  justify-content: center;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  margin-top: 2px;
  color: var(--color-text-tertiary);
`;

const typeIconColors: Record<ToastType, string> = {
  default: 'var(--color-brand-primary)',
  success: 'var(--color-status-success)',
  warning: 'var(--color-status-warning)',
  error: 'var(--color-status-error)',
  info: 'var(--color-status-info)',
};

const contentStyles = `
  flex: 1;
  min-width: 0;
`;

const titleStyles = `
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-semibold);
  line-height: var(--line-height-normal);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-1);
`;

const descriptionStyles = `
  font-size: var(--font-size-sm);
  line-height: var(--line-height-normal);
  color: var(--color-text-secondary);
`;

const actionStyles = `
  margin-left: var(--spacing-4);
  padding-top: 2px;
`;

const closeButtonStyles = `
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: transparent;
  border: none;
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: var(--transition-component-button);
  margin-left: var(--spacing-2);
  &:hover {
    background-color: var(--color-interactive-hover);
    color: var(--color-text-primary);
  }
  &:focus-visible {
    outline: 2px solid var(--color-border-focus);
    outline-offset: 2px;
  }
`;

const animationStyles = `
  @keyframes toast-enter {
    from {
      opacity: 0;
      transform: translateX(100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  @keyframes toast-enter-left {
    from {
      opacity: 0;
      transform: translateX(-100%);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  @keyframes toast-enter-top {
    from {
      opacity: 0;
      transform: translateY(-100%);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  @keyframes toast-enter-bottom {
    from {
      opacity: 0;
      transform: translateY(100%);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  @keyframes toast-exit {
    from { opacity: 1; transform: translateX(0); }
    to { opacity: 0; transform: translateX(100%); }
  }
  @keyframes toast-exit-left {
    from { opacity: 1; transform: translateX(0); }
    to { opacity: 0; transform: translateX(-100%); }
  }
  @keyframes toast-exit-top {
    from { opacity: 1; transform: translateY(0); }
    to { opacity: 0; transform: translateY(-100%); }
  }
  @keyframes toast-exit-bottom {
    from { opacity: 1; transform: translateY(0); }
    to { opacity: 0; transform: translateY(100%); }
  }
`;

const positionStyles: Record<ToastPosition, { container: string; item: string }> = {
  'top-right': {
    container: 'top: var(--spacing-6); right: var(--spacing-6);',
    item: 'transform-origin: top right;',
  },
  'top-left': {
    container: 'top: var(--spacing-6); left: var(--spacing-6);',
    item: 'transform-origin: top left;',
  },
  'bottom-right': {
    container: 'bottom: var(--spacing-6); right: var(--spacing-6);',
    item: 'transform-origin: bottom right;',
  },
  'bottom-left': {
    container: 'bottom: var(--spacing-6); left: var(--spacing-6);',
    item: 'transform-origin: bottom left;',
  },
  'top-center': {
    container: 'top: var(--spacing-6); left: 50%; transform: translateX(-50%);',
    item: 'transform-origin: top center;',
  },
  'bottom-center': {
    container: 'bottom: var(--spacing-6); left: 50%; transform: translateX(-50%);',
    item: 'transform-origin: bottom center;',
  },
};

export const Toast = forwardRef<HTMLDivElement, ToastProps>(
  (
    {
      id,
      type = 'default',
      title,
      description,
      action,
      dismissible = true,
      duration = 5000,
      onDismiss,
      className = '',
      style,
    },
    ref
  ) => {
    const prefersReduced = useReducedMotion();
    const [exiting, setExiting] = useState(false);

    const dismiss = useCallback(() => {
      setExiting(true);
      setTimeout(() => {
        onDismiss?.(id);
      }, prefersReduced ? 0 : 200);
    }, [id, onDismiss, prefersReduced]);

    useEffect(() => {
      if (duration > 0 && !exiting) {
        const timer = setTimeout(() => {
          dismiss();
        }, duration);
        return () => clearTimeout(timer);
      }
    }, [duration, exiting, dismiss]);

    const enterAnimation = prefersReduced ? 'none' : `toast-enter 200ms cubic-bezier(0.4, 0, 0.2, 1)`;
    const exitAnimation = prefersReduced ? 'none' : `toast-exit 200ms cubic-bezier(0.4, 0, 0.2, 1)`;

    return (
      <div
        ref={ref}
        id={id}
        role="alert"
        aria-live="polite"
        aria-atomic="true"
        className={className}
        style={{
          ...baseStyles as React.CSSProperties,
          ...typeStyles[type] as React.CSSProperties,
          animation: exiting ? exitAnimation : enterAnimation,
          ...style,
        } as React.CSSProperties}
      >
        <div style={iconStyles as React.CSSProperties} aria-hidden="true">
          {type === 'success' && (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: typeIconColors.success }}>
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          )}
          {type === 'error' && (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: typeIconColors.error }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="15" y1="9" x2="9" y2="15" />
              <line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          )}
          {type === 'warning' && (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: typeIconColors.warning }}>
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
          )}
          {type === 'info' && (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: typeIconColors.info }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          )}
          {type === 'default' && (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: typeIconColors.default }}>
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          )}
        </div>

        <div style={contentStyles as React.CSSProperties}>
          {title && <div style={titleStyles as React.CSSProperties}>{title}</div>}
          {description && <div style={descriptionStyles as React.CSSProperties}>{description}</div>}
        </div>

        {action && <div style={actionStyles as React.CSSProperties}>{action}</div>}

        {dismissible && (
          <button
            type="button"
            onClick={dismiss}
            style={closeButtonStyles as React.CSSProperties}
            aria-label="Dismiss notification"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}

        <style jsx>{animationStyles}</style>
      </div>
    );
  }
);

Toast.displayName = 'Toast';

// Toast Container
interface ToastContainerProps {
  position?: ToastPosition;
  gap?: number;
  maxToasts?: number;
  className?: string;
}

const ToastContainerContext = createContext<{
  addToast: (options: ToastOptions) => string;
  dismissToast: (id: string) => void;
} | null>(null);

export const ToastProvider = ({ children, position = 'top-right', gap = 12, maxToasts = 5 }: ToastContainerProps & { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Array<ToastProps & { key: string }>>([]);
  const dismissToastRef = useRef<((id: string) => void) | null>(null);

  const dismissToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  useEffect(() => {
    dismissToastRef.current = dismissToast;
  }, [dismissToast]);

  const addToast = useCallback((options: ToastOptions) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const toast: ToastProps & { key: string } = {
      id,
      key: id,
      type: options.type || 'default',
      title: options.title,
      description: options.description,
      action: options.action,
      dismissible: options.dismissible ?? true,
      duration: options.duration ?? 5000,
      onDismiss: (toastId) => dismissToastRef.current?.(toastId),
      style: undefined,
    };

    setToasts(prev => {
      const next = [...prev, toast];
      if (next.length > maxToasts) {
        return next.slice(-maxToasts);
      }
      return next;
    });

    return id;
  }, [maxToasts]);

  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    zIndex: 'var(--z-index-toast)',
    display: 'flex',
    flexDirection: 'column',
    gap: `${gap}px`,
    pointerEvents: 'none',
    ...positionStyles[position].container as React.CSSProperties,
  };

  return (
    <ToastContainerContext.Provider value={{ addToast, dismissToast }}>
      {children}
      <div style={containerStyle} aria-live="polite" aria-atomic="true">
        {toasts.map(toast => {
          const { key, style, ...toastProps } = toast;
          return (
            <Toast
              key={key}
              {...toastProps}
              style={{
                ...style as React.CSSProperties,
                ...positionStyles[position].item as React.CSSProperties,
              }}
            />
          );
        })}
      </div>
    </ToastContainerContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContainerContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

// Hook for programmatic toast usage
export function useToastController() {
  const { addToast, dismissToast } = useToast();

  const toast = useCallback((options: ToastOptions) => addToast(options), [addToast]);
  const success = useCallback((title: string, description?: string, options?: Omit<ToastOptions, 'type' | 'title' | 'description'>) =>
    addToast({ ...options, type: 'success', title, description }), [addToast]);
  const error = useCallback((title: string, description?: string, options?: Omit<ToastOptions, 'type' | 'title' | 'description'>) =>
    addToast({ ...options, type: 'error', title, description }), [addToast]);
  const warning = useCallback((title: string, description?: string, options?: Omit<ToastOptions, 'type' | 'title' | 'description'>) =>
    addToast({ ...options, type: 'warning', title, description }), [addToast]);
  const info = useCallback((title: string, description?: string, options?: Omit<ToastOptions, 'type' | 'title' | 'description'>) =>
    addToast({ ...options, type: 'info', title, description }), [addToast]);

  return { toast, success, error, warning, info, dismiss: dismissToast };
}