// import { Link } from '@tanstack/react-router'
import useDialogState from '@/hooks/use-dialog-state'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { SignOutDialog } from '@/components/sign-out-dialog'
import { useAuthStore } from '@/stores/auth-store'
import { useCurrentUser } from '@/features/auth/hooks/use-current-user'

function getInitials(name?: string | null) {
  if (!name) return 'NA'

  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'NA'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()

  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function ProfileDropdown() {
  const [open, setOpen] = useDialogState()
  const storedUser = useAuthStore((state) => state.auth.user)
  const { data: currentUser, isLoading, isFetching } = useCurrentUser()

  const user = currentUser ?? storedUser

  const displayName =
    user?.name ??
    (typeof user?.profile === 'object' ? user?.profile?.username : undefined) ??
    'Authenticated User'
  const displayEmail = user?.email ?? 'Signed in'
  const avatarUrl =
    (typeof user?.profile === 'object' ? user?.profile?.avatar ?? undefined : undefined) ??
    (user as { avatar?: string | null } | undefined)?.avatar ??
    undefined
  const normalizedAvatarUrl =
    typeof avatarUrl === 'string' && avatarUrl.trim().length > 0
      ? avatarUrl
      : undefined
  const initials = getInitials(displayName)
  const loading = isLoading || isFetching

  return (
    <>
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
            <Avatar className='h-8 w-8'>
              {normalizedAvatarUrl ? (
                <AvatarImage
                  src={normalizedAvatarUrl}
                  alt={displayName ?? 'Profile avatar'}
                />
              ) : null}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className='w-56' align='end' forceMount>
          <DropdownMenuLabel className='font-normal'>
            <div className='flex flex-col gap-1.5'>
              <p className='text-sm leading-none font-medium'>
                {loading ? 'Loading...' : displayName}
              </p>
              <p className='text-muted-foreground text-xs leading-none'>
                {loading ? 'Fetching account details' : displayEmail}
              </p>
            </div>
          </DropdownMenuLabel>
          {/* <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem asChild>
              <Link to='/settings'>
                Profile
                <DropdownMenuShortcut>⇧⌘P</DropdownMenuShortcut>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to='/settings'>
                Billing
                <DropdownMenuShortcut>⌘B</DropdownMenuShortcut>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to='/settings'>
                Settings
                <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem>New Team</DropdownMenuItem>
          </DropdownMenuGroup> */}
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setOpen(true)}>
            Sign out
            <DropdownMenuShortcut>⇧⌘Q</DropdownMenuShortcut>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <SignOutDialog open={!!open} onOpenChange={setOpen} />
    </>
  )
}
