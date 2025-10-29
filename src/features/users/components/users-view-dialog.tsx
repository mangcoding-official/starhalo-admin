"use client"

import { format } from 'date-fns'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog'
import { DisplayField } from './users-view-display-field.tsx'
import { type User } from '../data/schema'
import { useUserDetailQuery } from '../hooks/use-user-detail-query'

type UsersViewDialogProps = {
  currentRow?: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function UsersViewDialog({ currentRow, open, onOpenChange }: UsersViewDialogProps) {
  const userId = currentRow?.id ?? null
  const {
    data,
    isLoading,
    isFetching,
    error,
  } = useUserDetailQuery(userId, open)

  const detail = data

  const createdAt =
    detail?.createdAt && !Number.isNaN(detail.createdAt.getTime())
      ? format(detail.createdAt, 'dd MMM yyyy HH:mm')
      : '-'
  const updatedAt =
    detail?.updatedAt && !Number.isNaN(detail.updatedAt.getTime())
      ? format(detail.updatedAt, 'dd MMM yyyy HH:mm')
      : '-'
  const emailVerified =
    detail?.emailVerifiedAt && !Number.isNaN(detail.emailVerifiedAt.getTime())
      ? format(detail.emailVerifiedAt, 'dd MMM yyyy HH:mm')
      : detail?.emailVerifiedAt === null
        ? 'Not verified'
        : '-'

  const isPending = isLoading || isFetching

  const profile = detail?.profile
  const stats = detail?.stats

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-lg'>
        <DialogHeader className='text-start'>
          <DialogTitle>User Details</DialogTitle>
          <DialogDescription>
            {detail?.name ?? currentRow?.username ?? 'User overview'}
          </DialogDescription>
        </DialogHeader>

        <div className='grid grid-cols-1 gap-3 py-2'>
          {error instanceof Error ? (
            <div className='rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive'>
              {error.message}
            </div>
          ) : null}

          <DisplayField
            label='User ID'
            value={detail?.id ?? currentRow?.id ?? '-'}
          />
          <DisplayField
            label='Name'
            value={
              isPending
                ? 'Loading...'
                : detail?.name ?? currentRow?.username ?? '-'
            }
          />
          <DisplayField
            label='Email'
            value={isPending ? 'Loading...' : detail?.email ?? currentRow?.email ?? '-'}
          />
          <DisplayField
            label='Role'
            value={isPending ? 'Loading...' : detail?.role ?? '-'}
          />
          <DisplayField
            label='Status'
            value={isPending ? 'Loading...' : detail?.status ?? '-'}
          />
          <DisplayField label='Created At' value={isPending ? 'Loading...' : createdAt} />
          <DisplayField label='Updated At' value={isPending ? 'Loading...' : updatedAt} />
          <DisplayField
            label='Email Verified'
            value={isPending ? 'Loading...' : emailVerified}
          />

          {profile ? (
            <>
              <div className='mt-2 text-sm font-semibold text-muted-foreground'>
                Profile
              </div>
              <DisplayField label='Username' value={profile.username ?? '-'} />
              <DisplayField label='Phone' value={profile.phone ?? '-'} />
              <DisplayField label='Address' value={profile.address ?? '-'} />
              <DisplayField label='Gender' value={profile.gender ?? '-'} />
              <DisplayField
                label='Date of Birth'
                value={profile.dateOfBirth ?? '-'}
              />
              <DisplayField
                label='Activity'
                value={profile.activity ?? '-'}
              />
              <DisplayField
                label='Target ML'
                value={
                  profile.targetMl ?? profile.defaultTargetMl ?? '-'
                }
              />
              <DisplayField
                label='Weight'
                value={
                  profile.weight !== null && profile.weight !== undefined
                    ? `${profile.weight} kg`
                    : '-'
                }
              />
              <DisplayField
                label='Height'
                value={
                  profile.height !== null && profile.height !== undefined
                    ? `${profile.height} cm`
                    : '-'
                }
              />
            </>
          ) : null}

          {stats ? (
            <>
              <div className='mt-2 text-sm font-semibold text-muted-foreground'>
                Engagement
              </div>
              <DisplayField label='Followers' value={stats.followers.toString()} />
              <DisplayField label='Following' value={stats.following.toString()} />
              <DisplayField
                label='Muted Users'
                value={stats.mutedUsers.toString()}
              />
              <DisplayField
                label='Muting Users'
                value={stats.mutingUsers.toString()}
              />
              <DisplayField
                label='Blocked Users'
                value={stats.blockedUsers.toString()}
              />
              <DisplayField
                label='Blocked By Users'
                value={stats.blockedByUsers.toString()}
              />
              <DisplayField
                label='Sent Reports'
                value={stats.sentReports.toString()}
              />
              <DisplayField
                label='Received Reports'
                value={stats.receivedReports.toString()}
              />
              <DisplayField
                label='Alarm Events'
                value={stats.alarmEvents.toString()}
              />
              <DisplayField
                label='Daily Achievements'
                value={stats.dailyAchievements.toString()}
              />
              <DisplayField
                label='Intake Drink Logs'
                value={stats.intakeDrinkLogs.toString()}
              />
            </>
          ) : null}

          {detail ? (
            <details className='rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-sm shadow-sm transition open:shadow-sm'>
              <summary className='cursor-pointer font-medium text-muted-foreground'>
                Raw data
              </summary>
              <pre className='mt-2 max-h-60 overflow-auto rounded-md bg-background p-2 text-xs'>
                {JSON.stringify(detail.raw, null, 2)}
              </pre>
            </details>
          ) : null}
        </div>

        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
