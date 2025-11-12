import { useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { usePushNotifications } from './notifications-provider'
import {
  PushNotificationsUpsertDialog,
  type PushNotificationFormValues,
} from './notifications-upsert-dialog'
import { pushNotificationsQueryKey } from '../hooks/use-push-notifications-query'
import { createPushNotification } from '../api/create-push-notification'
import { updatePushNotification } from '../api/update-push-notification'
import { deletePushNotification } from '../api/delete-push-notification'
import type { Notification, NotificationStatus } from '../data/schema'
import { PushNotificationViewDialog } from './notifications-view-dialog'

function deriveStatus(scheduleDate: string | null): NotificationStatus {
  return scheduleDate ? 'scheduled' : 'draft'
}

function mapFormValuesToPayload(values: PushNotificationFormValues) {
  const trimmedSchedule = values.scheduleAt?.trim() ?? ''
  const scheduleDate = trimmedSchedule.length > 0 ? trimmedSchedule : null

  return {
    title: values.title.trim(),
    content: values.message.trim(),
    status: deriveStatus(scheduleDate),
    scheduleDate,
    target: 'all' as const,
    priority: 'normal' as const,
  }
}

export function PushNotificationsDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = usePushNotifications()
  const queryClient = useQueryClient()

  const invalidateList = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: pushNotificationsQueryKey })
  }, [queryClient])

  const createMutation = useMutation({
    mutationFn: async (values: PushNotificationFormValues) =>
      createPushNotification(mapFormValuesToPayload(values)),
    onSuccess: async (result) => {
      await invalidateList()
      toast.success(
        result.message ?? 'Push notification created successfully.'
      )
      setOpen(null)
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to create push notification.'
      toast.error(message)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string
      values: PushNotificationFormValues
    }) =>
      updatePushNotification(id, mapFormValuesToPayload(values)),
    onSuccess: async (result) => {
      await invalidateList()
      toast.success(
        result.message ?? 'Push notification updated successfully.'
      )
      setOpen(null)
      setCurrentRow(null)
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to update push notification.'
      toast.error(message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => deletePushNotification(id),
    onSuccess: async (message) => {
      await invalidateList()
      toast.success(message ?? 'Push notification deleted successfully.')
      setOpen(null)
      setCurrentRow(null)
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error
          ? error.message
          : 'Failed to delete push notification.'
      toast.error(message)
    },
  })

  const handleCreateSubmit = async (values: PushNotificationFormValues) => {
    await createMutation.mutateAsync(values)
  }

  const handleUpdateSubmit = async (
    values: PushNotificationFormValues,
    notification: Notification | null
  ) => {
    if (!notification) return
    await updateMutation.mutateAsync({ id: notification.id, values })
  }

  const handleDelete = async () => {
    if (!currentRow) return
    await deleteMutation.mutateAsync(currentRow.id)
  }

  return (
    <>
      <PushNotificationsUpsertDialog
        key='push-notifications-create'
        open={open === 'create'}
        onOpenChange={(isOpen) => setOpen(isOpen ? 'create' : null)}
        onSubmit={handleCreateSubmit}
      />
      {currentRow && (
        <>
          <PushNotificationsUpsertDialog
            key={`push-notifications-update-${currentRow.id}`}
            open={open === 'update'}
            onOpenChange={(isOpen) => {
              if (isOpen) {
                setOpen('update')
              } else {
                setOpen(null)
                setCurrentRow(null)
              }
            }}
            currentRow={currentRow}
            onSubmit={(values) => handleUpdateSubmit(values, currentRow)}
          />
          <ConfirmDialog
            key={`push-notifications-delete-${currentRow.id}`}
            destructive
            open={open === 'delete'}
            onOpenChange={(isOpen) => {
              if (isOpen) {
                setOpen('delete')
              } else {
                setOpen(null)
                setCurrentRow(null)
              }
            }}
            handleConfirm={() => {
              void handleDelete()
            }}
            isLoading={deleteMutation.isPending}
            className='max-w-md'
            title={`Delete push notification: ${currentRow.title || currentRow.id}?`}
            desc={
              <>
                You are about to delete the push notification{' '}
                <strong>{currentRow.title || currentRow.id}</strong>. <br />
                This action cannot be undone.
              </>
            }
            confirmText='Delete'
          />
          <PushNotificationViewDialog
            key={`push-notifications-view-${currentRow.id}`}
            open={open === 'view'}
            onOpenChange={(isOpen) => {
              if (isOpen) {
                setOpen('view')
              } else {
                setOpen(null)
                setCurrentRow(null)
              }
            }}
            notification={currentRow}
          />
        </>
      )}
    </>
  )
}
