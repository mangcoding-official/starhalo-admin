import { useEffect, useMemo, useState } from 'react'
import {
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { type NavigateFn, useTableUrlState } from '@/hooks/use-table-url-state'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { DataTablePagination, DataTableToolbar } from '@/components/data-table'
// import { roles } from '../data/data'
import { type User } from '../data/schema'
import { useTranslation } from '@/lib/i18n'
import { DataTableBulkActions } from './data-table-bulk-actions'
import { createUsersColumns } from './users-columns'

declare module '@tanstack/react-table' {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    className: string
  }
}

type DataTableProps = {
  data: User[]
  total?: number
  pageCount?: number
  isLoading?: boolean
  isFetching?: boolean
  sorting?: SortingState
  onSortingChange?: (
    updater: SortingState | ((state: SortingState) => SortingState)
  ) => void
  search: Record<string, unknown>
  navigate: NavigateFn
}

export function UsersTable({
  data,
  total = data.length,
  pageCount = 1,
  isLoading = false,
  isFetching = false,
  sorting = [],
  onSortingChange,
  search,
  navigate,
}: DataTableProps) {
  const { t } = useTranslation()
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const columnDefs = useMemo(() => createUsersColumns(t), [t])

  const {
    globalFilter,
    onGlobalFilterChange,
    columnFilters,
    onColumnFiltersChange,
    pagination,
    onPaginationChange,
    ensurePageInRange,
  } = useTableUrlState({
    search,
    navigate,
    pagination: { defaultPage: 1, defaultPageSize: 10 },
    globalFilter: { enabled: true, key: 's', trim: false },
  })

  const table = useReactTable({
    data,
    columns: columnDefs,
    state: {
      sorting,
      pagination,
      rowSelection,
      columnFilters,
      columnVisibility,
      globalFilter,
    },
    enableRowSelection: true,
    onPaginationChange,
    onColumnFiltersChange,
    onRowSelectionChange: setRowSelection,
    onSortingChange: onSortingChange ?? (() => {}),
    onColumnVisibilityChange: setColumnVisibility,
    onGlobalFilterChange,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    globalFilterFn: (row, _columnId, filterValue) => {
      const searchValue = String(filterValue ?? '').toLowerCase()
      if (!searchValue) {
        return true
      }
      const username = String(row.getValue('username') ?? '').toLowerCase()
      const email = String(row.getValue('email') ?? '').toLowerCase()
      return username.includes(searchValue) || email.includes(searchValue)
    },
    manualPagination: true,
    pageCount,
    manualSorting: true,
    autoResetPageIndex: false,
  })

  useEffect(() => {
    if (!isLoading && !isFetching) {
      ensurePageInRange(pageCount)
    }
  }, [ensurePageInRange, pageCount, isFetching, isLoading])

  const visibleColumns = table.getVisibleLeafColumns()
  const visibleColumnCount = visibleColumns.length || columnDefs.length
  const skeletonRowCount = Math.min(
    table.getState().pagination?.pageSize ?? 10,
    10
  )

  const showSkeleton = isLoading || isFetching
  const isTableEmpty = total === 0 && !showSkeleton

  return (
    <div className='space-y-4 max-sm:has-[div[role="toolbar"]]:mb-16'>
      <DataTableToolbar
        table={table}
        searchPlaceholder={t(
          'users.table.searchPlaceholder',
          'Filter users...'
        )}
        filters={[]}
      />
      <div className='overflow-hidden rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className='group/row'>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      colSpan={header.colSpan}
                      className={cn(
                        'bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted',
                        header.column.columnDef.meta?.className ?? ''
                      )}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {showSkeleton ? (
              Array.from({ length: skeletonRowCount }).map((_, rowIndex) => (
                <TableRow key={`loading-${rowIndex}`} className='group/row'>
                  {visibleColumns.map((column) => {
                    const cellClassName = cn(
                      'bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted',
                      column.columnDef.meta?.className ?? ''
                    )

                    const skeleton =
                      column.id === 'select' ? (
                        <div className='flex items-center'>
                          <Skeleton className='h-4 w-4 rounded-sm' />
                        </div>
                      ) : column.id === 'actions' ? (
                        <div className='flex justify-end'>
                          <Skeleton className='h-5 w-5 rounded-full' />
                        </div>
                      ) : (
                        <Skeleton className='h-4 w-full max-w-[200px]' />
                      )

                    return (
                      <TableCell
                        key={column.id}
                        className={cellClassName}
                        aria-hidden='true'
                      >
                        {skeleton}
                      </TableCell>
                    )
                  })}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                  className='group/row'
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(
                        'bg-background group-hover/row:bg-muted group-data-[state=selected]/row:bg-muted',
                        cell.column.columnDef.meta?.className ?? ''
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={visibleColumnCount}
                  className='h-24 text-center'
                >
                  {isTableEmpty
                    ? t('users.table.empty.noUsers', 'No users found.')
                    : t('users.table.empty.noResults', 'No results.')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <DataTablePagination table={table} />
      <DataTableBulkActions table={table} />
    </div>
  )
}
