import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useTranslation } from '@/lib/i18n'
import { usePushNotifications } from './notifications-provider'

export function PushNotificationsPrimaryButtons() {
  const { setOpen } = usePushNotifications()
  const { t } = useTranslation()
  return (
    <div className='flex gap-2'>
      <Button className='space-x-1' onClick={() => setOpen('create')}>
        <span>{t('push.buttons.create', 'Create')}</span> <Plus size={18} />
      </Button>
    </div>
  )
}
