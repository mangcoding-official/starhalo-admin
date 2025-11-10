import { z } from 'zod'
import { createFileRoute, redirect } from '@tanstack/react-router'
import { SignIn } from '@/features/auth/sign-in'
import { useAuthStore } from '@/stores/auth-store'

const searchSchema = z.object({
  redirect: z.string().optional(),
})

export const Route = createFileRoute('/(auth)/sign-in')({
  component: SignIn,
  validateSearch: searchSchema,
  beforeLoad: ({ search }) => {
    const { auth } = useAuthStore.getState()
    const target = search.redirect ?? '/users'

    if (auth.user || auth.accessToken) {
      throw redirect({
        to: target,
      })
    }
  },
})
