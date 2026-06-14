import { defineStore } from 'pinia'
import { ref } from 'vue'
import { messageApi, matchApi, type Match, type Message } from '@/api'
import { connectSocket, disconnectSocket, getSocket } from '@/api/socket'
import { useUserStore } from './user'

export const useChatStore = defineStore('chat', () => {
  const matches = ref<Match[]>([])
  const messages = ref<Record<number, Message[]>>({})
  const onlineUsers = ref<Set<number>>(new Set())
  const typingMap = ref<Record<number, { from: number; at: number } | null>>({})

  async function loadMatches() {
    const [list, unread] = await Promise.all([
      matchApi.list(),
      messageApi.unread().catch(() => ({ total: 0, by_match: [] })),
    ])
    const unreadMap = new Map(unread.by_match.map((b) => [b.match_id, b.unread]))
    matches.value = list.map((m) => ({
      ...m,
      unread: unreadMap.get(m.match_id) ?? m.unread ?? 0,
    }))
    return matches.value
  }

  async function loadMessages(matchId: number, beforeId?: number) {
    const list = await messageApi.list(matchId, {
      before_id: beforeId,
      limit: 30,
    })
    if (beforeId) {
      const prev = messages.value[matchId] || []
      messages.value[matchId] = [...list, ...prev]
    } else {
      messages.value[matchId] = list
    }
    const m = matches.value.find((x) => x.match_id === matchId)
    if (m) m.unread = 0
    return list
  }

  function connect() {
    const userStore = useUserStore()
    if (!userStore.token) return
    const socket = connectSocket(userStore.token)

    socket.on('message:new', (msg: Message) => {
      const list = messages.value[msg.match_id] || []
      const exists = list.some((m) => m.id === msg.id)
      if (!exists) {
        messages.value[msg.match_id] = [...list, msg]
      }
      const match = matches.value.find((m) => m.match_id === msg.match_id)
      if (match) {
        match.last_message = msg.content
        match.last_message_at = msg.created_at
        if (msg.sender_id !== userStore.user?.id) {
          match.unread = (match.unread || 0) + 1
        }
      }
    })

    socket.on('message:read', ({ match_id, reader_id }: { match_id: number; reader_id: number }) => {
      const list = messages.value[match_id]
      if (!list) return
      list.forEach((m) => {
        if (m.sender_id !== reader_id && !m.read_at) {
          m.read_at = new Date().toISOString()
        }
      })
    })

    socket.on('typing', ({ match_id, user_id }: { match_id: number; user_id: number }) => {
      typingMap.value[match_id] = { from: user_id, at: Date.now() }
      setTimeout(() => {
        const t = typingMap.value[match_id]
        if (t && Date.now() - t.at >= 2900) {
          typingMap.value[match_id] = null
        }
      }, 3000)
    })
  }

  function joinMatch(matchId: number) {
    const socket = getSocket()
    if (socket?.connected) {
      socket.emit('match:join', { match_id: matchId })
    }
  }

  function leaveMatch(matchId: number) {
    const socket = getSocket()
    if (socket?.connected) {
      socket.emit('match:leave', { match_id: matchId })
    }
  }

  function send(matchId: number, content: string) {
    const socket = getSocket()
    const userStore = useUserStore()
    const tempId = `temp-${Date.now()}`
    const optimistic: Message = {
      id: tempId,
      match_id: matchId,
      sender_id: userStore.user?.id || 0,
      content,
      content_type: 1,
      read_at: null,
      created_at: new Date().toISOString(),
      status: 'sending',
    }
    const list = messages.value[matchId] || []
    messages.value[matchId] = [...list, optimistic]
    if (socket?.connected) {
      socket.emit('message:send', { match_id: matchId, content, content_type: 1 })
    } else {
      messageApi.send({ match_id: matchId, content, content_type: 1 }).then((res) => {
        const cur = messages.value[matchId] || []
        const idx = cur.findIndex((m) => m.id === tempId)
        if (idx >= 0) {
          const next = [...cur]
          next[idx] = { ...res, status: 'sent' }
          messages.value[matchId] = next
        }
      })
    }
  }

  function markRead(matchId: number) {
    const socket = getSocket()
    const m = matches.value.find((x) => x.match_id === matchId)
    if (m) m.unread = 0
    if (socket?.connected) {
      socket.emit('message:read', { match_id: matchId })
    }
  }

  function emitTyping(matchId: number) {
    const socket = getSocket()
    if (socket?.connected) {
      socket.emit('typing', { match_id: matchId })
    }
  }

  function disconnect() {
    disconnectSocket()
    matches.value = []
    messages.value = {}
    onlineUsers.value.clear()
  }

  return {
    matches,
    messages,
    onlineUsers,
    typingMap,
    loadMatches,
    loadMessages,
    connect,
    joinMatch,
    leaveMatch,
    send,
    markRead,
    emitTyping,
    disconnect,
  }
})
