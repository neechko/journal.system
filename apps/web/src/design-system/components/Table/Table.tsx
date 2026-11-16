/**
 * Table Component
 * Accessible, responsive data table with sorting, selection, and pagination support
 */

'use client';

import { forwardRef, HTMLAttributes, ReactNode, useState, useMemo, useRef, useEffect } from 'react';

export type TableVariant = 'default' | 'striped' | 'bordered' | 'compact';
export type TableSize = 'sm' | 'md' | 'lg';
export type SortDirection = 'asc' | 'desc' | null;

export interface Column<T = unknown> {
  key: string;
  header: string;
  accessor?: (row: T) => ReactNode;
  cell?: (row: T) => ReactNode;
  sortable?: boolean;
  width?: string;
  minWidth?: string;
  maxWidth?: string;
  align?: 'left' | 'center' | 'right';
  headerClassName?: string;
  cellClassName?: string;
}

export interface TableProps<T = unknown> extends HTMLAttributes<HTMLTableElement> {
  columns: Column<T>[];
  data: T[];
  variant?: TableVariant;
  size?: TableSize;
  hoverable?: boolean;
  selectable?: boolean;
  selectedRows?: Set<string | number>;
  onRowSelect?: (rowId: string | number, selected: boolean) => void;
  onSelectAll?: (selected: boolean) => void;
  rowKey: (row: T) => string | number;
  sortColumn?: string;
  sortDirection?: SortDirection;
  onSort?: (column: string, direction: SortDirection) => void;
  loading?: boolean;
  emptyMessage?: string;
  caption?: string;
  stickyHeader?: boolean;
  responsive?: boolean;
}

const sizeStyles: Record<TableSize, string> = {
  sm: `
    --table-cell-padding-y: var(--spacing-component-tableCellPaddingYSm);
    --table-cell-padding-x: var(--spacing-component-tableCellPaddingXSm);
    --table-font-size: var(--font-size-component-tableCellSm);
  `,
  md: `
    --table-cell-padding-y: var(--spacing-component-tableCellPaddingY);
    --table-cell-padding-x: var(--spacing-component-tableCellPaddingX);
    --table-font-size: var(--font-size-component-tableCell);
  `,
  lg: `
    --table-cell-padding-y: var(--spacing-3);
    --table-cell-padding-x: var(--spacing-4);
    --table-font-size: var(--font-size-base);
  `,
};

const variantStyles: Record<TableVariant, string> = {
  default: '',
  striped: `
    & tbody tr:nth-child(even) {
      background-color: var(--color-background-secondary);
    }
  `,
  bordered: `
    border: 1px solid var(--color-border-primary);
    & th,
    & td {
      border: 1px solid var(--color-border-primary);
    }
  `,
  compact: `
    --table-cell-padding-y: var(--spacing-1);
    --table-cell-padding-x: var(--spacing-2);
  `,
};

const baseStyles = `
  width: 100%;
  border-collapse: collapse;
  font-size: var(--table-font-size);
  font-family: var(--font-family-inter);
  color: var(--color-text-primary);
  background-color: var(--color-surface-primary);
`;

const headerStyles = `
  background-color: var(--color-background-secondary);
  border-bottom: 2px solid var(--color-border-primary);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-secondary);
  font-size: var(--font-size-component-tableHeader);
  text-transform: uppercase;
  letter-spacing: var(--letter-spacing-wide);
  white-space: nowrap;
`;

const cellStyles = `
  padding: var(--table-cell-padding-y) var(--table-cell-padding-x);
  border-bottom: 1px solid var(--color-border-primary);
  vertical-align: middle;
`;

const hoverStyles = `
  tbody tr:hover {
    background-color: var(--color-background-secondary);
  }
`;

const selectedStyles = `
  tbody tr[data-selected="true"] {
    background-color: var(--color-brand-primary-light);
  }
  tbody tr[data-selected="true"]:hover {
    background-color: var(--color-brand-primary-light);
  }
`;

const sortableStyles = `
  .table-sortable-header {
    cursor: pointer;
    user-select: none;
    transition: color var(--duration-fast) var(--easing-ease-out);
  }
  .table-sortable-header:hover {
    color: var(--color-text-primary);
  }
  .table-sortable-header[aria-sort="ascending"] .sort-icon::after {
    content: '▲';
  }
  .table-sortable-header[aria-sort="descending"] .sort-icon::after {
    content: '▼';
  }
  .table-sortable-header:not([aria-sort]) .sort-icon::after {
    content: '⇅';
    opacity: 0.3;
  }
  .sort-icon {
    display: inline-flex;
    margin-left: var(--spacing-1);
    width: 16px;
    text-align: center;
  }
`;

const loadingStyles = `
  .table-loading-overlay {
    position: absolute;
    inset: 0;
    background-color: rgba(255, 255, 255, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10;
  }
  @media (prefers-color-scheme: dark) {
    .table-loading-overlay {
      background-color: rgba(23, 23, 23, 0.8);
    }
  }
  .table-loading-spinner {
    width: 24px;
    height: 24px;
    border: 2px solid var(--color-border-primary);
    border-top-color: var(--color-brand-primary);
    border-radius: 50%;
    animation: spin 0.6s linear infinite;
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const responsiveWrapperStyles = `
  .table-responsive-wrapper {
    width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }
  .table-responsive-wrapper table {
    min-width: 600px;
  }
`;

// Use a wrapper component to properly handle generics
function TableInner<T>({
  columns,
  data,
  variant = 'default',
  size = 'md',
  hoverable = true,
  selectable = false,
  selectedRows = new Set(),
  onRowSelect,
  onSelectAll,
  rowKey,
  sortColumn,
  sortDirection = null,
  onSort,
  loading = false,
  emptyMessage = 'No data available',
  caption,
  stickyHeader = false,
  responsive = true,
  className = '',
  style,
  forwardedRef,
  ...props
}: TableProps<T> & { forwardedRef?: React.Ref<HTMLTableElement> }) {
  const [selectAll, setSelectAll] = useState(false);
  const selectAllCheckboxRef = useRef<HTMLInputElement>(null);

  const sortedData = useMemo(() => {
    if (!sortColumn || !sortDirection || !onSort) return data;
    return [...data].sort((a, b) => {
      const column = columns.find(c => c.key === sortColumn);
      if (!column || !column.accessor) return 0;
      const aVal = column.accessor(a);
      const bVal = column.accessor(b);
      const aStr = String(aVal).toLowerCase();
      const bStr = String(bVal).toLowerCase();
      const result = aStr.localeCompare(bStr);
      return sortDirection === 'asc' ? result : -result;
    });
  }, [data, sortColumn, sortDirection, columns, onSort]);

  const handleSort = (columnKey: string) => {
    if (!onSort) return;
    const column = columns.find(c => c.key === columnKey);
    if (!column?.sortable) return;

    let newDirection: SortDirection = 'asc';
    if (sortColumn === columnKey) {
      newDirection = sortDirection === 'asc' ? 'desc' : 'asc';
    }
    onSort(columnKey, newDirection);
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    onSelectAll?.(checked);
    if (checked) {
      sortedData.forEach(row => onRowSelect?.(rowKey(row), true));
    } else {
      sortedData.forEach(row => onRowSelect?.(rowKey(row), false));
    }
  };

  // Handle indeterminate state for select all checkbox
  useEffect(() => {
    if (selectAllCheckboxRef.current) {
      selectAllCheckboxRef.current.indeterminate = sortedData.length > 0 &&
        sortedData.some(row => selectedRows.has(rowKey(row))) &&
        !sortedData.every(row => selectedRows.has(rowKey(row)));
    }
  }, [selectedRows, sortedData, rowKey, selectAll]);

  const isRowSelected = (rowId: string | number) => selectedRows.has(rowId);
  const allSelected = sortedData.length > 0 && sortedData.every(row => selectedRows.has(rowKey(row)));
  const someSelected = sortedData.some(row => selectedRows.has(rowKey(row)));

  const css = `
    ${baseStyles}
    ${sizeStyles[size]}
    ${variantStyles[variant]}
    ${stickyHeader ? 'thead th { position: sticky; top: 0; z-index: 1; }' : ''}
    ${hoverable ? hoverStyles : ''}
    ${selectable ? selectedStyles : ''}
    ${sortableStyles}
    ${loadingStyles}
    ${responsiveWrapperStyles}
    thead th { ${headerStyles} }
    tbody td { ${cellStyles} }
  `;

  const tableStyle: React.CSSProperties = {
    ...style,
  } as React.CSSProperties;

  const renderCell = (row: T, column: Column<T>) => {
    if (column.cell) return column.cell(row);
    if (column.accessor) return String(column.accessor(row));
    return '';
  };

  const renderHeaderCell = (column: Column<T>) => {
    const isSortable = column.sortable && onSort;
    const isSorted = sortColumn === column.key;
    const currentSort = isSorted ? sortDirection : null;

    return (
      <th
        scope="col"
        style={{
          textAlign: column.align || 'left',
          width: column.width,
          minWidth: column.minWidth,
          maxWidth: column.maxWidth,
        } as React.CSSProperties}
        className={column.headerClassName}
        aria-sort={currentSort === 'asc' ? 'ascending' : currentSort === 'desc' ? 'descending' : isSortable ? 'none' : undefined}
      >
        {isSortable ? (
          <button
            type="button"
            className="table-sortable-header"
            onClick={() => handleSort(column.key)}
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              font: 'inherit',
              color: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--spacing-1)',
              cursor: 'pointer',
            }}
          >
            {column.header}
            <span className="sort-icon" aria-hidden="true" />
          </button>
        ) : (
          column.header
        )}
      </th>
    );
  };

  const content = (
    <>
      {caption && <caption style={{ padding: 'var(--spacing-3)', captionSide: 'bottom', color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>{caption}</caption>}
      <thead>
        <tr>
          {selectable && (
            <th scope="col" style={{ width: '48px', textAlign: 'center' as const }}>
              <input
                ref={selectAllCheckboxRef}
                type="checkbox"
                checked={allSelected}
                onChange={(e) => handleSelectAll(e.target.checked)}
                aria-label={allSelected ? 'Deselect all rows' : someSelected ? 'Select all rows' : 'Select all rows'}
                style={{
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer',
                  accentColor: 'var(--color-brand-primary)',
                }}
              />
            </th>
          )}
          {columns.map(column => (
            <th key={column.key}>{renderHeaderCell(column)}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {sortedData.length === 0 ? (
          <tr>
            <td colSpan={columns.length + (selectable ? 1 : 0)} style={{ textAlign: 'center', padding: 'var(--spacing-8)', color: 'var(--color-text-tertiary)' }}>
              {emptyMessage}
            </td>
          </tr>
        ) : (
          sortedData.map((row, rowIndex) => {
            const rowId = rowKey(row);
            const selected = isRowSelected(rowId);

            return (
              <tr
                key={rowId}
                data-selected={selected}
                style={{
                  cursor: selectable || onRowSelect ? 'pointer' : 'default',
                }}
                onClick={(e) => {
                  if (selectable && onRowSelect && !((e.target as HTMLElement).tagName === 'INPUT')) {
                    onRowSelect(rowId, !selected);
                  }
                }}
              >
                {selectable && (
                  <td style={{ textAlign: 'center', width: '48px' }}>
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={(e) => {
                        e.stopPropagation();
                        onRowSelect?.(rowId, e.target.checked);
                      }}
                      aria-label={selected ? `Deselect row ${rowIndex + 1}` : `Select row ${rowIndex + 1}`}
                      style={{
                        width: '18px',
                        height: '18px',
                        cursor: 'pointer',
                        accentColor: 'var(--color-brand-primary)',
                      }}
                    />
                  </td>
                )}
                {columns.map(column => (
                  <td
                    key={column.key}
                    style={{
                      textAlign: column.align || 'left',
                    } as React.CSSProperties}
                    className={column.cellClassName}
                  >
                    {renderCell(row, column)}
                  </td>
                ))}
              </tr>
            );
          })
        )}
      </tbody>
    </>
  );

  return (
    <div className={className} style={{ position: 'relative', width: '100%' }}>
      <style jsx>{css}</style>

      {loading && (
        <div className="table-loading-overlay" aria-live="polite" aria-label="Loading table data">
          <div className="table-loading-spinner" />
        </div>
      )}

      {responsive ? (
        <div className="table-responsive-wrapper">
          <table ref={forwardedRef} {...props} style={tableStyle}>
            {content}
          </table>
        </div>
      ) : (
        <table ref={forwardedRef} {...props} style={tableStyle}>
          {content}
        </table>
      )}
    </div>
  );
}

// Export a typed forwardRef wrapper
export const Table = forwardRef<HTMLTableElement, TableProps>((props, ref) => {
  // We need to cast because TypeScript doesn't support generic forwardRef well
  return <TableInner {...props} forwardedRef={ref} />;
});

Table.displayName = 'Table';

// Column helper
export function createColumn<T>(column: Column<T>): Column<T> {
  return column;
}

// Pagination helper types
export interface PaginationState {
  pageIndex: number;
  pageSize: number;
}

export interface PaginationControlsProps {
  pageIndex: number;
  pageSize: number;
  total: number;
  onPageChange: (pageIndex: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  pageSizeOptions?: number[];
}