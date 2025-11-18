import { type ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'
import { id as localeID } from 'date-fns/locale'
import { Badge } from '@/components/ui/badge'
import { DataTableColumnHeader } from '@/components/data-table'
import { getRowSerial } from '@/lib/get-row-serial'
import { type Translator } from '@/lib/i18n'
import type { Report } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'

export function createReportsColumns(t: Translator): ColumnDef<Report>[] {
  return [
  {
    id: 'no',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('reports.columns.number', 'No')} />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 48,
    cell: ({ row, table }) => (
      <span className='font-mono text-xs'>{getRowSerial(table, row.index)}</span>
    ),
  },
  {
    accessorKey: 'reporterName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('reports.columns.reporter', 'Reporter')} />
    ),
    cell: ({ row }) => <span className='font-medium'>{row.original.reporterName}</span>,
    enableSorting: false,
  },
  {
    accessorKey: 'reportedName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('reports.columns.reported', 'Reported User')} />
    ),
    cell: ({ row }) => <span>{row.original.reportedName}</span>,
    enableSorting: false,
  },
  {
    accessorKey: 'reason',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('reports.columns.reason', 'Reason')} />
    ),
    cell: ({ row }) => {
      const reason = row.original.reason
      return <span className='text-sm text-muted-foreground'>{reason}</span>
    },
    enableSorting: false,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('reports.columns.status', 'Status')} />
    ),
    cell: ({ row }) => {
      const status = row.original.status
      const variant = status === 'resolve' ? 'default' : 'secondary'
      return <Badge variant={variant}>{t(`reports.status.${status}` as const, status)}</Badge>
    },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title={t('reports.columns.created', 'Created')} />
    ),
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
}
