import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios'
import { useUserStore } from '@/stores/user'

function showError(message: string) {
  if (typeof window !== 'undefined') {
    const event = new CustomEvent('app:toast', { detail: { type: 'error', message } })
    window.dispatchEvent(event)
  }
}

const http: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
})

http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const userStore = useUserStore()
  if (userStore.token) {
    config.headers.Authorization = `Bearer ${userStore.token}`
  }
  return config
})

http.interceptors.response.use(
  (response) => {
    const data = response.data
    if (data && typeof data === 'object' && 'code' in data) {
      if (data.code === 0 || data.code === 200) {
        return data.data
      }
      showError(data.message || '请求失败')
      return Promise.reject(data)
    }
    return data
  },
  (error) => {
    const status = error.response?.status
    const payload = error.response?.data
    if (status === 401) {
      const userStore = useUserStore()
      userStore.logout()
      showError('登录已过期，请重新登录')
    } else {
      showError(payload?.message || error.message || '网络异常')
    }
    return Promise.reject(error)
  },
)

export default http
