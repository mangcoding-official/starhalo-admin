import { DotsHorizontalIcon } from '@radix-ui/react-icons'
import { type Row } from '@tanstack/react-table'
import { Eye, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuShortcut,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useTranslation } from '@/lib/i18n'
import { usePushNotifications } from './notifications-provider'
import { notificationSchema } from '../data/schema'


type DataTableRowActionsProps<TData> = {
    row: Row<TData>
}

export function DataTableRowActions<TData>({
    row,
}: DataTableRowActionsProps<TData>) {
    const task = notificationSchema.parse(row.original)

    const { setOpen, setCurrentRow } = usePushNotifications()
    const { t } = useTranslation()

    return (
        <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
                <Button
                    variant='ghost'
                    className='data-[state=open]:bg-muted flex h-8 w-8 p-0'
                >
                    <DotsHorizontalIcon className='h-4 w-4' />
                    <span className='sr-only'>
                        {t('push.rowActions.openMenu', 'Open menu')}
                    </span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-[160px]'>
                <DropdownMenuItem
                    onClick={() => {
                        setCurrentRow(task)
                        setOpen('view')
                    }}
                >
                    {t('push.rowActions.view', 'View details')}
                    <DropdownMenuShortcut>
                        <Eye size={16} />
                    </DropdownMenuShortcut>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                {/* <DropdownMenuItem
                    onClick={() => {
                        setCurrentRow(task)
                        setOpen('update')
                    }}
                >
                    Edit
                    <DropdownMenuShortcut>
                        <Edit size={16} />
                    </DropdownMenuShortcut>
                </DropdownMenuItem> */}
                {/* <DropdownMenuSeparator /> */}
                <DropdownMenuItem
                    onClick={() => {
                        setCurrentRow(task)
                        setOpen('delete')
                    }}
                >
                    {t('push.rowActions.delete', 'Delete')}
                    <DropdownMenuShortcut>
                        <Trash2 size={16} />
                    </DropdownMenuShortcut>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
