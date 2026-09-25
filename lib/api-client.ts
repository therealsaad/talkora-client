const configuredApiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1'
const API_BASE = /^[a-z][a-z\d+.-]*:\/\//i.test(configuredApiBase)
  ? configuredApiBase
  : `${/^localhost(?::|\/|$)|^127\.0\.0\.1(?::|\/|$)/i.test(configuredApiBase) ? 'http' : 'https'}://${configuredApiBase}`
  //'https://talkora-s-backend-production.up.railway.app/api/v1'

export function getApiUrl(endpoint: string): string {
  return endpoint.startsWith('http')
    ? endpoint
    : `${API_BASE.replace(/\/$/, '')}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
}

type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: { code?: string; message?: string; details?: unknown }
}

export class ApiError extends Error {
  constructor(public message: string, public code: string, public status: number, public details?: unknown) {
    super(message)
    this.name = 'ApiError'
  }
}

const TOKEN_KEY = 'talkora_token'
const USER_KEY = 'talkora_user'
export const AUTH_INVALIDATED_EVENT = 'talkora:auth-invalidated'

export function getStoredToken(): string | null {
  return typeof window === 'undefined' ? null : window.localStorage.getItem(TOKEN_KEY)
}

export function setStoredToken(token: string): void {
  if (typeof window !== 'undefined') window.localStorage.setItem(TOKEN_KEY, token)
}

export function clearStoredToken(): void {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(TOKEN_KEY)
    window.localStorage.removeItem(USER_KEY)
  }
}

export function handleUnauthorizedResponse(status: number): void {
  if (status !== 401 || !getStoredToken() || typeof window === 'undefined') return
  clearStoredToken()
  window.dispatchEvent(new Event(AUTH_INVALIDATED_EVENT))
}

export function setStoredUser<T>(user: T): void {
  if (typeof window !== 'undefined') window.localStorage.setItem(USER_KEY, JSON.stringify(user))
}

export function getStoredUser<T = any>(): T | null {
  if (typeof window === 'undefined') return null
  const stored = window.localStorage.getItem(USER_KEY)
  if (!stored) return null
  try { return JSON.parse(stored) as T } catch { return null }
}

export async function apiClient<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getStoredToken()
  const isFormData = typeof FormData !== 'undefined' && options.body instanceof FormData

  const headers: Record<string, string> = { ...(options.headers as Record<string, string>) }
  if (!isFormData && !headers['Content-Type']) headers['Content-Type'] = 'application/json'

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const url = getApiUrl(endpoint)

  const res = await fetch(url, {
    ...options,
    cache: options.cache ?? 'no-store',
    headers,
  })

  const contentType = res.headers.get('content-type') || ''
  let data: ApiResponse<T>
  if (contentType.includes('application/json')) {
    data = await res.json().catch(() => ({
      success: false,
      error: { code: 'INVALID_JSON', message: 'Received invalid JSON from server' },
    }))
  } else {
    const text = await res.text().catch(() => '')
    data = {
      success: false,
      error: {
        code: res.ok ? 'INVALID_RESPONSE' : 'NON_JSON_RESPONSE',
        message: text.replace(/\s+/g, ' ').trim().slice(0, 240) || `Request failed with status ${res.status}`,
      },
    }
  }

  if (!res.ok || !data.success) {
    handleUnauthorizedResponse(res.status)

    throw new ApiError(
      data.error?.message || `Request failed with status ${res.status}`,
      data.error?.code || 'REQUEST_FAILED',
      res.status,
      data.error?.details
    )
  }

  return data.data as T
}
