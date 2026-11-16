/**
 * Accordion Component
 * Accessible collapsible sections with keyboard navigation, animated height transitions, and multiple open support
 */

'use client';

import { forwardRef, ReactNode, useRef, useState, useEffect, useCallback, useMemo, createContext, useContext } from 'react';
import { useReducedMotion, useTransition } from '../../hooks/useReducedMotion';

export type AccordionVariant = 'default' | 'bordered' | 'divided' | 'flush';
export type AccordionType = 'single' | 'multiple';

export interface AccordionItem {
  id: string;
  title: string;
  content: ReactNode;
  disabled?: boolean;
  icon?: ReactNode;
  className?: string;
}

export interface AccordionProps {
  items: AccordionItem[];
  type?: AccordionType;
  defaultOpen?: string | string[];
  controlledOpen?: string | string[];
  onChange?: (openIds: string[]) => void;
  variant?: AccordionVariant;
  allowToggle?: boolean; // Allow closing open item in single mode
  className?: string;
  itemClassName?: string;
  triggerClassName?: string;
  contentClassName?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

const baseStyles = `
  display: flex;
  flex-direction: column;
  width: 100%;
`;

const variantStyles: Record<AccordionVariant, string> = {
  default: '',
  bordered: `
    border: 1px solid var(--color-border-primary);
    border-radius: 8px;
    overflow: hidden;
  `,
  divided: `
    > * + * {
      border-top: 1px solid var(--color-border-primary);
    }
  `,
  flush: `
    > * + * {
      border-top: 1px solid var(--color-border-primary);
    }
  `,
};

const itemStyles = `
  border: none;
  background: transparent;
`;

const triggerStyles = `
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--spacing-4);
  width: 100%;
  padding: var(--spacing-4) var(--spacing-4);
  font-family: inherit;
  font-size: var(--font-size-base);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-normal);
  color: var(--color-text-primary);
  background: transparent;
  border: none;
  text-align: left;
  cursor: pointer;
  transition: var(--transition-component-accordion);
  outline: none;
`;

const triggerHoverStyles = `
  &:hover:not(:disabled) {
    background-color: var(--color-background-secondary);
  }
`;

const triggerDisabledStyles = `
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }
`;

const triggerFocusStyles = `
  &:focus-visible {
    outline: 2px solid var(--color-border-focus);
    outline-offset: -2px;
  }
`;

const iconWrapperStyles = `
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  color: var(--color-text-tertiary);
  transition: transform var(--duration-normal) var(--easing-spring-gentle);
`;

const contentStyles = `
  overflow: hidden;
  transition: height var(--duration-normal) var(--easing-spring-gentle), opacity var(--duration-fast) var(--easing-ease-out);
`;

const contentInnerStyles = `
  padding: 0 var(--spacing-4) var(--spacing-4);
  color: var(--color-text-secondary);
  line-height: var(--line-height-relaxed);
`;

const animationStyles = `
  @keyframes accordion-enter {
    from { opacity: 0; transform: translateY(-4px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

export const Accordion = forwardRef<HTMLDivElement, AccordionProps>(
  (
    {
      items,
      type = 'single',
      defaultOpen,
      controlledOpen,
      onChange,
      variant = 'default',
      allowToggle = true,
      className = '',
      itemClassName = '',
      triggerClassName = '',
      contentClassName = '',
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledby,
    },
    ref
  ) => {
    const prefersReduced = useReducedMotion();
    const [uncontrolledOpen, setUncontrolledOpen] = useState<string[]>(() => {
      if (Array.isArray(defaultOpen)) return defaultOpen;
      if (defaultOpen) return [defaultOpen];
      if (type === 'single' && items.length > 0) return [items[0].id];
      return [];
    });
    const contentRefs = useRef<(HTMLDivElement | null)[]>([]);

    const isControlled = controlledOpen !== undefined;
    const openIds = useMemo(() => 
      isControlled
        ? (Array.isArray(controlledOpen) ? controlledOpen : controlledOpen ? [controlledOpen] : [])
        : uncontrolledOpen
    , [isControlled, controlledOpen, uncontrolledOpen]);

    const enterTransition = useTransition(
      `height 200ms cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 150ms cubic-bezier(0.4, 0, 0.2, 1)`,
      'none'
    );

    const isOpen = useCallback((id: string) => openIds.includes(id), [openIds]);

    const toggleItem = useCallback((id: string) => {
      const item = items.find(i => i.id === id);
      if (item?.disabled) return;

      let nextOpenIds: string[];
      if (type === 'single') {
        if (isOpen(id)) {
          if (allowToggle) {
            nextOpenIds = [];
          } else {
            return; // Don't allow closing in single mode without allowToggle
          }
        } else {
          nextOpenIds = [id];
        }
      } else {
        nextOpenIds = isOpen(id)
          ? openIds.filter(openId => openId !== id)
          : [...openIds, id];
      }

      if (!isControlled) setUncontrolledOpen(nextOpenIds);
      onChange?.(nextOpenIds);
    }, [items, type, isOpen, openIds, isControlled, allowToggle, onChange]);

    const handleKeyDown = useCallback((event: React.KeyboardEvent, id: string) => {
      const enabledItems = items.filter(item => !item.disabled);
      const currentIndex = enabledItems.findIndex(item => item.id === id);

      let nextIndex = currentIndex;

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        nextIndex = (currentIndex + 1) % enabledItems.length;
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        nextIndex = (currentIndex - 1 + enabledItems.length) % enabledItems.length;
      } else if (event.key === 'Home') {
        event.preventDefault();
        nextIndex = 0;
      } else if (event.key === 'End') {
        event.preventDefault();
        nextIndex = enabledItems.length - 1;
      } else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        toggleItem(id);
        return;
      }

      if (nextIndex !== currentIndex) {
        const nextItem = enabledItems[nextIndex];
        // Focus the next trigger using querySelector instead of getElementById
        const nextTrigger = document.querySelector(`[data-tab-id="${nextItem.id}"]`) as HTMLElement;
        nextTrigger?.focus();
      }
    }, [items, toggleItem]);

    return (
      <div
        ref={ref}
        role={type === 'single' ? undefined : 'region'}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        className={className}
        style={{
          ...baseStyles as React.CSSProperties,
          ...variantStyles[variant] as React.CSSProperties,
        } as React.CSSProperties}
      >
        {items.map((item, index) => {
          const open = isOpen(item.id);
          const contentId = `accordion-content-${item.id}`;
          const triggerId = `accordion-trigger-${item.id}`;

          return (
            <div
              key={item.id}
              className={itemClassName}
              style={itemStyles as React.CSSProperties}
            >
              <button
                id={triggerId}
                role={type === 'single' ? 'button' : 'heading'}
                aria-level={type === 'single' ? undefined : 3}
                aria-expanded={open}
                aria-controls={contentId}
                disabled={item.disabled}
                onClick={() => toggleItem(item.id)}
                onKeyDown={(e) => handleKeyDown(e, item.id)}
                className={triggerClassName}
                style={{
                  ...triggerStyles as React.CSSProperties,
                  ...triggerHoverStyles as React.CSSProperties,
                  ...triggerDisabledStyles as React.CSSProperties,
                  ...triggerFocusStyles as React.CSSProperties,
                } as React.CSSProperties}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', flex: 1 }}>
                  {item.icon && <span aria-hidden="true">{item.icon}</span>}
                  <span>{item.title}</span>
                </span>
                <span
                  style={{
                    ...iconWrapperStyles as React.CSSProperties,
                    transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
                    transition: prefersReduced ? 'none' : 'transform 200ms cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                  }}
                  aria-hidden="true"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="6 9 12 15 18 9" />
                  </svg>
                </span>
              </button>

              <div
                id={contentId}
                role={type === 'single' ? 'region' : undefined}
                aria-labelledby={triggerId}
                hidden={!open}
                ref={(el) => { contentRefs.current[index] = el; }}
                className={contentClassName}
                style={{
                  ...contentStyles as React.CSSProperties,
                  height: open ? 'auto' : 0,
                  opacity: open ? 1 : 0,
                  transition: prefersReduced ? 'none' : enterTransition,
                } as React.CSSProperties}
              >
                <div style={contentInnerStyles as React.CSSProperties}>
                  {item.content}
                </div>
              </div>
            </div>
          );
        })}

        <style jsx>{animationStyles}</style>
      </div>
    );
  }
);

Accordion.displayName = 'Accordion';

// Compound components for more flexible usage
interface AccordionContextValue {
  openIds: string[];
  type: AccordionType;
  allowToggle: boolean;
  onToggle: (id: string) => void;
  disabledIds: Set<string>;
  registerDisabled: (id: string, disabled: boolean) => void;
}

const AccordionContext = createContext<AccordionContextValue | null>(null);

export interface AccordionRootProps {
  type?: AccordionType;
  defaultOpen?: string | string[];
  controlledOpen?: string | string[];
  onChange?: (openIds: string[]) => void;
  allowToggle?: boolean;
  variant?: AccordionVariant;
  children: ReactNode;
  className?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

export const AccordionRoot = forwardRef<HTMLDivElement, AccordionRootProps>(
  (
    {
      type = 'single',
      defaultOpen,
      controlledOpen,
      onChange,
      allowToggle = true,
      variant = 'default',
      children,
      className = '',
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledby,
    },
    ref
  ) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const prefersReduced = useReducedMotion();
    const [uncontrolledOpen, setUncontrolledOpen] = useState<string[]>(() => {
      if (Array.isArray(defaultOpen)) return defaultOpen;
      if (defaultOpen) return [defaultOpen];
      return [];
    });
    const disabledIds = useRef<Set<string>>(new Set());

    const isControlled = controlledOpen !== undefined;
    const openIds = useMemo(() =>
      isControlled
        ? (Array.isArray(controlledOpen) ? controlledOpen : controlledOpen ? [controlledOpen] : [])
        : uncontrolledOpen
    , [isControlled, controlledOpen, uncontrolledOpen]);

    const registerDisabled = useCallback((id: string, disabled: boolean) => {
      if (disabled) {
        disabledIds.current.add(id);
      } else {
        disabledIds.current.delete(id);
      }
    }, []);

    const onToggle = useCallback((id: string) => {
      if (disabledIds.current.has(id)) return;

      let nextOpenIds: string[];
      if (type === 'single') {
        if (openIds.includes(id)) {
          if (allowToggle) {
            nextOpenIds = [];
          } else {
            return;
          }
        } else {
          nextOpenIds = [id];
        }
      } else {
        nextOpenIds = openIds.includes(id)
          ? openIds.filter(openId => openId !== id)
          : [...openIds, id];
      }

      if (!isControlled) setUncontrolledOpen(nextOpenIds);
      onChange?.(nextOpenIds);
    }, [type, openIds, allowToggle, isControlled, onChange]);

    const contextValue = useMemo(() => ({
      openIds,
      type,
      allowToggle,
      onToggle,
      disabledIds: disabledIds.current,
      registerDisabled,
    }), [openIds, type, allowToggle, onToggle, registerDisabled]);

    return (
      <AccordionContext.Provider value={contextValue}>
        <div
          ref={ref}
          role={type === 'single' ? undefined : 'region'}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledby}
          className={className}
          style={{
            ...baseStyles as React.CSSProperties,
            ...variantStyles[variant] as React.CSSProperties,
          } as React.CSSProperties}
        >
          {children}
        </div>
      </AccordionContext.Provider>
    );
  }
);
AccordionRoot.displayName = 'AccordionRoot';

export interface AccordionItemProps {
  id: string;
  disabled?: boolean;
  children: ReactNode | ((props: { open: boolean; disabled: boolean; triggerId: string; contentId: string }) => ReactNode);
  className?: string;
}

export const AccordionItem = forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ id, disabled = false, children, className = '' }, ref) => {
    const context = useContext(AccordionContext);
    if (!context) {
      throw new Error('AccordionItem must be used within AccordionRoot');
    }

    const open = context.openIds.includes(id);
    const contentId = `accordion-content-${id}`;
    const triggerId = `accordion-trigger-${id}`;

    useEffect(() => {
      context.registerDisabled(id, disabled);
      return () => context.registerDisabled(id, false);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, disabled]);

    const renderChildren = typeof children === 'function' ? children({ open, disabled, triggerId, contentId }) : children;

    return (
      <div ref={ref} className={className} style={itemStyles as React.CSSProperties}>
        {renderChildren}
      </div>
    );
  }
);
AccordionItem.displayName = 'AccordionItem';

export interface AccordionTriggerProps {
  id: string;
  children: ReactNode;
  className?: string;
}

export const AccordionTrigger = forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ id, children, className = '' }, ref) => {
    const context = useContext(AccordionContext);
    if (!context) {
      throw new Error('AccordionTrigger must be used within AccordionRoot');
    }

    const open = context.openIds.includes(id);
    const disabled = context.disabledIds.has(id);
    const contentId = `accordion-content-${id}`;

    const handleClick = () => {
      if (!disabled) context.onToggle(id);
    };

    const handleKeyDown = (event: React.KeyboardEvent) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        if (!disabled) context.onToggle(id);
      }
    };

    return (
      <button
        ref={ref}
        id={`accordion-trigger-${id}`}
        role="button"
        aria-expanded={open}
        aria-controls={contentId}
        disabled={disabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        className={className}
        style={{
          ...triggerStyles as React.CSSProperties,
          ...triggerHoverStyles as React.CSSProperties,
          ...triggerDisabledStyles as React.CSSProperties,
          ...triggerFocusStyles as React.CSSProperties,
        } as React.CSSProperties}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-3)', flex: 1 }}>
          {children}
        </span>
        <span
          style={{
            ...iconWrapperStyles as React.CSSProperties,
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 200ms cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          }}
          aria-hidden="true"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </span>
      </button>
    );
  }
);
AccordionTrigger.displayName = 'AccordionTrigger';

export interface AccordionContentProps {
  id: string;
  children: ReactNode;
  className?: string;
}

export const AccordionContent = forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ id, children, className = '' }, ref) => {
    const context = useContext(AccordionContext);
    if (!context) {
      throw new Error('AccordionContent must be used within AccordionRoot');
    }

    const open = context.openIds.includes(id);
    const triggerId = `accordion-trigger-${id}`;
    const prefersReduced = useReducedMotion();

    const contentRef = useRef<HTMLDivElement>(null);

    // Forward the ref
    useEffect(() => {
      if (ref && 'current' in ref) {
        (ref as React.MutableRefObject<HTMLDivElement | null>).current = contentRef.current;
      }
    }, [ref]);

    return (
      <div
        ref={contentRef}
        id={`accordion-content-${id}`}
        role="region"
        aria-labelledby={triggerId}
        hidden={!open}
        className={className}
        style={{
          ...contentStyles as React.CSSProperties,
          height: open ? 'auto' : 0,
          opacity: open ? 1 : 0,
          transition: prefersReduced ? 'none' : 'height 200ms cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 150ms cubic-bezier(0.4, 0, 0.2, 1)',
        } as React.CSSProperties}
      >
        <div style={contentInnerStyles as React.CSSProperties}>
          {children}
        </div>
      </div>
    );
  }
);
AccordionContent.displayName = 'AccordionContent';