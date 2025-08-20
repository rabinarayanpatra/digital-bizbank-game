'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { io, Socket } from 'socket.io-client'

interface SocketContextType {
  socket: Socket | null
  isConnected: boolean
  joinGame: (gameId: string) => void
  leaveGame: (gameId: string) => void
}

const SocketContext = createContext<SocketContextType>({
  socket: null,
  isConnected: false,
  joinGame: () => {},
  leaveGame: () => {}
})

export function useSocket() {
  return useContext(SocketContext)
}

export function SocketProvider({ children }: { children: React.ReactNode }) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const socketInstance = io({
      autoConnect: true
    })

    socketInstance.on('connect', () => {
      console.log('Connected to server')
      setIsConnected(true)
    })

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from server')
      setIsConnected(false)
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [])

  const joinGame = (gameId: string) => {
    if (socket) {
      socket.emit('join-game', gameId)
    }
  }

  const leaveGame = (gameId: string) => {
    if (socket) {
      socket.emit('leave-game', gameId)
    }
  }

  return (
    <SocketContext.Provider value={{ socket, isConnected, joinGame, leaveGame }}>
      {children}
    </SocketContext.Provider>
  )
}