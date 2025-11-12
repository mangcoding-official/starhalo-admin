import { type ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { id as localeID } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { DataTableColumnHeader } from '@/components/data-table'
import { getRowSerial } from '@/lib/get-row-serial'
import type { Report } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'

export const reportsColumns: ColumnDef<Report>[] = [
  {
    id: 'no',
    header: ({ column }) => <DataTableColumnHeader column={column} title='No' />,
    enableSorting: false,
    enableHiding: false,
    size: 48,
    cell: ({ row, table }) => (
      <span className='font-mono text-xs'>{getRowSerial(table, row.index)}</span>
    ),
  },
  {
    accessorKey: 'reporterEmail',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Reporter' />,
    cell: ({ row }) => <span className='font-medium'>{row.original.reporterEmail}</span>,
    enableSorting: false,
  },
  {
    accessorKey: 'reportedEmail',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Reported User' />,
    cell: ({ row }) => <span>{row.original.reportedEmail}</span>,
    enableSorting: false,
  },
  {
    accessorKey: 'reason',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Reason' />,
    cell: ({ row }) => {
      const reason = row.original.reason
      return <span className='text-sm text-muted-foreground'>{reason}</span>
    },
    enableSorting: false,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Status' />,
    cell: ({ row }) => {
      const status = row.original.status
      const variant = status === 'resolve' ? 'default' : 'secondary'
      return <Badge variant={variant}>{status}</Badge>
    },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => <DataTableColumnHeader column={column} title='Created' />,
    cell: ({ row }) => {
      const value = row.original.createdAt
      if (!value) {
        return <span className='text-muted-foreground'>—</span>
      }
      return <span>{format(value, 'dd MMM yyyy HH:mm', { locale: localeID })}</span>
    },
    sortingFn: 'datetime',
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]
