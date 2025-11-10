import { type ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { id as localeID } from 'date-fns/locale'
import type { Notification } from '../data/schema'
import { DataTableColumnHeader } from '@/components/data-table'
import { DataTableRowActions } from './data-table-row-actions'

function getTimestamp(value: unknown): number | null {
  if (typeof value !== 'string') return null
  const date = new Date(value)
  const time = date.getTime()
  return Number.isNaN(time) ? null : time
}

export const pushNotificationsColumns: ColumnDef<Notification>[] = [

  // {
  //   id: 'select',
  //   header: ({ table }) => (
  //     <Checkbox
  //       checked={
  //         table.getIsAllPageRowsSelected() ||
  //         (table.getIsSomePageRowsSelected() && 'indeterminate')
  //       }
  //       onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
  //       aria-label="Select all"
  //     />
  //   ),
  //   cell: ({ row }) => (
  //     <Checkbox
  //       checked={row.getIsSelected()}
  //       onCheckedChange={(v) => row.toggleSelected(!!v)}
  //       aria-label="Select row"
  //     />
  //   ),
  //   enableSorting: false,
  //   enableHiding: false,
  //   size: 32,
  // },

  {
    id: 'no',
    header: ({ column} ) => (
      <DataTableColumnHeader column={column} title="No" />
    ),
    enableSorting: false,
    enableHiding: false,
    cell: ({ row, table }) => {
      const { pageIndex, pageSize } = table.getState().pagination
      return <span className="font-mono text-xs">{pageIndex * pageSize + row.index + 1}</span>
    },
    size: 48,
  },

  {
    accessorKey: 'title',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Title" />
    ),
    cell: ({ row }) => <span className="font-medium">{row.getValue('title')}</span>,
    enableSorting: false,
  },

  {
    accessorKey: 'content',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Content" />
    ),
    cell: ({ row }) => {
      const v = String(row.getValue('content') ?? '')
      const truncated = v.length > 50 ? v.substring(0, 50) + '…' : v
      return <span className="text-muted-foreground">{truncated}</span>
    },
    enableSorting: false,
  },
  {
    accessorKey: 'scheduleDate',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Scheduled Date" />
    ),
    cell: ({ row }) => {
      const value = row.getValue('scheduleDate') as string | null | undefined

      if (!value) {
        return <span className="text-muted-foreground">—</span>
      }

      const date = new Date(value)
      if (Number.isNaN(date.getTime())) {
        return <span className="text-muted-foreground">{value}</span>
      }

      return (
        <span>{format(date, 'dd MMM yyyy HH:mm', { locale: localeID })}</span>
      )
    },
    enableSorting: false,
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created At" />
    ),
    cell: ({ row }) => {
      const value = row.getValue('createdAt') as string | null | undefined
      if (!value) {
        return <span className="text-muted-foreground">—</span>
      }

      const date = new Date(value)
      if (Number.isNaN(date.getTime())) {
        return <span className="text-muted-foreground">{value}</span>
      }

      return (
        <span>{format(date, 'dd MMM yyyy HH:mm', { locale: localeID })}</span>
      )
    },
    sortingFn: (rowA, rowB, columnId) => {
      const a = getTimestamp(rowA.getValue(columnId))
      const b = getTimestamp(rowB.getValue(columnId))
      if (a === null && b === null) return 0
      if (a === null) return -1
      if (b === null) return 1
      return a - b
    },
  },

  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]
