import { type ColumnDef } from '@tanstack/react-table'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
// import { format } from 'date-fns'
// import { id as localeID } from 'date-fns/locale'
import type { Notification } from '../data/schema' 
import { DataTableColumnHeader } from '@/components/data-table'
import { DataTableRowActions } from './data-table-row-actions'

export const pushNotificationsColumns: ColumnDef<Notification>[] = [

  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(v) => row.toggleSelected(!!v)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
    size: 32,
  },

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
  },
  // {
  //   accessorKey: 'scheduleDate',
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title="Scheduled Date" />
  //   ),
  //   cell: ({ row }) => {
  //     const v = row.getValue('scheduleDate') as string | null | undefined
  //     if (!v) return <span className="text-muted-foreground">—</span>
  //     try {
  //       return <span>{format(new Date(v), 'dd MMM yyyy HH:mm', { locale: localeID })}</span>
  //     } catch {
  //       return <span className="text-muted-foreground">{v}</span>
  //     }
  //   },
  //   sortingFn: 'datetime',
  // },

  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const s = String(row.getValue('status'))
      const variant =
        s === 'scheduled' ? 'outline'
        // : s === 'sending'   ? 'secondary'
        // : s === 'sent'      ? 'default'
        // : s === 'failed'    ? 'destructive'
        // : s === 'canceled'  ? 'secondary'
        : 'secondary'
      return <Badge variant={variant as any}>{s}</Badge>
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => <DataTableRowActions row={row} />,
  },
]
