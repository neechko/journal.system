/**
 * Dropdown Component
 * Accessible dropdown menu with keyboard navigation, focus management, and portal rendering
 */

/* eslint-disable react-hooks/refs */

'use client';

import { forwardRef, ReactNode, useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useReducedMotion, useTransition } from '../../hooks/useReducedMotion';

export type DropdownPlacement =
  | 'bottom-start'
  | 'bottom-end'
  | 'top-start'
  | 'top-end'
  | 'right-start'
  | 'right-end'
  | 'left-start'
  | 'left-end';

export interface DropdownItem {
  label: string;
  value?: string;
  icon?: ReactNode;
  disabled?: boolean;
  danger?: boolean;
  divider?: boolean;
  header?: boolean;
  onSelect?: () => void;
  children?: ReactNode; // For custom content
}

export interface DropdownTriggerRenderProps {
  open: boolean;
  onToggle: () => void;
  onOpen: () => void;
  onClose: (focusTrigger?: boolean) => void;
  disabled: boolean;
  children?: ReactNode;
}

export interface DropdownProps {
  trigger: ReactNode | ((props: DropdownTriggerRenderProps) => ReactNode);
  items: DropdownItem[];
  placement?: DropdownPlacement;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: boolean;
  closeOnSelect?: boolean;
  closeOnOutsideClick?: boolean;
  closeOnEscape?: boolean;
  offset?: number;
  flip?: boolean;
  className?: string;
  menuClassName?: string;
  itemClassName?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

const baseMenuStyles = `
  position: absolute;
  z-index: var(--z-index-dropdown);
  min-width: 200px;
  max-width: 360px;
  background-color: var(--color-surface-primary);
  border: 1px solid var(--color-border-primary);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12), 0 4px 8px rgba(0, 0, 0, 0.08);
  overflow: hidden;
  padding: var(--spacing-1);
`;

const itemStyles = `
  display: flex;
  align-items: center;
  gap: var(--spacing-2);
  width: 100%;
  padding: var(--spacing-component-dropdownItemPaddingY) var(--spacing-component-dropdownItemPaddingX);
  font-family: inherit;
  font-size: var(--font-size-component-dropdownItem);
  line-height: var(--line-height-normal);
  color: var(--color-text-primary);
  background: none;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  text-align: left;
  transition: background-color var(--duration-fast) var(--easing-ease-out), color var(--duration-fast) var(--easing-ease-out);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const itemHoverStyles = `
  &:hover:not(:disabled),
  &:focus:not(:disabled) {
    background-color: var(--color-interactive-hover);
    outline: none;
  }
`;

const itemDisabledStyles = `
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }
`;

const itemDangerStyles = `
  color: var(--color-status-error);
  &:hover:not(:disabled),
  &:focus:not(:disabled) {
    background-color: var(--color-status-error-light);
    color: var(--color-status-error);
  }
`;

const dividerStyles = `
  height: 1px;
  background-color: var(--color-border-primary);
  margin: var(--spacing-1) 0;
`;

const headerStyles = `
  padding: var(--spacing-2) var(--spacing-3);
  font-size: var(--font-size-xs);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-tertiary);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-wider);
`;

const iconStyles = `
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  flex-shrink: 0;
  color: var(--color-text-tertiary);
`;

const animationStyles = `
  @keyframes dropdown-enter {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  @keyframes dropdown-enter-bottom {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  @keyframes dropdown-enter-side {
    from {
      opacity: 0;
      transform: translateX(-8px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
  @keyframes dropdown-exit {
    from { opacity: 1; }
    to { opacity: 0; }
  }
`;

const placementStyles: Record<DropdownPlacement, string> = {
  'bottom-start': 'top: calc(100% + var(--spacing-1)); left: 0; transform-origin: top left;',
  'bottom-end': 'top: calc(100% + var(--spacing-1)); right: 0; transform-origin: top right;',
  'top-start': 'bottom: calc(100% + var(--spacing-1)); left: 0; transform-origin: bottom left;',
  'top-end': 'bottom: calc(100% + var(--spacing-1)); right: 0; transform-origin: bottom right;',
  'right-start': 'left: calc(100% + var(--spacing-1)); top: 0; transform-origin: left top;',
  'right-end': 'left: calc(100% + var(--spacing-1)); bottom: 0; transform-origin: left bottom;',
  'left-start': 'right: calc(100% + var(--spacing-1)); top: 0; transform-origin: right top;',
  'left-end': 'right: calc(100% + var(--spacing-1)); bottom: 0; transform-origin: right bottom;',
};

function getAnimationName(placement: DropdownPlacement): string {
  if (placement.startsWith('top')) return 'dropdown-enter';
  if (placement.startsWith('bottom')) return 'dropdown-enter-bottom';
  return 'dropdown-enter-side';
}

export const Dropdown = forwardRef<HTMLDivElement, DropdownProps>(
  (
    {
      trigger,
      items,
      placement = 'bottom-start',
      open: controlledOpen,
      onOpenChange,
      disabled = false,
      closeOnSelect = true,
      closeOnOutsideClick = true,
      closeOnEscape = true,
      // _offset = 4, // Reserved for future positioning logic
      // _flip = true, // Reserved for future flip logic
      className = '',
      menuClassName = '',
      itemClassName = '',
      'aria-label': ariaLabel,
      'aria-labelledby': ariaLabelledby,
    },
    ref
  ) => {
    const prefersReduced = useReducedMotion();
    const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [triggerRect, setTriggerRect] = useState<DOMRect | null>(null);
    const triggerRef = useRef<HTMLDivElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);
    const previousActiveElement = useRef<HTMLElement | null>(null);
    const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

    const isControlled = controlledOpen !== undefined;
    const isOpen = isControlled ? controlledOpen : uncontrolledOpen;

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const enterTransition = useTransition(
      `opacity 150ms cubic-bezier(0.4, 0, 0.2, 1), transform 150ms cubic-bezier(0.4, 0, 0.2, 1)`,
      'none'
    );

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
      if (!isControlled) setUncontrolledOpen(true);
      onOpenChange?.(true);
      previousActiveElement.current = document.activeElement as HTMLElement;
    }, [disabled, isControlled, onOpenChange]);

    const close = useCallback((focusTrigger = true) => {
      if (!isControlled) setUncontrolledOpen(false);
      onOpenChange?.(false);
      if (focusTrigger && previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    }, [isControlled, onOpenChange]);

    const toggle = useCallback(() => {
      if (isOpen) close();
      else open();
    }, [isOpen, open, close]);

    const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
      if (!isOpen) {
        if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
          event.preventDefault();
          open();
        }
        return;
      }

      const enabledIndices = items
        .map((item, index) => (!item.disabled && !item.divider && !item.header ? index : -1))
        .filter(index => index !== -1);

      const currentFocusIndex = itemRefs.current.findIndex(ref => ref === document.activeElement);

      switch (event.key) {
        case 'Escape':
          if (closeOnEscape) {
            event.preventDefault();
            close();
          }
          break;
        case 'Tab':
          event.preventDefault();
          close();
          break;
        case 'ArrowDown':
        case 'ArrowRight':
          event.preventDefault();
          if (currentFocusIndex < enabledIndices.length - 1) {
            itemRefs.current[enabledIndices[currentFocusIndex + 1]]?.focus();
          } else {
            itemRefs.current[enabledIndices[0]]?.focus();
          }
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          event.preventDefault();
          if (currentFocusIndex > 0) {
            itemRefs.current[enabledIndices[currentFocusIndex - 1]]?.focus();
          } else {
            itemRefs.current[enabledIndices[enabledIndices.length - 1]]?.focus();
          }
          break;
        case 'Home':
          event.preventDefault();
          itemRefs.current[enabledIndices[0]]?.focus();
          break;
        case 'End':
          event.preventDefault();
          itemRefs.current[enabledIndices[enabledIndices.length - 1]]?.focus();
          break;
        case 'Enter':
        case ' ':
          event.preventDefault();
          if (currentFocusIndex >= 0) {
            itemRefs.current[enabledIndices[currentFocusIndex]]?.click();
          }
          break;
      }
    }, [isOpen, items, closeOnEscape, close, open]);

    const handleOutsideClick = useCallback((event: MouseEvent) => {
      if (
        closeOnOutsideClick &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        close();
      }
    }, [closeOnOutsideClick, close]);

    const handleKeyDownNative = useCallback((event: KeyboardEvent) => {
      handleKeyDown(event as unknown as React.KeyboardEvent);
    }, [handleKeyDown]);

    useEffect(() => {
      if (isOpen) {
        document.addEventListener('mousedown', handleOutsideClick);
        document.addEventListener('keydown', handleKeyDownNative);
      }
      return () => {
        document.removeEventListener('mousedown', handleOutsideClick);
        document.removeEventListener('keydown', handleKeyDownNative);
      };
    }, [isOpen, handleOutsideClick, handleKeyDownNative]);

    const handleItemSelect = useCallback((item: DropdownItem) => {
      item.onSelect?.();
      if (closeOnSelect) close();
    }, [closeOnSelect, close]);

    // Handle trigger as either a node or a render prop function
    // Create trigger props object for render prop function
    const triggerProps = {
      open: isOpen,
      onToggle: toggle,
      onOpen: open,
      onClose: close,
      disabled,
    };

    const triggerElement: ReactNode = typeof trigger === 'function'
      ? trigger(triggerProps)
      : trigger;

    const menuContent = isOpen && items.length > 0 ? (
      <div
        ref={menuRef}
        role="menu"
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledby}
        className={menuClassName}
        style={{
          ...baseMenuStyles as React.CSSProperties,
          ...placementStyles[placement] as React.CSSProperties,
          animation: prefersReduced ? 'none' : `${getAnimationName(placement)} 150ms cubic-bezier(0.4, 0, 0.2, 1)`,
        } as React.CSSProperties}
      >
        {items.map((item, index) => {
          if (item.divider) {
            return <div key={index} role="separator" style={dividerStyles as React.CSSProperties} />;
          }
          if (item.header) {
            return <div key={index} role="heading" aria-level={4} style={headerStyles as React.CSSProperties}>{item.label}</div>;
          }
          return (
            <button
              key={index}
              ref={(el) => { itemRefs.current[index] = el; }}
              role="menuitem"
              tabIndex={-1}
              disabled={item.disabled}
              dangerouslySetInnerHTML={{ __html: '' }} // Prevent React warning about children
              style={{
                ...itemStyles as React.CSSProperties,
                ...itemHoverStyles as React.CSSProperties,
                ...itemDisabledStyles as React.CSSProperties,
                ...(item.danger ? itemDangerStyles : '') as React.CSSProperties,
              } as React.CSSProperties}
              className={itemClassName}
              onClick={() => handleItemSelect(item)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleItemSelect(item);
                }
              }}
            >
              {item.icon && <span style={iconStyles as React.CSSProperties} aria-hidden="true">{item.icon}</span>}
              <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
              {item.children}
            </button>
          );
        })}
        <style jsx>{animationStyles}</style>
      </div>
    ) : null;

    return (
      <div
        ref={ref}
        className={className}
        style={{
          display: 'inline-flex',
          position: 'relative',
        }}
        onKeyDown={handleKeyDown}
      >
        <div ref={triggerRef}>
          {triggerElement}
        </div>
        {typeof window !== 'undefined' && menuContent && createPortal(menuContent, document.body)}
      </div>
    );
  }
);

Dropdown.displayName = 'Dropdown';

// Trigger component for custom triggers
export interface DropdownTriggerProps {
  children: ReactNode;
  'aria-haspopup'?: 'menu' | 'listbox' | 'tree' | 'grid' | 'dialog';
  'aria-expanded'?: boolean;
}

export const DropdownTrigger = forwardRef<HTMLButtonElement, DropdownTriggerProps>(
  ({ children, 'aria-haspopup': ariaHasPopup = 'menu', 'aria-expanded': ariaExpanded = false, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      aria-haspopup={ariaHasPopup}
      aria-expanded={ariaExpanded}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 'var(--spacing-2)',
        background: 'none',
        border: 'none',
        padding: 0,
        font: 'inherit',
        color: 'inherit',
        cursor: 'pointer',
      }}
      {...props}
    >
      {children}
    </button>
  )
);
DropdownTrigger.displayName = 'DropdownTrigger';

// Dropdown Menu (for when you want to control positioning manually)
export interface DropdownMenuProps {
  children: ReactNode;
  className?: string;
}

export const DropdownMenu = ({ children, className = '' }: DropdownMenuProps) => (
  <div
    role="menu"
    className={className}
    style={{
      ...baseMenuStyles as React.CSSProperties,
      padding: 'var(--spacing-1)',
    }}
  >
    {children}
  </div>
);

// Dropdown Item
export interface DropdownItemComponentProps {
  label: string;
  icon?: ReactNode;
  disabled?: boolean;
  danger?: boolean;
  onSelect?: () => void;
  children?: ReactNode;
}

export const DropdownItem = forwardRef<HTMLButtonElement, DropdownItemComponentProps>(
  ({ label, icon, disabled = false, danger = false, onSelect, children, ...props }, ref) => (
    <button
      ref={ref}
      role="menuitem"
      tabIndex={-1}
      disabled={disabled}
      onClick={onSelect}
      style={{
        ...itemStyles as React.CSSProperties,
        ...itemHoverStyles as React.CSSProperties,
        ...itemDisabledStyles as React.CSSProperties,
        ...(danger ? itemDangerStyles : '') as React.CSSProperties,
      } as React.CSSProperties}
      {...props}
    >
      {icon && <span style={iconStyles as React.CSSProperties} aria-hidden="true">{icon}</span>}
      <span style={{ flex: 1, textAlign: 'left' }}>{label}</span>
      {children}
    </button>
  )
);
DropdownItem.displayName = 'DropdownItem';

// Dropdown Divider
export const DropdownDivider = () => (
  <div role="separator" style={dividerStyles as React.CSSProperties} />
);

// Dropdown Header
export interface DropdownHeaderProps {
  children: ReactNode;
  level?: number;
}

export const DropdownHeader = ({ children, level = 3 }: DropdownHeaderProps) => (
  <div role="heading" aria-level={level} style={headerStyles as React.CSSProperties}>
    {children}
  </div>
);