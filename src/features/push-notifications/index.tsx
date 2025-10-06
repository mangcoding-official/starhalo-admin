import { ConfigDrawer } from '@/components/config-drawer'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { PushNotificationProvider } from './components/notifications-provider'
import { InformationsPrimaryButtons } from './components/notifications-primary-buttons'
import { PushNotificationsTable } from './components/notifications-table'
import { InformationsDialogs } from './components/notifications-dialog'
import { notifications } from './data/notifications'

export function pushNotifications() {
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
                    <h2 className='text-2xl font-bold tracking-tight'>Push Notifications</h2>
                    <p className='text-muted-foreground'>
                        Here&apos;s a list of your push notifications!
                    </p>
                </div>
                <InformationsPrimaryButtons />
            </div>
            <div className='-mx-4 flex-1 overflow-auto px-4 py-1 lg:flex-row lg:space-y-0 lg:space-x-12'>
                <PushNotificationsTable data={notifications}/>
            </div>
        </Main>
        <InformationsDialogs />
    </PushNotificationProvider>
  )
}
