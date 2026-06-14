import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi, userApi, type User, type AuthResponse } from '@/api'

const TOKEN_KEY = 'jiaoyou_token'
const USER_KEY = 'jiaoyou_user'

export const useUserStore = defineStore('user', () => {
  const token = ref<string | null>(localStorage.getItem(TOKEN_KEY))
  const user = ref<User | null>(
    (() => {
      const raw = localStorage.getItem(USER_KEY)
      return raw ? (JSON.parse(raw) as User) : null
    })(),
  )

  const isLoggedIn = computed(() => !!token.value)

  function setAuth(t: string, u: User) {
    token.value = t
    user.value = u
    localStorage.setItem(TOKEN_KEY, t)
    localStorage.setItem(USER_KEY, JSON.stringify(u))
  }

  function setUser(u: User) {
    user.value = u
    localStorage.setItem(USER_KEY, JSON.stringify(u))
  }

  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem(TOKEN_KEY)
    localStorage.removeItem(USER_KEY)
  }

  function applyAuth(res: AuthResponse) {
    const profile: User = {
      id: res.user.id,
      nickname: res.user.nickname || `用户${res.user.id}`,
      avatar: res.user.avatar || '',
      gender: 0,
    }
    setAuth(res.token, profile)
  }

  async function login(phone: string, password: string) {
    const res = await authApi.login({ phone, password })
    applyAuth(res)
    await fetchProfile()
    return res
  }

  async function register(payload: { phone: string; email?: string; password: string }) {
    const res = await authApi.register(payload)
    applyAuth(res)
    await fetchProfile()
    return res
  }

  async function fetchProfile() {
    if (!token.value) return null
    try {
      const profile = await userApi.me()
      setUser(profile)
      return profile
    } catch {
      return null
    }
  }

  return {
    token,
    user,
    isLoggedIn,
    setAuth,
    setUser,
    logout,
    login,
    register,
    fetchProfile,
  }
})
