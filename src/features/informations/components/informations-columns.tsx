import { type ColumnDef } from '@tanstack/react-table'
import { Badge } from '@/components/ui/badge'
import { format } from 'date-fns'
import { id as localeID } from 'date-fns/locale'
import type { Information } from '../data/schema'
import { DataTableRowActions } from './data-table-row-actions'
import { DataTableColumnHeader } from '@/components/data-table'
import { getRowSerial } from '@/lib/get-row-serial'

export const informationsColumns: ColumnDef<Information>[] = [
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
      <DataTableColumnHeader column={column} title="No" />
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
      <DataTableColumnHeader column={column} title="Title" />
    ),
    cell: ({ row }) => <span className="font-medium">{row.getValue('title')}</span>,
    enableSorting: false,
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = String(row.getValue('status'))
      const map: Record<string, string> = {
        draft: 'secondary',
        published: 'default',
      }
  type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline'
  const variant = (map[status] ?? 'secondary') as BadgeVariant
  return <Badge variant={variant}>{status}</Badge>
    },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
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
