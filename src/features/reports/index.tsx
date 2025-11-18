import { useCallback, useEffect, useMemo } from 'react'
import { toast } from 'sonner'
import { getRouteApi } from '@tanstack/react-router'
import type { SortingState } from '@tanstack/react-table'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ConfigDrawer } from '@/components/config-drawer'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { useTranslation } from '@/lib/i18n'
import { ReportsProvider } from './components/reports-provider'
import { ReportsTable } from './components/reports-table'
import { useReportsQuery } from './hooks/use-reports-query'
import { ReportsDialogs } from './components/reports-dialogs'

const route = getRouteApi('/_authenticated/reports/')

export function Reports() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const { t } = useTranslation()
  const page = search.page ?? 1
  const pageSize = search.pageSize ?? 10
  const searchTerm = typeof search.s === 'string' && search.s.trim().length > 0 ? search.s : undefined
  const statusFilter = typeof search.status === 'string' && search.status.trim().length > 0 ? search.status : undefined

  const sortDirection = search.sort === 'asc' ? 'asc' : 'desc'

  const { data, error, isLoading, isFetching } = useReportsQuery({
    page,
    perPage: pageSize,
    search: searchTerm,
    status: statusFilter,
    sort: sortDirection,
  })

  useEffect(() => {
    if (error instanceof Error) {
      toast.error(error.message)
    }
  }, [error])

  const reports = data?.reports ?? []
  const total = data?.pagination.total ?? 0
  const pageCount =
    data?.pagination.lastPage ??
    (pageSize > 0 ? Math.max(1, Math.ceil(total / (pageSize || 1))) : 1)

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
    <ReportsProvider>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>
      <Main>
        <div className='mb-2 flex flex-wrap items-center justify-between gap-4'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>
              {t('reports.page.title', 'Reports')}
            </h2>
            <p className='text-muted-foreground'>
              {t('reports.page.description', 'Review and resolve user reports.')}
            </p>
          </div>
        </div>
        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-x-12 lg:space-y-0'>
          <ReportsTable
            data={reports}
            total={total}
            pageCount={pageCount}
            isLoading={isLoading}
            isFetching={isFetching}
            sorting={sorting}
            onSortingChange={handleSortingChange}
          />
        </div>
      </Main>
      <ReportsDialogs />
    </ReportsProvider>
  )
}
