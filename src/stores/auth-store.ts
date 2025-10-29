import { create } from 'zustand'
import { getCookie, setCookie, removeCookie } from '@/lib/cookies'

const ACCESS_TOKEN = 'thisisjustarandomstring'

export interface AuthRole {
  id: number
  name: string
  guard_name: string
  created_at?: string
  updated_at?: string
  pivot?: Record<string, unknown>
}

export interface AuthProfile {
  id: number
  user_id: number
  username: string | null
  phone: string | null
  address: string | null
  avatar?: string | null
  gender?: string | null
  [key: string]: unknown
}

export interface AuthUser {
  id: number
  name: string
  email: string
  email_verified_at?: string | null
  role?: string | null
  roles?: AuthRole[] | null
  profile?: AuthProfile | null
  created_at?: string
  updated_at?: string
  [key: string]: unknown
}

export interface AuthSession {
  accessToken: string
  refreshToken?: string | null
  tokenType?: string | null
  expiresAt?: number | null
}

interface AuthState {
  auth: {
    user: AuthUser | null
    setUser: (user: AuthUser | null) => void
    accessToken: string
    refreshToken: string | null
    tokenType: string | null
    expiresAt: number | null
    setAccessToken: (accessToken: string) => void
    setSession: (session: AuthSession) => void
    resetAccessToken: () => void
    reset: () => void
  }
}

function parseStoredSession(cookieState: string | null): AuthSession {
  if (!cookieState) {
    return {
      accessToken: '',
      refreshToken: null,
      tokenType: null,
      expiresAt: null,
    }
  }

  try {
    const parsed = JSON.parse(cookieState)

    if (typeof parsed === 'string') {
      return {
        accessToken: parsed,
        refreshToken: null,
        tokenType: null,
        expiresAt: null,
      }
    }

    if (parsed && typeof parsed === 'object') {
      return {
        accessToken:
          typeof parsed.accessToken === 'string' ? parsed.accessToken : '',
        refreshToken:
          typeof parsed.refreshToken === 'string'
            ? parsed.refreshToken
            : null,
        tokenType:
          typeof parsed.tokenType === 'string' ? parsed.tokenType : null,
        expiresAt:
          typeof parsed.expiresAt === 'number' ? parsed.expiresAt : null,
      }
    }
  } catch (_error) {
    // Ignore malformed session cookie
  }

  return {
    accessToken: '',
    refreshToken: null,
    tokenType: null,
    expiresAt: null,
  }
}

function persistSession(session: AuthSession) {
  setCookie(ACCESS_TOKEN, JSON.stringify(session))
}

export const useAuthStore = create<AuthState>()((set) => {
  const storedSession = parseStoredSession(getCookie(ACCESS_TOKEN) || null)

  return {
    auth: {
      user: null,
      setUser: (user) =>
        set((state) => ({ ...state, auth: { ...state.auth, user } })),
      accessToken: storedSession.accessToken,
      refreshToken: storedSession.refreshToken ?? null,
      tokenType: storedSession.tokenType ?? null,
      expiresAt: storedSession.expiresAt ?? null,
      setAccessToken: (accessToken) =>
        set((state) => {
          const nextSession: AuthSession = {
            accessToken,
            refreshToken: state.auth.refreshToken,
            tokenType: state.auth.tokenType,
            expiresAt: state.auth.expiresAt,
          }
          persistSession(nextSession)
          return { ...state, auth: { ...state.auth, ...nextSession } }
        }),
      setSession: (session) =>
        set((state) => {
          const nextSession: AuthSession = {
            accessToken: session.accessToken,
            refreshToken: session.refreshToken ?? null,
            tokenType: session.tokenType ?? null,
            expiresAt: session.expiresAt ?? null,
          }
          persistSession(nextSession)
          return { ...state, auth: { ...state.auth, ...nextSession } }
        }),
      resetAccessToken: () =>
        set((state) => {
          removeCookie(ACCESS_TOKEN)
          return {
            ...state,
            auth: {
              ...state.auth,
              accessToken: '',
              refreshToken: null,
              tokenType: null,
              expiresAt: null,
            },
          }
        }),
      reset: () =>
        set((state) => {
          removeCookie(ACCESS_TOKEN)
          return {
            ...state,
            auth: {
              ...state.auth,
              user: null,
              accessToken: '',
              refreshToken: null,
              tokenType: null,
              expiresAt: null,
            },
          }
        }),
    },
  }
})
