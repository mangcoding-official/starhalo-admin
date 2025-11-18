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
import { DataTablePagination, DataTableToolbar } from '@/components/data-table'
import { Skeleton } from '@/components/ui/skeleton'
import type { Information } from '../data/schema'
import { useTranslation } from '@/lib/i18n'
import { createInformationColumns } from './informations-columns'
import { infoStatuses } from '../data/data'

const route = getRouteApi('/_authenticated/informations/')

type DataTableProps = {
    data: Information[]
    total: number
    pageCount: number
    isLoading: boolean
    isFetching: boolean
    sorting: SortingState
    onSortingChange?: (
      updater: SortingState | ((state: SortingState) => SortingState)
    ) => void
}

export function InformationsTable({
    data,
    total,
    pageCount,
    isLoading,
    isFetching,
    sorting,
    onSortingChange,
}: DataTableProps) {
    const { t } = useTranslation()
    const [rowSelection, setRowSelection] = useState({})
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
    const columnDefs = useMemo(() => createInformationColumns(t), [t])

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
        columnFilters: [
            { columnId: 'status', searchKey: 'status', type: 'array' },
        ],
    })

    const typedData = useMemo(() => data, [data])

    const table = useReactTable({
        data: typedData,
        columns: columnDefs,
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
        globalFilterFn: (row, _columnId, filterValue) => {
            const id = String(row.getValue('id')).toLowerCase()
            const title = String(row.getValue('title')).toLowerCase()
            const searchValue = String(filterValue).toLowerCase()
            return id.includes(searchValue) || title.includes(searchValue)
        },
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFacetedRowModel: getFacetedRowModel(),
        getFacetedUniqueValues: getFacetedUniqueValues(),
        onPaginationChange,
        onGlobalFilterChange,
        onColumnFiltersChange,
        manualPagination: true,
        pageCount,
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
        <div className="space-y-4 max-sm:has-[div[role='toolbar']]:mb-16">
            <DataTableToolbar
                table={table}
                searchPlaceholder={t(
                    'info.table.searchPlaceholder',
                    'Filter by title or ID...'
                )}
                filters={[
                    {
                        columnId: 'status',
                        title: t('info.table.filters.status', 'Status'),
                        options: infoStatuses.map((status) => ({
                            value: status.value,
                            label: t(status.labelKey, status.label),
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
                                            : flexRender(
                                                header.column.columnDef.header,
                                                header.getContext(),
                                            )}
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
                                            <Skeleton className="h-4 w-full" />
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
                                                cell.getContext(),
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
                                    {isTableEmpty
                                        ? t('info.table.empty.noInfos', 'No informations found.')
                                        : t('info.table.empty.noResults', 'No results.')}
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>

            <DataTablePagination table={table} />
            {/* <DataTableBulkActions table={table} /> */}
        </div>
    )
}
