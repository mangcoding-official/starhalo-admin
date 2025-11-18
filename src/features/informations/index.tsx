import { useCallback, useEffect, useMemo } from 'react'
import { getRouteApi } from '@tanstack/react-router'
import type { SortingState } from '@tanstack/react-table'
import { toast } from 'sonner'
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { useTranslation } from '@/lib/i18n'
import { InformationsProvider } from './components/informations-provider'
import { InformationsPrimaryButtons } from './components/informations-primary-buttons'
import { InformationsTable } from './components/informations-table'
import { InformationsDialogs } from './components/informations-dialog'
import { useInformationsQuery } from './hooks/use-informations-query'

const route = getRouteApi('/_authenticated/informations/')

export function Informations() {
  const search = route.useSearch()
  const navigate = route.useNavigate()
  const { t } = useTranslation()
  const page = search.page ?? 1
  const pageSize = search.pageSize ?? 10
  const sortDirection = search.sort === 'asc' ? 'asc' : 'desc'
  const searchTerm =
    typeof search.s === 'string' && search.s.trim().length > 0 ? search.s : undefined

  const { data, isLoading, isFetching, error } = useInformationsQuery({
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

  const informations = data?.informations ?? []
  const total = data?.pagination.total ?? 0
  const pageCount =
    data?.pagination.lastPage ??
    (pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1)

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
    <InformationsProvider>
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
                      {t('info.page.title', 'Informations')}
                    </h2>
                    <p className='text-muted-foreground'>
                        {t(
                          'info.page.description',
                          "Here's a list of your informations!"
                        )}
                    </p>
                </div>
                <InformationsPrimaryButtons />
            </div>
            <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
                <InformationsTable
                  data={informations}
                  total={total}
                  pageCount={pageCount}
                  isLoading={isLoading}
                  isFetching={isFetching}
                  sorting={sorting}
                  onSortingChange={handleSortingChange}
                />
            </div>
        </Main>
        <InformationsDialogs />
    </InformationsProvider>
  )
}
