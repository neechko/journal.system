/**
 * Tabs Component
 * Accessible tab interface with keyboard navigation, auto-activation, and animated indicator
 */

'use client';

import { forwardRef, ReactNode, useRef, useState, useEffect, useCallback } from 'react';
import { useReducedMotion, useTransition } from '../../hooks/useReducedMotion';

export type TabsVariant = 'default' | 'underline' | 'enclosed' | 'soft' | 'pills';
export type TabsOrientation = 'horizontal' | 'vertical';

export interface TabItem {
  id: string;
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  badge?: ReactNode;
  content: ReactNode;
}

export interface TabsProps {
  items: TabItem[];
  defaultTab?: string;
  controlledTab?: string;
  onTabChange?: (tabId: string) => void;
  variant?: TabsVariant;
  orientation?: TabsOrientation;
  fullWidth?: boolean;
  className?: string;
  listClassName?: string;
  triggerClassName?: string;
  panelClassName?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

const baseListStyles = `
  display: flex;
  gap: var(--spacing-1);
  border-bottom: none;
  padding: 0;
  margin: 0;
  list-style: none;
  role: tablist;
`;

const variantListStyles: Record<TabsVariant, string> = {
  default: `
    border-bottom: 1px solid var(--color-border-primary);
    padding-bottom: -1px;
    margin-bottom: -1px;
  `,
  underline: `
    border-bottom: 2px solid var(--color-border-primary);
    position: relative;
  `,
  enclosed: `
    background-color: var(--color-background-secondary);
    border-radius: 8px;
    padding: var(--spacing-1);
    border: 1px solid var(--color-border-primary);
  `,
  soft: `
    background-color: var(--color-background-secondary);
    border-radius: 8px;
    padding: var(--spacing-1);
  `,
  pills: `
    gap: var(--spacing-1);
  `,
};

const orientationStyles: Record<TabsOrientation, string> = {
  horizontal: '',
  vertical: `
    flex-direction: column;
    border-bottom: none;
    border-right: 1px solid var(--color-border-primary);
  `,
};

const baseTriggerStyles = `
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-2);
  font-family: inherit;
  font-size: var(--font-size-sm);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-normal);
  color: var(--color-text-secondary);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: var(--transition-component-tab);
  white-space: nowrap;
  outline: none;
  position: relative;
`;

const variantTriggerStyles: Record<TabsVariant, string> = {
  default: `
    padding: var(--spacing-3) var(--spacing-4);
    border-bottom: 2px solid transparent;
    margin-bottom: -1px;
    &:hover:not(:disabled) {
      color: var(--color-text-primary);
    }
    &[aria-selected="true"] {
      color: var(--color-brand-primary);
      border-bottom-color: var(--color-brand-primary);
    }
  `,
  underline: `
    padding: var(--spacing-3) var(--spacing-4);
    &:hover:not(:disabled) {
      color: var(--color-text-primary);
    }
    &[aria-selected="true"] {
      color: var(--color-brand-primary);
    }
  `,
  enclosed: `
    padding: var(--spacing-2) var(--spacing-4);
    border-radius: 6px;
    &:hover:not(:disabled) {
      background-color: var(--color-surface-primary);
      color: var(--color-text-primary);
    }
    &[aria-selected="true"] {
      background-color: var(--color-surface-primary);
      color: var(--color-brand-primary);
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    }
  `,
  soft: `
    padding: var(--spacing-2) var(--spacing-4);
    border-radius: 6px;
    &:hover:not(:disabled) {
      color: var(--color-text-primary);
    }
    &[aria-selected="true"] {
      color: var(--color-brand-primary);
      background-color: var(--color-brand-primary-light);
    }
  `,
  pills: `
    padding: var(--spacing-2) var(--spacing-4);
    border-radius: 9999px;
    &:hover:not(:disabled) {
      background-color: var(--color-background-tertiary);
      color: var(--color-text-primary);
    }
    &[aria-selected="true"] {
      background-color: var(--color-brand-primary);
      color: var(--color-text-inverse);
    }
  `,
};

const disabledTriggerStyles = `
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }
`;

const focusStyles = `
  &:focus-visible {
    outline: 2px solid var(--color-border-focus);
    outline-offset: -2px;
    border-radius: 4px;
  }
`;

const indicatorStyles = `
  position: absolute;
  bottom: -1px;
  left: 0;
  height: 2px;
  background-color: var(--color-brand-primary);
  border-radius: 2px 2px 0 0;
  transition: transform var(--duration-normal) var(--easing-spring-gentle), width var(--duration-normal) var(--easing-spring-gentle);
  pointer-events: none;
`;

const panelStyles = `
  padding: var(--spacing-4) 0;
  animation: panel-enter 200ms cubic-bezier(0.4, 0, 0.2, 1);
`;

const animationStyles = `
  @keyframes panel-enter {
    from { opacity: 0; transform: translateY(4px); }
    to { opacity: 1; transform: translateY(0); }
  }
`;

export const Tabs = forwardRef<HTMLDivElement, TabsProps>(
  (
    {
      items,
      defaultTab,
      controlledTab,
      onTabChange,
      variant = 'default',
      orientation = 'horizontal',
      fullWidth = false,
      className = '',
      listClassName = '',
      triggerClassName = '',
      panelClassName = '',
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledby,
    },
    ref
  ) => {
    const prefersReduced = useReducedMotion();
    const [uncontrolledTab, setUncontrolledTab] = useState(defaultTab || items[0]?.id || '');
    const [indicatorStyle, setIndicatorStyle] = useState<React.CSSProperties>({});
    const listRef = useRef<HTMLDivElement>(null);
    const triggerRefs = useRef<(HTMLButtonElement | null)[]>([]);

    const isControlled = controlledTab !== undefined;
    const activeTab = isControlled ? controlledTab : uncontrolledTab;

    const enterTransition = useTransition(
      `transform 200ms cubic-bezier(0.175, 0.885, 0.32, 1.275), width 200ms cubic-bezier(0.175, 0.885, 0.32, 1.275)`,
      'none'
    );

    const updateIndicator = useCallback(() => {
      if (!listRef.current || prefersReduced) return;

      const activeTrigger = triggerRefs.current.find(
        (trigger) => trigger?.dataset.tabId === activeTab
      );

      if (activeTrigger && listRef.current) {
        const listRect = listRef.current.getBoundingClientRect();
        const triggerRect = activeTrigger.getBoundingClientRect();

        setIndicatorStyle({
          width: `${triggerRect.width}px`,
          transform: `translateX(${triggerRect.left - listRect.left}px)`,
          opacity: 1,
        });
      } else {
        setIndicatorStyle({ opacity: 0 });
      }
    }, [activeTab, prefersReduced]);

    useEffect(() => {
      updateIndicator();
      const resizeObserver = new ResizeObserver(updateIndicator);
      if (listRef.current) resizeObserver.observe(listRef.current);
      return () => resizeObserver.disconnect();
    }, [updateIndicator]);

    useEffect(() => {
      updateIndicator();
    }, [activeTab, updateIndicator]);

    const handleTabClick = useCallback((tabId: string) => {
      const item = items.find(i => i.id === tabId);
      if (item?.disabled) return;

      if (!isControlled) setUncontrolledTab(tabId);
      onTabChange?.(tabId);
    }, [items, isControlled, onTabChange]);

    const handleKeyDown = useCallback((event: React.KeyboardEvent, tabId: string) => {
      const enabledItems = items.filter(item => !item.disabled);
      const currentIndex = enabledItems.findIndex(item => item.id === tabId);

      let nextIndex = currentIndex;

      if (orientation === 'horizontal') {
        if (event.key === 'ArrowRight') {
          nextIndex = (currentIndex + 1) % enabledItems.length;
        } else if (event.key === 'ArrowLeft') {
          nextIndex = (currentIndex - 1 + enabledItems.length) % enabledItems.length;
        } else if (event.key === 'Home') {
          nextIndex = 0;
        } else if (event.key === 'End') {
          nextIndex = enabledItems.length - 1;
        }
      } else {
        if (event.key === 'ArrowDown') {
          nextIndex = (currentIndex + 1) % enabledItems.length;
        } else if (event.key === 'ArrowUp') {
          nextIndex = (currentIndex - 1 + enabledItems.length) % enabledItems.length;
        } else if (event.key === 'Home') {
          nextIndex = 0;
        } else if (event.key === 'End') {
          nextIndex = enabledItems.length - 1;
        }
      }

      if (nextIndex !== currentIndex) {
        event.preventDefault();
        const nextTab = enabledItems[nextIndex];
        handleTabClick(nextTab.id);
        triggerRefs.current.find(t => t?.dataset.tabId === nextTab.id)?.focus();
      }
    }, [items, orientation, handleTabClick]);

    return (
      <div ref={ref} className={className} style={{ width: fullWidth ? '100%' : 'auto' }}>
        <div
          ref={listRef}
          role="tablist"
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledby}
          aria-orientation={orientation}
          className={listClassName}
          style={{
            ...baseListStyles as React.CSSProperties,
            ...variantListStyles[variant] as React.CSSProperties,
            ...orientationStyles[orientation] as React.CSSProperties,
          } as React.CSSProperties}
        >
          {variant === 'underline' && (
            <div
              style={{
                ...indicatorStyles as React.CSSProperties,
                ...indicatorStyle,
                transition: prefersReduced ? 'none' : enterTransition,
              }}
              aria-hidden="true"
            />
          )}

          {items.map((item, index) => (
            <button
              key={item.id}
              ref={(el) => { triggerRefs.current[index] = el; }}
              role="tab"
              id={`tab-${item.id}`}
              aria-selected={activeTab === item.id}
              aria-controls={`panel-${item.id}`}
              tabIndex={activeTab === item.id ? 0 : -1}
              disabled={item.disabled}
              data-tab-id={item.id}
              onClick={() => handleTabClick(item.id)}
              onKeyDown={(e) => handleKeyDown(e, item.id)}
              className={triggerClassName}
              style={{
                ...baseTriggerStyles as React.CSSProperties,
                ...variantTriggerStyles[variant] as React.CSSProperties,
                ...disabledTriggerStyles as React.CSSProperties,
                ...focusStyles as React.CSSProperties,
              } as React.CSSProperties}
            >
              {item.icon && <span aria-hidden="true">{item.icon}</span>}
              <span>{item.label}</span>
              {item.badge && <span style={{ marginLeft: 'var(--spacing-1)' }}>{item.badge}</span>}
            </button>
          ))}
        </div>

        <div role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`} tabIndex={0} className={panelClassName} style={panelStyles as React.CSSProperties}>
          {items.find(item => item.id === activeTab)?.content}
        </div>

        <style jsx>{animationStyles}</style>
      </div>
    );
  }
);

Tabs.displayName = 'Tabs';

// TabsList, TabTrigger, TabPanel for compound component pattern
export interface TabsListProps {
  children: ReactNode;
  variant?: TabsVariant;
  orientation?: TabsOrientation;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  className?: string;
}

export const TabsList = forwardRef<HTMLDivElement, TabsListProps>(
  ({ children, variant = 'default', orientation = 'horizontal', 'aria-label': ariaLabel, 'aria-labelledby': ariaLabelledby, className = '', ...props }, ref) => (
    <div
      ref={ref}
      role="tablist"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
      aria-orientation={orientation}
      className={className}
      style={{
        ...baseListStyles as React.CSSProperties,
        ...variantListStyles[variant] as React.CSSProperties,
        ...orientationStyles[orientation] as React.CSSProperties,
      } as React.CSSProperties}
      {...props}
    >
      {children}
      {variant === 'underline' && <div style={indicatorStyles as React.CSSProperties} aria-hidden="true" />}
    </div>
  )
);
TabsList.displayName = 'TabsList';

export interface TabTriggerProps {
  children: ReactNode;
  id: string;
  selected?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
  variant?: TabsVariant;
  icon?: ReactNode;
  badge?: ReactNode;
  className?: string;
}

export const TabTrigger = forwardRef<HTMLButtonElement, TabTriggerProps>(
  ({ children, id, selected = false, disabled = false, onSelect, variant = 'default', icon, badge, className = '', ...props }, ref) => (
    <button
      ref={ref}
      role="tab"
      id={`tab-${id}`}
      aria-selected={selected}
      aria-controls={`panel-${id}`}
      tabIndex={selected ? 0 : -1}
      disabled={disabled}
      data-tab-id={id}
      onClick={onSelect}
      className={className}
      style={{
        ...baseTriggerStyles as React.CSSProperties,
        ...variantTriggerStyles[variant] as React.CSSProperties,
        ...disabledTriggerStyles as React.CSSProperties,
        ...focusStyles as React.CSSProperties,
      } as React.CSSProperties}
      {...props}
    >
      {icon && <span aria-hidden="true">{icon}</span>}
      <span>{children}</span>
      {badge && <span style={{ marginLeft: 'var(--spacing-1)' }}>{badge}</span>}
    </button>
  )
);
TabTrigger.displayName = 'TabTrigger';

export interface TabPanelProps {
  children: ReactNode;
  id: string;
  selected?: boolean;
  className?: string;
}

export const TabPanel = forwardRef<HTMLDivElement, TabPanelProps>(
  ({ children, id, selected = false, className = '', ...props }, ref) => (
    <div
      ref={ref}
      role="tabpanel"
      id={`panel-${id}`}
      aria-labelledby={`tab-${id}`}
      tabIndex={0}
      hidden={!selected}
      className={className}
      style={{
        ...panelStyles as React.CSSProperties,
        display: selected ? 'block' : 'none',
      } as React.CSSProperties}
      {...props}
    >
      {selected && children}
    </div>
  )
);
TabPanel.displayName = 'TabPanel';