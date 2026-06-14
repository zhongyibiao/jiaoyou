import http from './http'

export type Gender = 0 | 1 | 2

export interface User {
  id: number
  nickname: string
  avatar: string
  gender: Gender
  birthday?: string
  bio?: string
  province?: string
  city?: string
  interests?: string[]
  last_active?: string
  online?: boolean
  age?: number
}

export interface AuthUser {
  id: number
  phone: string
  email?: string
  nickname?: string
  avatar?: string
}

export interface AuthResponse {
  token: string
  user: AuthUser
}

export interface Message {
  id: number | string
  match_id: number
  sender_id: number
  content: string
  content_type: 1 | 2 | 3
  read_at: string | null
  created_at: string
  // client-only
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed'
}

export interface Match {
  match_id: number
  peer: { id: number; nickname: string; avatar: string }
  last_message?: string
  last_message_at?: string
  unread: number
  matched_at: string
}

export interface MatchFilters {
  limit?: number
  ageMin?: number
  ageMax?: number
  gender?: 0 | 1 | 2
  city?: string
  interests?: string[]
}

const apiBase = import.meta.env.VITE_API_BASE_URL || ''
const fileBase = import.meta.env.VITE_FILE_BASE_URL || apiBase

export function resolveFileUrl(path?: string) {
  if (!path) return ''
  if (/^(https?:|data:|blob:)/.test(path)) return path
  if (path.startsWith('/')) return `${fileBase}${path}`
  return `${fileBase}/${path}`
}

export const authApi = {
  register: (data: { phone: string; email?: string; password: string }) =>
    http.post('/auth/register', data) as Promise<AuthResponse>,
  login: (data: { phone: string; password: string }) =>
    http.post('/auth/login', data) as Promise<AuthResponse>,
}

export const userApi = {
  me: () => http.get('/users/me') as Promise<User>,
  updateProfile: (data: Partial<User>) => http.put('/users/me', data) as Promise<User>,
  uploadAvatar: (form: FormData) =>
    http.post('/users/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }) as Promise<{ avatar: string }>,
  getById: (id: number | string) => http.get(`/users/${id}`) as Promise<User>,
  block: (blocked_id: number) => http.post('/users/block', { blocked_id }),
  report: (reported_id: number, reason: string) =>
    http.post('/users/report', { reported_id, reason }),
}

export const matchApi = {
  recommendations: (limit = 20) =>
    http.get('/match/recommendations', { params: { limit } }) as Promise<User[]>,
  swipe: (swiped_id: number, action: 1 | 2) =>
    http.post('/match/swipe', { swiped_id, action }) as Promise<{
      matched: boolean
      match_id?: number
      peer_id?: number
    }>,
  list: () => http.get('/match/matches') as Promise<Match[]>,
}

export const messageApi = {
  list: (
    matchId: number,
    params: { before_id?: number; limit?: number } = {},
  ) =>
    http.get(`/messages/${matchId}`, { params }) as Promise<Message[]>,
  send: (data: { match_id: number; content: string; content_type?: 1 | 2 | 3 }) =>
    http.post('/messages', { content_type: 1, ...data }) as Promise<Message>,
  unread: () =>
    http.get('/messages/unread') as Promise<{
      total: number
      by_match: { match_id: number; unread: number }[]
    }>,
}
