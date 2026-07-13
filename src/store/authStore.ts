import { create } from 'zustand'
import type { DirectorLoginInput, DirectorUser } from '@shared/types/retreat'
import * as authApi from '@/services/authApi'
import {
  clearAuthToken,
  getAuthToken,
  setAuthToken,
} from '@/services/authStorage'

interface AuthState {
  user: DirectorUser | null
  token: string | null
  loading: boolean
  initialized: boolean
  error: string | null
  initialize: () => Promise<void>
  login: (input: DirectorLoginInput) => Promise<void>
  logout: () => Promise<void>
}

function getErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Falha de autenticacao'
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  loading: false,
  initialized: false,
  error: null,
  initialize: async () => {
    const token = getAuthToken()

    if (!token) {
      set({ initialized: true, user: null, token: null })
      return
    }

    set({ loading: true, error: null })

    try {
      const user = await authApi.fetchDirectorSession()
      set({
        user,
        token,
        loading: false,
        initialized: true,
        error: null,
      })
    } catch (error) {
      clearAuthToken()
      set({
        user: null,
        token: null,
        loading: false,
        initialized: true,
        error: getErrorMessage(error),
      })
    }
  },
  login: async (input) => {
    set({ loading: true, error: null })

    try {
      const session = await authApi.loginDirector(input)
      setAuthToken(session.token)
      set({
        user: session.user,
        token: session.token,
        loading: false,
        initialized: true,
        error: null,
      })
    } catch (error) {
      clearAuthToken()
      set({
        user: null,
        token: null,
        loading: false,
        initialized: true,
        error: getErrorMessage(error),
      })
      throw error
    }
  },
  logout: async () => {
    try {
      await authApi.logoutDirector()
    } finally {
      clearAuthToken()
      set({
        user: null,
        token: null,
        initialized: true,
        loading: false,
        error: null,
      })
    }
  },
}))
