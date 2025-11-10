import { useCallback } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { useInformations } from './informations-provider'
import {
  InformationsUpsertDialog,
  type InformationFormValues,
} from './informations-upsert-dialog'
import { informationsQueryKey } from '../hooks/use-informations-query'
import { createInformation } from '../api/create-information'
import { updateInformation } from '../api/update-information'
import { deleteInformation } from '../api/delete-information'
import type { Information } from '../data/schema'

export function InformationsDialogs() {
  const { open, setOpen, currentRow, setCurrentRow } = useInformations()
  const queryClient = useQueryClient()

  const invalidateList = useCallback(async () => {
    await queryClient.invalidateQueries({ queryKey: informationsQueryKey })
  }, [queryClient])

  const createMutation = useMutation({
    mutationFn: async (values: InformationFormValues) =>
      createInformation({
        title: values.title,
        content: values.content,
        status: values.status,
      }),
    onSuccess: async (result) => {
      await invalidateList()
      toast.success(result.message ?? 'Information created successfully.')
      setOpen(null)
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : 'Failed to create information.'
      toast.error(message)
    },
  })

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      values,
    }: {
      id: string
      values: InformationFormValues
    }) =>
      updateInformation(id, {
        title: values.title,
        content: values.content,
        status: values.status,
      }),
    onSuccess: async (result) => {
      await invalidateList()
      toast.success(result.message ?? 'Information updated successfully.')
      setOpen(null)
      setCurrentRow(null)
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : 'Failed to update information.'
      toast.error(message)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => deleteInformation(id),
    onSuccess: async (message) => {
      await invalidateList()
      toast.success(message ?? 'Information deleted successfully.')
      setOpen(null)
      setCurrentRow(null)
    },
    onError: (error: unknown) => {
      const message =
        error instanceof Error ? error.message : 'Failed to delete information.'
      toast.error(message)
    },
  })

  const handleCreateSubmit = async (values: InformationFormValues) => {
    await createMutation.mutateAsync(values)
  }

  const handleUpdateSubmit = async (
    values: InformationFormValues,
    information: Information | null
  ) => {
    if (!information) return
    await updateMutation.mutateAsync({ id: information.id, values })
  }

  const handleDelete = async () => {
    if (!currentRow) return
    await deleteMutation.mutateAsync(currentRow.id)
  }

  return (
    <>
      <InformationsUpsertDialog
        key='informations-create'
        open={open === 'create'}
        onOpenChange={(isOpen) => setOpen(isOpen ? 'create' : null)}
        onSubmit={handleCreateSubmit}
      />
      {currentRow && (
        <>
          <InformationsUpsertDialog
            key={`informations-update-${currentRow.id}`}
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
            key={`information-delete-${currentRow.id}`}
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
            className='max-w-md'
            title={`Delete information: ${currentRow.title || currentRow.id}?`}
            desc={
              <>
                You are about to delete the information titled{' '}
                <strong>{currentRow.title || currentRow.id}</strong>. <br />
                This action cannot be undone.
              </>
            }
            confirmText='Delete'
            isLoading={deleteMutation.isPending}
          />
        </>
      )}
    </>
  )
}
