import { showSubmittedData } from '@/lib/show-submitted-data'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { usePushNotifications } from './notifications-provider'
import { PushNotificationsUpsertDialog } from './notifications-upsert-dialog'

export function InformationsDialogs() {
    const { open, setOpen, currentRow, setCurrentRow } = usePushNotifications()
    return (
        <>
            <PushNotificationsUpsertDialog
                key='informations-create'
                open={open === 'create'}
                onOpenChange={() => setOpen('create')}
            />
            {currentRow && (
                <>
                    <PushNotificationsUpsertDialog
                        key={`informations-update-${currentRow.id}`}
                        open={open === 'update'}
                        onOpenChange={() => setOpen('update')}
                        currentRow={currentRow}
                    />
                    <ConfirmDialog
                        key={`information-delete-${currentRow.id}`}
                        destructive
                        open={open === 'delete'}
                        onOpenChange={() => {
                            setOpen('delete')
                            setTimeout(() => {
                                setCurrentRow(null)
                            }, 500)
                        }}
                        handleConfirm={() => {
                            setOpen(null)
                            setTimeout(() => {
                                setCurrentRow(null)
                            }, 500)
                            showSubmittedData(
                                currentRow,
                                'The following information has been deleted:'
                            )
                        }}
                        className='max-w-md'
                        title={`Delete this task: ${currentRow.id} ?`}
                        desc={
                            <>
                                You are about to delete a information with the ID{' '}
                                <strong>{currentRow.id}</strong>. <br />
                                This action cannot be undone.
                            </>
                        }
                        confirmText='Delete'
                    />
                </>
            )}
        </>
    )
}
