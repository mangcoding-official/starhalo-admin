import axios, { AxiosHeaders, type AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { useAuthStore, type AuthSession } from '@/stores/auth-store'

const rawBaseUrl =
  import.meta.env.VITE_API_BASE_URL?.trim() || 'https://starhalo.mangcoding.com'
const baseURL = rawBaseUrl.replace(/\/+$/, '')

type TokenResponse = {
  access_token?: string
  refresh_token?: string
  token_type?: string
  expires_in?: number | string
  data?: TokenResponse
  message?: string
  [key: string]: unknown
}

const refreshClient = axios.create({
  baseURL,
  headers: new AxiosHeaders({ Accept: 'application/json' }),
})

let refreshPromise: Promise<AuthSession | null> | null = null

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function parseExpiresAt(expiresIn: unknown): number | null {
  const numeric =
    typeof expiresIn === 'number'
      ? expiresIn
      : typeof expiresIn === 'string'
        ? Number(expiresIn)
        : NaN

  if (!Number.isFinite(numeric) || numeric <= 0) {
    return null
  }

  return Date.now() + numeric * 1000
}

function extractSessionFromPayload(payload: unknown): AuthSession | null {
  if (!isRecord(payload)) return null

  const tokenPayload = isRecord(payload.data) ? payload.data : payload

  const accessToken =
    typeof tokenPayload.access_token === 'string'
      ? tokenPayload.access_token
      : typeof payload.access_token === 'string'
        ? payload.access_token
        : null

  if (!accessToken) {
    return null
  }

  const refreshToken =
    typeof tokenPayload.refresh_token === 'string'
      ? tokenPayload.refresh_token
      : typeof payload.refresh_token === 'string'
        ? payload.refresh_token
        : null

  const tokenType =
    typeof tokenPayload.token_type === 'string'
      ? tokenPayload.token_type
      : typeof payload.token_type === 'string'
        ? payload.token_type
        : null

  const expiresAt =
    parseExpiresAt(tokenPayload.expires_in ?? payload.expires_in) ?? null

  return {
    accessToken,
    refreshToken,
    tokenType,
    expiresAt,
  }
}

async function refreshAccessToken(): Promise<AuthSession | null> {
  const { auth } = useAuthStore.getState()

  if (!auth.refreshToken) {
    return null
  }

  if (!refreshPromise) {
    refreshPromise = refreshClient
      .post<TokenResponse>('/api/auth/admin/refresh', {
        refresh_token: auth.refreshToken,
      })
      .then(({ data }) => {
        const session = extractSessionFromPayload(data)

        if (!session?.accessToken) {
          throw new Error(
            data?.message ?? 'Unable to refresh authentication token.'
          )
        }

        const fallbackExpiresAt =
          auth.expiresAt && auth.expiresAt > Date.now()
            ? auth.expiresAt
            : null

        const nextSession: AuthSession = {
          accessToken: session.accessToken,
          refreshToken: session.refreshToken ?? auth.refreshToken,
          tokenType: session.tokenType ?? auth.tokenType ?? 'Bearer',
          expiresAt: session.expiresAt ?? fallbackExpiresAt,
        }

        useAuthStore.getState().auth.setSession(nextSession)

        return nextSession
      })
      .catch((error) => {
        useAuthStore.getState().auth.reset()
        throw error
      })
      .finally(() => {
        refreshPromise = null
      })
  }

  return refreshPromise
}

async function ensureValidSession() {
  const { auth } = useAuthStore.getState()

  if (!auth.accessToken) return

  if (
    auth.expiresAt &&
    auth.expiresAt > 0 &&
    auth.expiresAt - Date.now() <= 5_000
  ) {
    await refreshAccessToken()
  }
}

export const apiClient = axios.create({
  baseURL,
  headers: new AxiosHeaders({ Accept: 'application/json' }),
})

declare module 'axios' {
  interface InternalAxiosRequestConfig {
    _retry?: boolean
  }
}

apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    await ensureValidSession()

    const { auth } = useAuthStore.getState()
    const token = auth.accessToken

    if (token) {
      const headers = (config.headers ||= new AxiosHeaders(config.headers))
      headers.set(
        'Authorization',
        `${auth.tokenType ?? 'Bearer'} ${token}`.trim()
      )
    }

    return config
  }
)

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const status = error.response?.status
    const originalRequest = error.config as InternalAxiosRequestConfig | undefined

    const requestUrl = originalRequest?.url ?? ''
    const isAuthEndpoint =
      typeof requestUrl === 'string' &&
      (/\/api\/auth\/admin\/(login|refresh)/.test(requestUrl) ||
        requestUrl.endsWith('/api/auth/admin/login') ||
        requestUrl.endsWith('/api/auth/admin/refresh'))

    if (
      status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      originalRequest._retry = true

      try {
        await refreshAccessToken()

        const { auth } = useAuthStore.getState()

        if (auth.accessToken) {
          const headers = (originalRequest.headers ||= new AxiosHeaders(
            originalRequest.headers
          ))
          headers.set(
            'Authorization',
            `${auth.tokenType ?? 'Bearer'} ${auth.accessToken}`.trim()
          )

          return apiClient.request(originalRequest)
        }
      } catch (refreshError) {
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)
