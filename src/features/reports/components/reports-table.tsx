import { useEffect, useMemo, useState } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import {
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
import { useTableUrlState } from '@/hooks/use-table-url-state'
import type { Report } from '../data/schema'
import { reportsColumns as columns } from './reports-columns'
import { reportStatusOptions } from '../data/data'

const route = getRouteApi('/_authenticated/reports/')

type ReportsTableProps = {
  data: Report[]
  total: number
  pageCount: number
  isLoading: boolean
  isFetching: boolean
  sorting: SortingState
  onSortingChange: (updater: SortingState | ((state: SortingState) => SortingState)) => void
}

export function ReportsTable({
  data,
  total,
  pageCount,
  isLoading,
  isFetching,
  sorting,
  onSortingChange,
}: ReportsTableProps) {
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})

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
    globalFilter: { enabled: true, key: 's', trim: true },
    columnFilters: [
      {
        columnId: 'status',
        searchKey: 'status',
        type: 'string',
      },
    ],
  })

  const table = useReactTable({
    data: useMemo(() => data, [data]),
    columns,
    state: {
      sorting,
      columnVisibility,
      globalFilter,
      columnFilters,
      pagination,
    },
    manualPagination: true,
    pageCount,
    manualSorting: true,
    autoResetPageIndex: false,
    onPaginationChange,
    onSortingChange,
    onColumnFiltersChange,
    onGlobalFilterChange,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    globalFilterFn: (row, _columnId, value) => {
      if (!value) return true
      const searchValue = String(value).toLowerCase()
      const reporter = String(row.getValue('reporterEmail')).toLowerCase()
      const reported = String(row.getValue('reportedEmail')).toLowerCase()
      const reason = String(row.getValue('reason')).toLowerCase()
      return reporter.includes(searchValue) || reported.includes(searchValue) || reason.includes(searchValue)
    },
  })

  useEffect(() => {
    if (!isLoading && !isFetching) {
      ensurePageInRange(pageCount)
    }
  }, [ensurePageInRange, pageCount, isFetching, isLoading])

  const visibleColumns = table.getVisibleLeafColumns()
  const visibleColumnCount = visibleColumns.length || columns.length
  const skeletonRowCount = Math.min(table.getState().pagination?.pageSize ?? 10, 10)
  const showSkeleton = isLoading || isFetching
  const isTableEmpty = total === 0 && !showSkeleton

  return (
    <div className="space-y-4 max-sm:has-[div[role='toolbar']]:mb-16">
      <DataTableToolbar
        table={table}
        searchPlaceholder="Filter by reporter, reported user, or reason..."
        filters={[
          {
            columnId: 'status',
            title: 'Status',
            options: reportStatusOptions.map((option) => ({
              label: option.label,
              value: option.value,
            })),
          },
        ]}
      />

      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} colSpan={header.colSpan}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {showSkeleton ? (
              Array.from({ length: skeletonRowCount }).map((_, index) => (
                <TableRow key={`loading-${index}`}>
                  {visibleColumns.map((column) => (
                    <TableCell key={column.id}>
                      <Skeleton className="h-4 w-full max-w-[220px]" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={visibleColumnCount} className="h-24 text-center">
                  {isTableEmpty ? 'No reports found.' : 'No results.'}
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
