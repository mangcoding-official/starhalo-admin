import { useEffect, useMemo, useState } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import {
  type OnChangeFn,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from '@tanstack/react-table'
import { useTableUrlState } from '@/hooks/use-table-url-state'
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
import { useTranslation } from '@/lib/i18n'
import type { Notification } from '../data/schema'
import { createPushNotificationsColumns } from './notifications-columns'

const route = getRouteApi('/_authenticated/push-notifications/')

type DataTableProps = {
  data: Notification[]
  total?: number
  pageCount?: number
  isLoading?: boolean
  isFetching?: boolean
  sorting: SortingState
  onSortingChange?: OnChangeFn<SortingState>
}

export function PushNotificationsTable({
  data,
  total = data.length,
  pageCount: pageCountProp,
  isLoading = false,
  isFetching = false,
  sorting,
  onSortingChange,
}: DataTableProps) {
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const { t } = useTranslation()
  const columns = useMemo(() => createPushNotificationsColumns(t), [t])

  const {
    globalFilter,
    onGlobalFilterChange,
    columnFilters,
    onColumnFiltersChange,
    pagination,
    onPaginationChange,
    ensurePageInRange,
  } = useTableUrlState({
    search: route.useSearch(),
    navigate: route.useNavigate(),
    pagination: { defaultPage: 1, defaultPageSize: 10 },
    globalFilter: { enabled: true, key: 's', trim: false },
  })

  const effectivePageCount = useMemo(() => {
    if (typeof pageCountProp === 'number' && pageCountProp > 0) {
      return pageCountProp
    }

    const pageSize = pagination?.pageSize ?? 10
    if (pageSize <= 0) return 1

    return Math.max(1, Math.ceil(total / pageSize))
  }, [pageCountProp, pagination?.pageSize, total])

  const table = useReactTable({
    data,
    columns,
    state: {
      sorting,
      columnVisibility,
      rowSelection,
      columnFilters,
      globalFilter,
      pagination,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: onSortingChange ?? (() => {}),
    onColumnVisibilityChange: setColumnVisibility,
    globalFilterFn: (row, _colId, filterValue) => {
      const id = String(row.getValue('id')).toLowerCase()
      const title = String(row.getValue('title')).toLowerCase()
      const searchValue = String(filterValue).toLowerCase()
      return id.includes(searchValue) || title.includes(searchValue)
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    manualPagination: true,
    pageCount: effectivePageCount,
    autoResetPageIndex: false,
    onPaginationChange,
    onGlobalFilterChange,
    onColumnFiltersChange,
  })

  useEffect(() => {
    if (!isLoading && !isFetching) {
      ensurePageInRange(effectivePageCount)
    }
  }, [ensurePageInRange, effectivePageCount, isLoading, isFetching])

  const visibleColumns = table.getVisibleLeafColumns()
  const visibleColumnCount = visibleColumns.length || columns.length
  const skeletonRowCount = Math.min(
    pagination?.pageSize ? Number(pagination.pageSize) : 10,
    10
  )

  const showSkeleton = isLoading || isFetching
  const showEmptyState = !showSkeleton && total === 0 && data.length === 0

  return (
    <div className="space-y-4 max-sm:has-[div[role='toolbar']]:mb-16">
      <DataTableToolbar
        table={table}
        searchPlaceholder={t(
          'push.table.searchPlaceholder',
          'Filter by title or ID...'
        )}
      />

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {showSkeleton ? (
              Array.from({ length: skeletonRowCount }).map((_, rowIndex) => (
                <TableRow key={`loading-${rowIndex}`}>
                  {visibleColumns.map((column) => (
                    <TableCell key={column.id}>
                      <Skeleton className="h-4 w-full max-w-[220px]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
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
                  className="h-24 text-center"
                >
                  {showEmptyState
                    ? t(
                        'push.table.empty.noNotifications',
                        'No push notifications found.'
                      )
                    : t('push.table.empty.noResults', 'No results.')}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination table={table} />
    </div>
  )
}
