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
import { UsersDialogs } from './components/users-dialogs'
import { UsersProvider } from './components/users-provider'
import { UsersTable } from './components/users-table'
import { useUsersQuery } from './hooks/use-users-query'

const route = getRouteApi('/_authenticated/users/')

export function Users() {
  const search = route.useSearch()
  const navigate = route.useNavigate()

  const page = search.page ?? 1
  const pageSize = search.pageSize ?? 10
  const sort = search.sort === 'asc' ? 'asc' : 'desc'
  const usernameFilter =
    typeof search.username === 'string' && search.username.trim().length > 0
      ? search.username
      : undefined

  const { data, isLoading, isFetching, error } = useUsersQuery({
    page,
    perPage: pageSize,
    sort,
    search: usernameFilter,
  })

  useEffect(() => {
    if (error instanceof Error) {
      toast.error(error.message)
    }
  }, [error])

  const users = data?.users ?? []
  const total = data?.pagination.total ?? 0
  const pageCount =
    data?.pagination.lastPage ??
    (pageSize > 0 ? Math.max(1, Math.ceil(total / pageSize)) : 1)

  const sorting = useMemo<SortingState>(
    () => [
      {
        id: 'createdAt',
        desc: sort !== 'asc',
      },
    ],
    [sort]
  )

  const handleSortingChange = useCallback(
    (updater: SortingState | ((state: SortingState) => SortingState)) => {
      const next = typeof updater === 'function' ? updater(sorting) : updater
      const nextSort = next[0]?.desc === false ? 'asc' : 'desc'

      navigate({
        search: (prev) => ({
          ...(prev as Record<string, unknown>),
          sort: nextSort === 'desc' ? undefined : nextSort,
        }),
      })
    },
    [navigate, sorting]
  )

  return (
    <UsersProvider>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      <Main>
        <div className='mb-4 flex flex-wrap items-center justify-between space-y-2'>
          <div>
            <h2 className='text-2xl font-bold tracking-tight'>User List</h2>
            <p className='text-muted-foreground'>
              Manage your users and their roles here.
            </p>
          </div>
          {/* <UsersPrimaryButtons /> */}
        </div>
        <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
          <UsersTable
            data={users}
            total={total}
            pageCount={pageCount}
            isLoading={isLoading}
            isFetching={isFetching}
            sorting={sorting}
            onSortingChange={handleSortingChange}
            search={search}
            navigate={navigate}
          />
        </div>
      </Main>

      <UsersDialogs />
    </UsersProvider>
  )
}
