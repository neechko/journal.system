/**
 * Input Component
 * Accessible form input with validation states
 */

'use client';

import { forwardRef, InputHTMLAttributes, TextareaHTMLAttributes, SelectHTMLAttributes, ReactNode } from 'react';

export type InputSize = 'sm' | 'md' | 'lg';
export type InputType = 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search' | 'date' | 'datetime-local';

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: string;
  hint?: string;
  error?: string;
  success?: string;
  size?: InputSize;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  leftElement?: ReactNode;
  rightElement?: ReactNode;
  fullWidth?: boolean;
}

export interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'size'> {
  label?: string;
  hint?: string;
  error?: string;
  success?: string;
  size?: InputSize;
  fullWidth?: boolean;
  minRows?: number;
  maxRows?: number;
}

export interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'size'> {
  label?: string;
  hint?: string;
  error?: string;
  success?: string;
  size?: InputSize;
  options: { value: string; label: string; disabled?: boolean }[];
  placeholder?: string;
  fullWidth?: boolean;
}

// Props to exclude from spreading to the native input element
const inputPropKeys = new Set([
  'label', 'hint', 'error', 'success', 'size', 'leftIcon', 'rightIcon',
  'leftElement', 'rightElement', 'fullWidth', 'className', 'style'
]);

const sizeStyles: Record<InputSize, string> = {
  sm: `
    padding: 6px 10px;
    font-size: var(--font-size-component-inputSm);
    border-radius: 6px;
  `,
  md: `
    padding: var(--spacing-component-inputPaddingY) var(--spacing-component-inputPaddingX);
    font-size: var(--font-size-component-input);
    border-radius: 8px;
  `,
  lg: `
    padding: 12px 16px;
    font-size: var(--font-size-lg);
    border-radius: 10px;
  `,
};

const baseInputStyles = `
  display: block;
  width: 100%;
  font-family: inherit;
  line-height: var(--line-height-normal);
  color: var(--color-text-primary);
  background-color: var(--color-surface-primary);
  border: 1px solid var(--color-border-primary);
  transition: var(--transition-component-input);
  outline: none;
`;

const stateStyles = `
  &::placeholder {
    color: var(--color-text-tertiary);
  }

  &:hover:not(:disabled):not([aria-disabled="true"]) {
    border-color: var(--color-border-secondary);
  }

  &:focus {
    border-color: var(--color-border-focus);
    box-shadow: 0 0 0 3px var(--color-brand-primary-light);
  }

  &:disabled,
  &[aria-disabled="true"] {
    background-color: var(--color-interactive-disabled);
    color: var(--color-interactive-disabled-text);
    cursor: not-allowed;
    opacity: 0.6;
  }

  &[aria-invalid="true"] {
    border-color: var(--color-border-error);
  }

  &[aria-invalid="true"]:focus {
    box-shadow: 0 0 0 3px var(--color-status-error-light);
  }

  &[aria-invalid="false"]:valid:not(:placeholder-shown) {
    border-color: var(--color-border-success);
  }
`;

const labelStyles = `
  display: block;
  font-size: var(--font-size-component-label);
  font-weight: var(--font-weight-medium);
  line-height: var(--line-height-normal);
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-1);
`;

const hintStyles = `
  font-size: var(--font-size-component-caption);
  line-height: var(--line-height-normal);
  color: var(--color-text-secondary);
`;

const errorStyles = `
  font-size: var(--font-size-component-caption);
  line-height: var(--line-height-normal);
  color: var(--color-status-error);
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
`;

const successStyles = `
  font-size: var(--font-size-component-caption);
  line-height: var(--line-height-normal);
  color: var(--color-status-success);
  display: flex;
  align-items: center;
  gap: var(--spacing-1);
`;

const iconWrapperStyles = `
  position: absolute;
  display: flex;
  align-items: center;
  justify-content: center;
  top: 50%;
  transform: translateY(-50%);
  color: var(--color-text-tertiary);
  pointer-events: none;
`;

const leftIconStyles = `
  left: 12px;
`;

const rightIconStyles = `
  right: 12px;
`;

const inputWithIconStyles = `
  &[data-has-left-icon="true"] {
    padding-left: 40px;
  }
  &[data-has-right-icon="true"] {
    padding-right: 40px;
  }
`;

// Helper to filter out custom props
function filterInputProps(props: Record<string, unknown>): Record<string, unknown> {
  const filtered: Record<string, unknown> = {};
  for (const key of Object.keys(props)) {
    if (!inputPropKeys.has(key)) {
      filtered[key] = props[key];
    }
  }
  return filtered;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      hint,
      error,
      success,
      size = 'md',
      leftIcon,
      rightIcon,
      leftElement,
      rightElement,
      fullWidth = false,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2, 9)}`;
    const hintId = hint ? `${inputId}-hint` : undefined;
    const errorId = error ? `${inputId}-error` : undefined;
    const successId = success ? `${inputId}-success` : undefined;
    const describedBy = [hintId, errorId, successId].filter(Boolean).join(' ') || undefined;

    const wrapperStyle: React.CSSProperties = {
      width: fullWidth ? '100%' : 'auto',
    };

    const inputStyle: React.CSSProperties = {
      ...(sizeStyles[size] as React.CSSProperties),
    };

    const combinedInputStyle: React.CSSProperties = {
      ...props.style,
      ...inputStyle,
    } as React.CSSProperties;

    const css = `
      ${baseInputStyles}
      ${stateStyles}
      ${inputWithIconStyles}
    `;

    // Filter out custom props for the native input
    const nativeProps = filterInputProps(props) as InputHTMLAttributes<HTMLInputElement>;

    return (
      <div className={className} style={wrapperStyle}>
        {label && (
          <label htmlFor={inputId} style={labelStyles as React.CSSProperties}>
            {label}
            {nativeProps.required && <span style={{ color: 'var(--color-status-error)', marginLeft: '4px' }} aria-hidden="true">*</span>}
          </label>
        )}

        <div style={{ position: 'relative', display: 'flex', alignItems: 'stretch' }}>
          {leftElement && (
            <div style={{ ...iconWrapperStyles as React.CSSProperties, left: 0, padding: '0 var(--spacing-3)', backgroundColor: 'var(--color-background-secondary)', borderRight: '1px solid var(--color-border-primary)', borderTopLeftRadius: 'inherit', borderBottomLeftRadius: 'inherit' }}>
              {leftElement}
            </div>
          )}

          {leftIcon && (
            <span style={{ ...iconWrapperStyles as React.CSSProperties, ...leftIconStyles as React.CSSProperties }} aria-hidden="true">
              {leftIcon}
            </span>
          )}

          <input
            ref={ref}
            id={inputId}
            aria-describedby={describedBy}
            aria-invalid={error ? 'true' : success ? 'false' : undefined}
            aria-errormessage={errorId}
            className="ds-input"
            style={combinedInputStyle}
            data-has-left-icon={leftIcon || leftElement ? 'true' : 'false'}
            data-has-right-icon={rightIcon || rightElement ? 'true' : 'false'}
            {...nativeProps}
          />

          {rightIcon && (
            <span style={{ ...iconWrapperStyles as React.CSSProperties, ...rightIconStyles as React.CSSProperties }} aria-hidden="true">
              {rightIcon}
            </span>
          )}

          {rightElement && (
            <div style={{ ...iconWrapperStyles as React.CSSProperties, right: 0, padding: '0 var(--spacing-3)', backgroundColor: 'var(--color-background-secondary)', borderLeft: '1px solid var(--color-border-primary)', borderTopRightRadius: 'inherit', borderBottomRightRadius: 'inherit' }}>
              {rightElement}
            </div>
          )}
        </div>

        <style jsx>{`
          .ds-input {
            ${css}
          }
        `}</style>

        {error && (
          <p id={errorId} role="alert" style={errorStyles as React.CSSProperties}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </p>
        )}

        {success && !error && (
          <p id={successId} style={successStyles as React.CSSProperties}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            {success}
          </p>
        )}

        {hint && !error && !success && (
          <p id={hintId} style={hintStyles as React.CSSProperties}>{hint}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    {
      label,
      hint,
      error,
      success,
      size = 'md',
      fullWidth = false,
      minRows = 3,
      maxRows,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const textareaId = id || `textarea-${Math.random().toString(36).slice(2, 9)}`;
    const hintId = hint ? `${textareaId}-hint` : undefined;
    const errorId = error ? `${textareaId}-error` : undefined;
    const successId = success ? `${textareaId}-success` : undefined;
    const describedBy = [hintId, errorId, successId].filter(Boolean).join(' ') || undefined;

    const wrapperStyle: React.CSSProperties = {
      width: fullWidth ? '100%' : 'auto',
    };

    const textareaStyle: React.CSSProperties = {
      ...(sizeStyles[size] as React.CSSProperties),
      minHeight: `${minRows * 2.5}rem`,
      maxHeight: maxRows ? `${maxRows * 2.5}rem` : undefined,
      resize: 'vertical',
      fontFamily: 'inherit',
    };

    const combinedTextareaStyle: React.CSSProperties = {
      ...props.style,
      ...textareaStyle,
    } as React.CSSProperties;

    const css = `
      ${baseInputStyles}
      ${stateStyles}
      font-family: inherit;
      resize: vertical;
    `;

    // Filter out custom props for the native textarea
    const nativeProps = filterInputProps(props) as TextareaHTMLAttributes<HTMLTextAreaElement>;

    return (
      <div className={className} style={wrapperStyle}>
        {label && (
          <label htmlFor={textareaId} style={labelStyles as React.CSSProperties}>
            {label}
            {nativeProps.required && <span style={{ color: 'var(--color-status-error)', marginLeft: '4px' }} aria-hidden="true">*</span>}
          </label>
        )}

        <textarea
          ref={ref}
          id={textareaId}
          aria-describedby={describedBy}
          aria-invalid={error ? 'true' : success ? 'false' : undefined}
          aria-errormessage={errorId}
          className="ds-textarea"
          style={combinedTextareaStyle}
          {...nativeProps}
        />

        <style jsx>{`
          .ds-textarea {
            ${css}
          }
        `}</style>

        {error && (
          <p id={errorId} role="alert" style={errorStyles as React.CSSProperties}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </p>
        )}

        {success && !error && (
          <p id={successId} style={successStyles as React.CSSProperties}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            {success}
          </p>
        )}

        {hint && !error && !success && (
          <p id={hintId} style={hintStyles as React.CSSProperties}>{hint}</p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  (
    {
      label,
      hint,
      error,
      success,
      size = 'md',
      options,
      placeholder,
      fullWidth = false,
      className = '',
      id,
      ...props
    },
    ref
  ) => {
    const selectId = id || `select-${Math.random().toString(36).slice(2, 9)}`;
    const hintId = hint ? `${selectId}-hint` : undefined;
    const errorId = error ? `${selectId}-error` : undefined;
    const successId = success ? `${selectId}-success` : undefined;
    const describedBy = [hintId, errorId, successId].filter(Boolean).join(' ') || undefined;

    const wrapperStyle: React.CSSProperties = {
      width: fullWidth ? '100%' : 'auto',
    };

    const selectStyle: React.CSSProperties = {
      ...(sizeStyles[size] as React.CSSProperties),
      appearance: 'none',
      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23737373' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'right 12px center',
      paddingRight: '40px',
    };

    const combinedSelectStyle: React.CSSProperties = {
      ...props.style,
      ...selectStyle,
    } as React.CSSProperties;

    const css = `
      ${baseInputStyles}
      ${stateStyles}
      appearance: none;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%23737373' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 12px center;
      padding-right: 40px;
    `;

    // Filter out custom props for the native select
    const nativeProps = filterInputProps(props) as SelectHTMLAttributes<HTMLSelectElement>;

    return (
      <div className={className} style={wrapperStyle}>
        {label && (
          <label htmlFor={selectId} style={labelStyles as React.CSSProperties}>
            {label}
            {nativeProps.required && <span style={{ color: 'var(--color-status-error)', marginLeft: '4px' }} aria-hidden="true">*</span>}
          </label>
        )}

        <select
          ref={ref}
          id={selectId}
          aria-describedby={describedBy}
          aria-invalid={error ? 'true' : success ? 'false' : undefined}
          aria-errormessage={errorId}
          className="ds-select"
          style={combinedSelectStyle}
          {...nativeProps}
        >
          {placeholder && (
            <option value="" disabled selected hidden>{placeholder}</option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>

        <style jsx>{`
          .ds-select {
            ${css}
          }
        `}</style>

        {error && (
          <p id={errorId} role="alert" style={errorStyles as React.CSSProperties}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </p>
        )}

        {success && !error && (
          <p id={successId} style={successStyles as React.CSSProperties}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
            {success}
          </p>
        )}

        {hint && !error && !success && (
          <p id={hintId} style={hintStyles as React.CSSProperties}>{hint}</p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';