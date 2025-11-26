// Button removed; not used in simplified dashboard
import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
// TopNav omitted for simplified dashboard
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { useTranslation } from '@/lib/i18n'
// Overview and RecentSales components removed from this view for now

export function Dashboard() {
  const { t } = useTranslation()
  return (
    <>
      {/* ===== Top Heading ===== */}
      <Header>
        {/* <TopNav links={topNav} /> */}
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ConfigDrawer />
          <ProfileDropdown />
        </div>
      </Header>

      {/* ===== Main ===== */}
      <Main>
        <div className='mb-4'>
          <h1 className='text-2xl font-bold tracking-tight'>
            {t('dashboard.page.title')}
          </h1>
          <p className='text-muted-foreground'>
            {t('dashboard.page.description')}
          </p>
          {/* <div className='flex items-center space-x-2'>
            <Button>Download</Button>
          </div> */}
        </div>
        <div className='py-12'>
          <div className='max-w-3xl mx-auto text-center'>
            <h2 className='text-lg font-medium'>
              {t('dashboard.welcome.title')}
            </h2>
            {/* <p className='text-muted-foreground mt-2'>This area will show statistics later.</p> */}
          </div>
        </div>
      </Main>
    </>
  )
}

// topNav intentionally omitted while dashboard is simplified
