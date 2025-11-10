import { type ColumnDef, type Row } from '@tanstack/react-table'
import { cn } from '@/lib/utils'
import { DataTableColumnHeader } from '@/components/data-table'
import { LongText } from '@/components/long-text'
import { type User } from '../data/schema'
import { EyeIcon } from 'lucide-react'
import { useUsers } from './users-provider'
import { format } from 'date-fns'

function ViewActionCell({ row }: { row: Row<User> }) {
  const { setOpen, setCurrentRow } = useUsers()
  return (
    <div className='flex justify-end'>
      <button
        aria-label='View user'
        className='p-1 pr-4 rounded hover:bg-muted/50 cursor-pointer'
        onClick={() => {
          setCurrentRow(row.original)
          setOpen('view')
        }}
      >
        <EyeIcon />
      </button>
    </div>
  )
}

export const usersColumns: ColumnDef<User>[] = [
  {
    id: 'select',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='No' />
    ),
    meta: {
      className: cn('sticky md:table-cell start-0 z-10 rounded-tl-[inherit]'),
    },
    cell: ({ row }) => {
      const serial = row.index + 1; 
      return (
        <span className="whitespace-nowrap text-sm text-muted-foreground">
          {serial}
        </span>
      );
    },
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'username',
    // header: ({ column }) => (
    //   <DataTableColumnHeader column={column} title='Username' />
    // ),
    cell: ({ row }) => (
      <LongText className='max-w-36'>{row.getValue('username')}</LongText>
    ),
    meta: {
      className: cn(
        'drop-shadow-[0_1px_2px_rgb(0_0_0_/_0.1)] dark:drop-shadow-[0_1px_2px_rgb(255_255_255_/_0.1)]',
        'sticky start-6 @4xl/content:table-cell @4xl/content:drop-shadow-none'
      ),
    },
    enableHiding: false,
  },
  // {
  //   id: 'fullName',
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title='Name' />
  //   ),
  //   cell: ({ row }) => {
  //     const { firstName, lastName } = row.original
  //     const fullName = `${firstName} ${lastName}`
  //     return <LongText className='max-w-36'>{fullName}</LongText>
  //   },
  //   meta: { className: 'w-36' },
  // },
  {
    accessorKey: 'email',
    // header: ({ column }) => (
    //   <DataTableColumnHeader column={column} title='Email' />
    // ),
    cell: ({ row }) => (
      <div className='w-fit text-nowrap'>{row.getValue('email')}</div>
    ),
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title='Joined' />
    ),
    cell: ({ row }) => {
      const date = row.original.createdAt
      const formatted =
        date instanceof Date && !Number.isNaN(date.getTime())
          ? format(date, 'dd MMM yyyy')
          : '-'
      return (
        <span className='whitespace-nowrap text-sm text-muted-foreground'>
          {formatted}
        </span>
      )
    },
    enableHiding: false,
  },
  // {
  //   accessorKey: 'phoneNumber',
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title='Phone Number' />
  //   ),
  //   cell: ({ row }) => <div>{row.getValue('phoneNumber')}</div>,
  //   enableSorting: false,
  // },
  // {
  //   accessorKey: 'role',
  //   header: ({ column }) => (
  //     <DataTableColumnHeader column={column} title='Role' />
  //   ),
  //   cell: ({ row }) => {
  //     const { role } = row.original
  //     const userType = roles.find(({ value }) => value === role)

  //     if (!userType) {
  //       return null
  //     }

  //     return (
  //       <div className='flex items-center gap-x-2'>
  //         {userType.icon && (
  //           <userType.icon size={16} className='text-muted-foreground' />
  //         )}
  //         <span className='text-sm capitalize'>{row.getValue('role')}</span>
  //       </div>
  //     )
  //   },
  //   filterFn: (row, id, value) => {
  //     return value.includes(row.getValue(id))
  //   },
  //   enableSorting: false,
  //   enableHiding: false,
  // },
  {
    id: 'actions',
    cell: ({ row }) => <ViewActionCell row={row} />,
    meta: {
      className: cn('rounded-tr-[inherit]'),
    },
    enableSorting: false,
    enableHiding: false,
  },
]
