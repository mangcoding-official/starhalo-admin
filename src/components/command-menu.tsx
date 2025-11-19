import React from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ArrowRight, ChevronRight, Laptop, Moon, Sun } from 'lucide-react'
import { useSearch } from '@/context/search-provider'
import { useTheme } from '@/context/theme-provider'
import { useTranslation } from '@/lib/i18n'
import type { TranslationKey } from '@/locales'
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command'
import { sidebarData } from './layout/data/sidebar-data'
import { ScrollArea } from './ui/scroll-area'

export function CommandMenu() {
  const navigate = useNavigate()
  const { setTheme } = useTheme()
  const { open, setOpen } = useSearch()
  const { t } = useTranslation()

  const placeholder = t(
    'command.placeholder',
    'Type a command or search...'
  )
  const emptyStateLabel = t('command.noResults', 'No results found.')
  const themeHeading = t('command.theme.heading', 'Theme')
  const themeOptions = {
    light: t('command.theme.light', 'Light'),
    dark: t('command.theme.dark', 'Dark'),
    system: t('command.theme.system', 'System'),
  }

  const runCommand = React.useCallback(
    (command: () => unknown) => {
      setOpen(false)
      command()
    },
    [setOpen]
  )

  return (
    <CommandDialog modal open={open} onOpenChange={setOpen}>
      <CommandInput placeholder={placeholder} />
      <CommandList>
        <ScrollArea type='hover' className='h-72 pe-1'>
          <CommandEmpty>{emptyStateLabel}</CommandEmpty>
          {sidebarData.navGroups.map((group) => {
            const groupHeading = t(group.title as TranslationKey, group.title)
            return (
              <CommandGroup key={group.title} heading={groupHeading}>
                {group.items.map((navItem, i) => {
                  const navTitle = t(
                    navItem.title as TranslationKey,
                    navItem.title
                  )

                  if (navItem.url)
                    return (
                      <CommandItem
                        key={`${navItem.url}-${i}`}
                        value={`${navItem.title}-${navTitle}`}
                        onSelect={() => {
                          runCommand(() => navigate({ to: navItem.url }))
                        }}
                      >
                        <div className='flex size-4 items-center justify-center'>
                          <ArrowRight className='text-muted-foreground/80 size-2' />
                        </div>
                        {navTitle}
                      </CommandItem>
                    )

                  return navItem.items?.map((subItem, index) => {
                    const subTitle = t(
                      subItem.title as TranslationKey,
                      subItem.title
                    )
                    return (
                      <CommandItem
                        key={`${navItem.title}-${subItem.url}-${index}`}
                        value={`${navItem.title}-${subItem.url}-${navTitle}-${subTitle}`}
                        onSelect={() => {
                          runCommand(() => navigate({ to: subItem.url }))
                        }}
                      >
                        <div className='flex size-4 items-center justify-center'>
                          <ArrowRight className='text-muted-foreground/80 size-2' />
                        </div>
                        {navTitle} <ChevronRight /> {subTitle}
                      </CommandItem>
                    )
                  })
                })}
              </CommandGroup>
            )
          })}
          <CommandSeparator />
          <CommandGroup heading={themeHeading}>
            <CommandItem onSelect={() => runCommand(() => setTheme('light'))}>
              <Sun /> <span>{themeOptions.light}</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme('dark'))}>
              <Moon className='scale-90' />
              <span>{themeOptions.dark}</span>
            </CommandItem>
            <CommandItem onSelect={() => runCommand(() => setTheme('system'))}>
              <Laptop />
              <span>{themeOptions.system}</span>
            </CommandItem>
          </CommandGroup>
        </ScrollArea>
      </CommandList>
    </CommandDialog>
  )
}
