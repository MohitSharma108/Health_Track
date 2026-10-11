import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
})

// Auto-attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nourish_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// Auto-handle 401
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('nourish_token')
      localStorage.removeItem('nourish_user')
      window.location.href = '/auth'
    }
    const msg = err.response?.data?.error || err.message || 'Something went wrong'
    return Promise.reject(new Error(msg))
  }
)

export default api
