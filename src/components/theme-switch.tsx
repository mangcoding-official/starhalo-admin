import { useEffect } from 'react'
import { Check, Moon, Sun } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useTheme } from '@/context/theme-provider'
import { useTranslation } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export function ThemeSwitch() {
  const { theme, setTheme } = useTheme()
  const { t } = useTranslation()
  const options = [
    { value: 'light', label: t('theme.option.light', 'Light') },
    { value: 'dark', label: t('theme.option.dark', 'Dark') },
    { value: 'system', label: t('theme.option.system', 'System') },
  ] as const
  const toggleLabel = t('theme.toggle.label', 'Toggle theme')

  /* Update theme-color meta tag
   * when theme is updated */
  useEffect(() => {
    const themeColor = theme === 'dark' ? '#020817' : '#fff'
    const metaThemeColor = document.querySelector("meta[name='theme-color']")
    if (metaThemeColor) metaThemeColor.setAttribute('content', themeColor)
  }, [theme])

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' size='icon' className='scale-95 rounded-full'>
          <Sun className='size-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90' />
          <Moon className='absolute size-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0' />
          <span className='sr-only'>{toggleLabel}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end'>
        {options.map((option) => (
          <DropdownMenuItem
            key={option.value}
            onClick={() => setTheme(option.value)}
          >
            {option.label}
            <Check
              size={14}
              className={cn('ms-auto', theme !== option.value && 'hidden')}
            />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
