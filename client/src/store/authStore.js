import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@/lib/api'

const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (email, password) => {
        set({ isLoading: true, error: null })
        try {
          const data = await api.post('/auth/login', { email, password })
          const { token, user } = data
          localStorage.setItem('nourish_token', token)
          set({ token, user, isAuthenticated: true, isLoading: false })
          return { success: true }
        } catch (e) {
          set({ isLoading: false, error: e.message })
          return { success: false, error: e.message }
        }
      },

      register: async (payload) => {
        set({ isLoading: true, error: null })
        try {
          const data = await api.post('/auth/register', payload)
          const { token, user } = data
          localStorage.setItem('nourish_token', token)
          set({ token, user, isAuthenticated: true, isLoading: false })
          return { success: true }
        } catch (e) {
          set({ isLoading: false, error: e.message })
          return { success: false, error: e.message }
        }
      },

      logout: () => {
        localStorage.removeItem('nourish_token')
        set({ user: null, token: null, isAuthenticated: false })
      },

      updateUser: (updates) =>
        set((s) => ({ user: { ...s.user, ...updates } })),

      clearError: () => set({ error: null }),
    }),
    {
      name: 'nourish-auth',
      partialize: (s) => ({ user: s.user, token: s.token, isAuthenticated: s.isAuthenticated }),
    }
  )
)

export default useAuthStore
