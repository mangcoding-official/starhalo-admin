import { useEffect, useState } from 'react'
import {
  createFileRoute,
  Link,
  useNavigate,
  useRouter,
} from '@tanstack/react-router'
import { SignedIn, useAuth, UserButton } from '@clerk/clerk-react'
import { ExternalLink, Loader2 } from 'lucide-react'
import { ClerkLogo } from '@/assets/clerk-logo'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { LearnMore } from '@/components/learn-more'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { UsersDialogs } from '@/features/users/components/users-dialogs'
import { UsersPrimaryButtons } from '@/features/users/components/users-primary-buttons'
import { UsersProvider } from '@/features/users/components/users-provider'
import { UsersTable } from '@/features/users/components/users-table'
import { users } from '@/features/users/data/users'
import { useTranslation } from '@/lib/i18n'

export const Route = createFileRoute('/clerk/_authenticated/user-management')({
  component: UserManagement,
})

function UserManagement() {
  const { t } = useTranslation()
  const search = Route.useSearch()
  const navigate = Route.useNavigate()

  const [opened, setOpened] = useState(true)
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) {
    return (
      <div className='flex h-svh items-center justify-center'>
        <Loader2 className='size-8 animate-spin' />
      </div>
    )
  }

  if (!isSignedIn) {
    return <Unauthorized />
  }

  return (
    <>
      <SignedIn>
        <UsersProvider>
          <Header fixed>
            <Search />
            <div className='ms-auto flex items-center space-x-4'>
              <ThemeSwitch />
              <UserButton />
            </div>
          </Header>

          <Main>
            <div className='mb-2 flex flex-wrap items-center justify-between space-y-2'>
              <div>
                <h2 className='text-2xl font-bold tracking-tight'>
                  {t('clerk.userManagement.title')}
                </h2>
                <div className='flex gap-1'>
                  <p className='text-muted-foreground'>
                    {t('clerk.userManagement.description')}
                  </p>
                  <LearnMore
                    open={opened}
                    onOpenChange={setOpened}
                    contentProps={{ side: 'right' }}
                  >
                    <p>
                      {t('clerk.userManagement.learnMore.description1')}
                      <Link
                        to='/users'
                        className='text-blue-500 underline decoration-dashed underline-offset-2'
                      >
                        '/users'
                      </Link>
                    </p>

                    <p className='mt-4'>
                      {t('clerk.userManagement.learnMore.description2')}
                      <ExternalLink className='inline-block size-4' />
                    </p>
                  </LearnMore>
                </div>
              </div>
              <UsersPrimaryButtons />
            </div>
            <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
              <UsersTable data={users} navigate={navigate} search={search} />
            </div>
          </Main>

          <UsersDialogs />
        </UsersProvider>
      </SignedIn>
    </>
  )
}

const COUNTDOWN = 5 // Countdown second

function Unauthorized() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { history } = useRouter()

  const [opened, setOpened] = useState(true)
  const [cancelled, setCancelled] = useState(false)
  const [countdown, setCountdown] = useState(COUNTDOWN)

  // Set and run the countdown conditionally
  useEffect(() => {
    if (cancelled || opened) return
    const interval = setInterval(() => {
      setCountdown((prev) => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(interval)
  }, [cancelled, opened])

  // Navigate to sign-in page when countdown hits 0
  useEffect(() => {
    if (countdown > 0) return
    navigate({ to: '/clerk/sign-in' })
  }, [countdown, navigate])

  return (
    <div className='h-svh'>
      <div className='m-auto flex h-full w-full flex-col items-center justify-center gap-2'>
        <h1 className='text-[7rem] leading-tight font-bold'>401</h1>
        <span className='font-medium'>{t('clerk.unauthorized.title')}</span>
        <p className='text-muted-foreground text-center'>
          {t('clerk.unauthorized.description')}
          <sup>
            <LearnMore open={opened} onOpenChange={setOpened}>
              <p>
                {t('clerk.unauthorized.learnMore.description1')}
                <Link
                  to='/users'
                  className='text-blue-500 underline decoration-dashed underline-offset-2'
                >
                  '/users'
                </Link>
                .
              </p>
              <p>{t('clerk.unauthorized.learnMore.description2')}</p>

              <p className='mt-4'>
                {t('clerk.unauthorized.learnMore.description3')}
              </p>
            </LearnMore>
          </sup>
          <br />
          to access this resource.
        </p>
        <div className='mt-6 flex gap-4'>
          <Button variant='outline' onClick={() => history.go(-1)}>
            {t('clerk.unauthorized.goBackBtn')}
          </Button>
          <Button onClick={() => navigate({ to: '/clerk/sign-in' })}>
            <ClerkLogo className='invert' />{' '}
            {t('clerk.unauthorized.signInBtn')}
          </Button>
        </div>
        {/* <div className='mt-4 h-8 text-center'>
          {!cancelled && !opened && (
            <>
              <p>
                {countdown > 0
                  ? t('clerk.unauthorized.redirectMessage', { countdown })
                  : t('clerk.unauthorized.redirecting')}
              </p>
              <Button variant='link' onClick={() => setCancelled(true)}>
                {t('clerk.unauthorized.cancelRedirectBtn')}
              </Button>
            </>
          )}
        </div> */}
      </div>
    </div>
  )
}
