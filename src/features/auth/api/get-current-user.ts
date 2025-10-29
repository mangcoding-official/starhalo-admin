import { apiClient } from '@/lib/api-client'
import { type AuthUser } from '@/stores/auth-store'

type CurrentUserResponse = {
  data?: AuthUser
  user?: AuthUser
  message?: string
  [key: string]: unknown
}

function extractUser(response: CurrentUserResponse | undefined): AuthUser | null {
  if (!response || typeof response !== 'object') return null

  if (response.data && typeof response.data === 'object') {
    return response.data as AuthUser
  }

  if (response.user && typeof response.user === 'object') {
    return response.user as AuthUser
  }

  return null
}

export async function getCurrentUser(): Promise<AuthUser> {
  const { data } = await apiClient.get<CurrentUserResponse>('/api/auth/me')

  const user = extractUser(data)

  if (!user) {
    throw new Error(data?.message ?? 'Unable to retrieve current user.')
  }

  return user
}
