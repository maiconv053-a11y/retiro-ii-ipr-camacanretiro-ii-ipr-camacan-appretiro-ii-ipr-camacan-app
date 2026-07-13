import type {
  DirectorLoginInput,
  DirectorSession,
  DirectorUser,
} from '@shared/types/retreat'
import { getAuthToken } from '@/services/authStorage'

interface ApiResponse<T> {
  success: boolean
  data: T
  error?: string
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

async function authRequest<T>(path: string, init?: RequestInit, withToken = false): Promise<T> {
  const token = withToken ? getAuthToken() : null
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers ?? {}),
    },
    ...init,
  })

  const payload = (await response.json()) as ApiResponse<T>

  if (!response.ok || !payload.success) {
    throw new Error(payload.error ?? 'Falha na autenticacao')
  }

  return payload.data
}

export function loginDirector(input: DirectorLoginInput) {
  return authRequest<DirectorSession>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(input),
  })
}

export function fetchDirectorSession() {
  return authRequest<DirectorUser>('/api/auth/me', undefined, true)
}

export function logoutDirector() {
  return authRequest<{ loggedOut: boolean }>(
    '/api/auth/logout',
    {
      method: 'POST',
    },
    true,
  )
}
