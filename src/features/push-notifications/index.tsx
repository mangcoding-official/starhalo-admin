import { useCallback, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { getRouteApi } from '@tanstack/react-router'
import type { SortingState } from '@tanstack/react-table'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { useTranslation } from '@/lib/i18n'
import { PushNotificationProvider } from './components/notifications-provider'
import { PushNotificationsPrimaryButtons } from './components/notifications-primary-buttons'
import { PushNotificationsTable } from './components/notifications-table'
import { PushNotificationsDialogs } from './components/notifications-dialog'
import { usePushNotificationsQuery } from './hooks/use-push-notifications-query'

const route = getRouteApi('/_authenticated/push-notifications/')

export function PushNotifications() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const { t } = useTranslation()

  const page = search.page ?? 1
  const pageSize = search.pageSize ?? 10
  const sortDirection = search.sort === 'asc' ? 'asc' : 'desc'
  const searchTerm =
    typeof search.s === 'string' && search.s.trim().length > 0 ? search.s : undefined

  const {
    data,
    isLoading,
    isFetching,
    error,
  } = usePushNotificationsQuery({
    page,
    perPage: pageSize,
    sort: sortDirection,
    search: searchTerm,
  })

  useEffect(() => {
    if (error instanceof Error) {
      toast.error(error.message)
    }
  }, [error])

  const notifications = data?.notifications ?? []
  const total = data?.pagination.total ?? 0
  const pageCount = useMemo(() => {
    if (data?.pagination.lastPage && data.pagination.lastPage > 0) {
      return data.pagination.lastPage
    }
    if (pageSize > 0) {
      return Math.max(1, Math.ceil(total / pageSize))
    }
    return 1
  }, [data?.pagination.lastPage, total, pageSize])

  const sorting = useMemo<SortingState>(
    () => [
      {
        id: 'createdAt',
        desc: sortDirection !== 'asc',
      },
    ],
    [sortDirection]
  )

  const handleSortingChange = useCallback(
    (updater: SortingState | ((state: SortingState) => SortingState)) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater
      const primary = next[0]
      const nextDirection = primary?.desc === false ? 'asc' : 'desc'

      navigate({
        search: (prev) => ({
          ...(prev as Record<string, unknown>),
          page: undefined,
          sort: nextDirection === 'desc' ? undefined : nextDirection,
        }),
      })
    },
    [navigate, sorting]
  )

  return (
    <PushNotificationProvider>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>
      <Main>
        <div className='mb-2 flex flex-wrap items-center justify-between space-y-2 gap-x-4'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>
              {t('push.page.title', 'Push Notifications')}
            </h2>
            <p className='text-muted-foreground'>
              {t(
                'push.page.description',
                "Here's a list of your push notifications!"
              )}
            </p>
          </div>
          <PushNotificationsPrimaryButtons />
        </div>
        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
          <PushNotificationsTable
            data={notifications}
            total={total}
            pageCount={pageCount}
            isLoading={isLoading}
            isFetching={isFetching}
            sorting={sorting}
            onSortingChange={handleSortingChange}
          />
        </div>
      </Main>
      <PushNotificationsDialogs />
    </PushNotificationProvider>
  )
}
