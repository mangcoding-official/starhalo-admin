import type { Table } from '@tanstack/react-table'

type TableMetaWithPagination = {
  pageIndex?: number
  pageSize?: number
  rowOffset?: number
}

function extractMeta(table: Table<unknown>): TableMetaWithPagination {
  const meta = (table.options.meta ?? {}) as TableMetaWithPagination
  return {
    pageIndex: typeof meta.pageIndex === 'number' ? meta.pageIndex : undefined,
    pageSize: typeof meta.pageSize === 'number' ? meta.pageSize : undefined,
    rowOffset: typeof meta.rowOffset === 'number' ? meta.rowOffset : undefined,
  }
}

export function getRowSerial<TData>(
  table: Table<TData>,
  rowIndex: number
): number {
  const pagination = table.getState().pagination
  const meta = extractMeta(table as Table<unknown>)

  if (typeof meta.rowOffset === 'number') {
    return meta.rowOffset + rowIndex + 1
  }

  const pageIndex =
    typeof pagination?.pageIndex === 'number'
      ? pagination.pageIndex
      : meta.pageIndex ?? 0
  const pageSize =
    typeof pagination?.pageSize === 'number'
      ? pagination.pageSize
      : meta.pageSize ?? 0

  if (pageSize > 0) {
    return pageIndex * pageSize + rowIndex + 1
  }

  return rowIndex + 1
}
