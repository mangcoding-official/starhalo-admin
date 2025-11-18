import { type ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { id as localeID } from 'date-fns/locale'
import { DataTableColumnHeader } from '@/components/data-table'
import { getRowSerial } from '@/lib/get-row-serial'
import { type Translator } from '@/lib/i18n'
import type { Information } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'

export function createInformationColumns(
  t: Translator
): ColumnDef<Information>[] {
  return [
  // {
  //   id: 'select',
  //   header: ({ table }) => (
  //     <Checkbox
  //       checked={
  //         table.getIsAllPageRowsSelected() ||
  //         (table.getIsSomePageRowsSelected() && 'indeterminate')
  //       }
  //       onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
  //       aria-label="Select all"
  //     />
  //   ),
  //   cell: ({ row }) => (
  //     <Checkbox
  //       checked={row.getIsSelected()}
  //       onCheckedChange={(value) => row.toggleSelected(!!value)}
  //       aria-label="Select row"
  //     />
  //   ),
  //   enableSorting: false,
  //   enableHiding: false,
  //   size: 32,
  // },
  {
    accessorKey: 'id',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t('info.columns.number', 'No')}
      />
    ),
    cell: ({ row, table }) => (
      <span className="font-mono text-xs">{getRowSerial(table, row.index)}</span>
    ),
    enableSorting: false,
    enableHiding: false,
    size: 48,
  },
  {
    accessorKey: 'title',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t('info.columns.title', 'Title')}
      />
    ),
    cell: ({ row }) => <span className="font-medium">{row.getValue('title')}</span>,
    enableSorting: false,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t('info.columns.status', 'Status')}
      />
    ),
    cell: ({ row }) => {
      const status = String(row.getValue('status'))
      const map: Record<string, string> = {
        draft: 'secondary',
        published: 'default',
      }
  type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline'
  const variant = (map[status] ?? 'secondary') as BadgeVariant
  const translatedStatus =
    status === 'draft'
      ? t('info.status.draft', 'Draft')
      : status === 'published'
        ? t('info.status.published', 'Published')
        : status
  return <Badge variant={variant}>{translatedStatus}</Badge>
    },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader
        column={column}
        title={t('info.columns.created', 'Created')}
      />
    ),
    cell: ({ row }) => {
      const value = row.original.createdAt
      if (!(value instanceof Date) || Number.isNaN(value.getTime())) {
        return <span className="text-muted-foreground">—</span>
      }
      return (
        <span>{format(value, 'dd MMM yyyy HH:mm', { locale: localeID })}</span>
      )
    },
    sortingFn: 'datetime',
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]
}
