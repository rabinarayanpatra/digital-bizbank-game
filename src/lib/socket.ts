import { Server } from 'socket.io'

export function getIO(): Server {
  if (!global.io) {
    throw new Error('Socket.IO server not initialized')
  }
  return global.io
}

export function emitToGame(gameId: string, event: string, data: any) {
  const io = getIO()
  io.to(gameId).emit(event, data)
}