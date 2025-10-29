import { createFileRoute, redirect } from '@tanstack/react-router'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { useAuthStore } from '@/stores/auth-store'

export const Route = createFileRoute('/_authenticated')({
  component: AuthenticatedLayout,
  beforeLoad: ({ location }) => {
    const { auth } = useAuthStore.getState()
    const isAuthenticated = Boolean(auth.accessToken)

    if (!isAuthenticated) {
      const redirectTo = location.href ?? '/'
      throw redirect({
        to: '/sign-in',
        search: { redirect: redirectTo },
      })
    }
  },
})
