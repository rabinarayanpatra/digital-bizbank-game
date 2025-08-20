'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { useSocket } from '@/contexts/SocketContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils'
import QRCode from 'qrcode'
import { motion } from 'framer-motion'
import { Users, DollarSign, TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'

interface GameData {
  id: string
  name: string
  joinCode: string
  currencySymbol: string
  totalBudget: number
  startingMoneyPerPlayer: number
  status: string
  accounts: Array<{
    id: string
    type: 'BANK' | 'PLAYER'
    displayName: string
    balance: number
  }>
  transactions: Array<{
    id: string
    fromAccount: { displayName: string; type: string }
    toAccount: { displayName: string; type: string }
    amount: number
    note?: string
    createdAt: string
  }>
  summary: {
    totalBudget: number
    bankBalance: number
    inCirculation: number
    playerCount: number
  }
}

export default function HostDashboard() {
  const params = useParams()
  const gameId = params.id as string
  const { socket, isConnected, joinGame } = useSocket()
  const [gameData, setGameData] = useState<GameData | null>(null)
  const [qrCodeUrl, setQrCodeUrl] = useState('')
  const [hostIP, setHostIP] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [transferAmount, setTransferAmount] = useState('')
  const [selectedPlayer, setSelectedPlayer] = useState('')
  const [transferNote, setTransferNote] = useState('')

  useEffect(() => {
    fetchGameData()
    fetchHostIP()
  }, [gameId])

  useEffect(() => {
    if (isConnected && gameId) {
      joinGame(gameId)
    }
  }, [isConnected, gameId, joinGame])

  useEffect(() => {
    if (!socket) return

    const handlePlayerJoined = (data: any) => {
      fetchGameData()
    }

    const handleTransactionCreated = (data: any) => {
      fetchGameData()
    }

    socket.on('player:joined', handlePlayerJoined)
    socket.on('tx:created', handleTransactionCreated)

    return () => {
      socket.off('player:joined', handlePlayerJoined)
      socket.off('tx:created', handleTransactionCreated)
    }
  }, [socket])

  const fetchGameData = async () => {
    try {
      const response = await fetch(`/api/game/${gameId}`)
      if (response.ok) {
        const data = await response.json()
        setGameData(data)
        
        const joinUrl = `${window.location.origin}/join?code=${data.joinCode}`
        const qr = await QRCode.toDataURL(joinUrl)
        setQrCodeUrl(qr)
      }
    } catch (error) {
      console.error('Error fetching game data:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchHostIP = async () => {
    try {
      const response = await fetch('/api/health')
      if (response.ok) {
        const data = await response.json()
        if (data.localIPs && data.localIPs.length > 0) {
          setHostIP(data.localIPs[0])
        }
      }
    } catch (error) {
      console.error('Error fetching host IP:', error)
    }
  }

  const handleTransfer = async (isCredit: boolean) => {
    if (!selectedPlayer || !transferAmount || !gameData) return

    const bankAccount = gameData.accounts.find(acc => acc.type === 'BANK')
    if (!bankAccount) return

    try {
      const amount = parseInt(transferAmount)
      const response = await fetch('/api/tx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId,
          fromAccountId: isCredit ? bankAccount.id : selectedPlayer,
          toAccountId: isCredit ? selectedPlayer : bankAccount.id,
          amount,
          note: transferNote || (isCredit ? 'Bank credit' : 'Bank debit')
        })
      })

      if (response.ok) {
        setTransferAmount('')
        setTransferNote('')
        setSelectedPlayer('')
        fetchGameData()
      } else {
        const error = await response.json()
        alert(error.error || 'Transaction failed')
      }
    } catch (error) {
      console.error('Error processing transfer:', error)
      alert('Transfer failed')
    }
  }

  const endGame = async () => {
    if (!confirm('Are you sure you want to end this game?')) return

    try {
      const response = await fetch(`/api/game/${gameId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        alert('Game ended successfully')
        window.location.href = '/'
      }
    } catch (error) {
      console.error('Error ending game:', error)
      alert('Failed to end game')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading game data...</span>
        </div>
      </div>
    )
  }

  if (!gameData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Game Not Found</h1>
          <p className="text-gray-600">The game you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  const players = gameData.accounts.filter(acc => acc.type === 'PLAYER')

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{gameData.name}</h1>
          <div className="flex items-center space-x-4 text-sm text-gray-600">
            <span className={`px-2 py-1 rounded-full ${isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
            <span>Join Code: <strong className="font-mono text-lg">{gameData.joinCode}</strong></span>
            {hostIP && <span>Host IP: {hostIP}:3000</span>}
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(gameData.summary.totalBudget, gameData.currencySymbol)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Bank Balance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(gameData.summary.bankBalance, gameData.currencySymbol)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">In Circulation</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(gameData.summary.inCirculation, gameData.currencySymbol)}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Users className="h-5 w-5 mr-2" />
                Players ({players.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {players.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No players have joined yet</p>
              ) : (
                players.map((player) => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                  >
                    <span className="font-medium">{player.displayName}</span>
                    <span className="font-bold text-green-600">
                      {formatCurrency(player.balance, gameData.currencySymbol)}
                    </span>
                  </motion.div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Join Game</CardTitle>
              <CardDescription>Players can scan this QR code or visit the URL</CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              {qrCodeUrl && (
                <img src={qrCodeUrl} alt="Join QR Code" className="mx-auto w-48 h-48" />
              )}
              <div className="space-y-2">
                <p className="text-sm text-gray-600">Or visit:</p>
                <code className="block bg-gray-100 p-2 rounded text-sm">
                  {hostIP ? `http://${hostIP}:3000/join?code=${gameData.joinCode}` : `${window.location.origin}/join?code=${gameData.joinCode}`}
                </code>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Bank Operations</CardTitle>
              <CardDescription>Credit or debit player accounts</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Player</label>
                <select
                  value={selectedPlayer}
                  onChange={(e) => setSelectedPlayer(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="">Select a player</option>
                  {players.map((player) => (
                    <option key={player.id} value={player.id}>
                      {player.displayName} ({formatCurrency(player.balance, gameData.currencySymbol)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Amount</label>
                <Input
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Note (optional)</label>
                <Input
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  placeholder="Transaction note"
                />
              </div>

              <div className="flex space-x-2">
                <Button
                  onClick={() => handleTransfer(true)}
                  disabled={!selectedPlayer || !transferAmount}
                  className="flex-1"
                >
                  Credit Player
                </Button>
                <Button
                  onClick={() => handleTransfer(false)}
                  disabled={!selectedPlayer || !transferAmount}
                  variant="outline"
                  className="flex-1"
                >
                  Debit Player
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {gameData.transactions.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No transactions yet</p>
                ) : (
                  gameData.transactions.slice(0, 10).map((tx) => (
                    <motion.div
                      key={tx.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-3 bg-gray-50 rounded-lg text-sm"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">
                            {tx.fromAccount.displayName} → {tx.toAccount.displayName}
                          </p>
                          {tx.note && <p className="text-gray-600">{tx.note}</p>}
                        </div>
                        <span className="font-bold text-blue-600">
                          {formatCurrency(tx.amount, gameData.currencySymbol)}
                        </span>
                      </div>
                      <p className="text-gray-500 text-xs mt-1">
                        {new Date(tx.createdAt).toLocaleString()}
                      </p>
                    </motion.div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6 flex justify-end">
          <Button onClick={endGame} variant="destructive">
            End Game
          </Button>
        </div>
      </div>
    </div>
  )
}