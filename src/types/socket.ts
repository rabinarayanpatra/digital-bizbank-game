import { Server } from 'socket.io'

declare global {
  var io: Server | undefined
}

export interface ServerToClientEvents {
  'player:joined': (data: { account: any }) => void
  'tx:created': (data: { tx: any; balancesSnapshot: any }) => void
  'account:updated': (data: { accountId: string; balance: number }) => void
  'game:ended': (data: { summary: any }) => void
}

export interface ClientToServerEvents {
  'join-game': (gameId: string) => void
  'leave-game': (gameId: string) => void
}