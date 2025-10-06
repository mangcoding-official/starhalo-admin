import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { InformationsProvider } from './components/informations-provider'
import { InformationsPrimaryButtons } from './components/informations-primary-buttons'
import { InformationsTable } from './components/informations-table'
import { informations } from './data/informations'
import { InformationsDialogs } from './components/informations-dialog'

export function Informations() {
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
                    <h2 className='text-2xl font-bold tracking-tight'>Informations</h2>
                    <p className='text-muted-foreground'>
                        Here&apos;s a list of your informations!
                    </p>
                </div>
                <InformationsPrimaryButtons />
            </div>
            <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
                <InformationsTable data={informations}/>
            </div>
        </Main>
        <InformationsDialogs />
    </InformationsProvider>
  )
}
