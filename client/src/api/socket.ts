import { io, type Socket } from 'socket.io-client'

let socket: Socket | null = null

export function connectSocket(token: string): Socket {
  if (socket?.connected) return socket
  const url = import.meta.env.VITE_SOCKET_URL || '/'
  socket = io(url, {
    transports: ['websocket', 'polling'],
    auth: { token },
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  })
  return socket
}

export function getSocket(): Socket | null {
  return socket
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}
