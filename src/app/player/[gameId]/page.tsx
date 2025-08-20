'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useSocket } from '@/contexts/SocketContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/utils'
import { motion } from 'framer-motion'
import { Wallet, Send, Building2, RefreshCw, ArrowUpRight, ArrowDownLeft } from 'lucide-react'

interface PlayerData {
  sessionId: string
  gameId: string
  account: {
    id: string
    displayName: string
    balance: number
    type: string
  }
  game: {
    name: string
    currencySymbol: string
    status: string
  }
}

interface Transaction {
  id: string
  fromAccount: { displayName: string; type: string; id: string }
  toAccount: { displayName: string; type: string; id: string }
  amount: number
  note?: string
  createdAt: string
}

interface Account {
  id: string
  displayName: string
  type: string
  balance: number
}

export default function PlayerWallet() {
  const params = useParams()
  const gameId = params.gameId as string
  const { socket, isConnected, joinGame } = useSocket()
  const [playerData, setPlayerData] = useState<PlayerData | null>(null)
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [sendAmount, setSendAmount] = useState('')
  const [selectedRecipient, setSelectedRecipient] = useState('')
  const [sendNote, setSendNote] = useState('')
  const [isSending, setIsSending] = useState(false)
  const router = useRouter()

  useEffect(() => {
    checkSession()
  }, [gameId])

  useEffect(() => {
    if (isConnected && gameId) {
      joinGame(gameId)
    }
  }, [isConnected, gameId, joinGame])

  useEffect(() => {
    if (!socket || !playerData) return

    const handleTransactionCreated = (data: any) => {
      // Update balance if this player is involved
      if (data.balancesSnapshot[playerData.account.id] !== undefined) {
        setPlayerData(prev => prev ? {
          ...prev,
          account: {
            ...prev.account,
            balance: data.balancesSnapshot[playerData.account.id]
          }
        } : null)
      }
      
      // Always refresh transactions for this player to show new activity
      // Add a small delay to ensure the database has been updated
      setTimeout(async () => {
        try {
          const response = await fetch(`/api/tx?gameId=${gameId}&accountId=${playerData.account.id}&limit=20`)
          if (response.ok) {
            const transactions = await response.json()
            setTransactions(transactions)
          }
        } catch (error) {
          console.error('Error refreshing transactions:', error)
        }
      }, 100) // 100ms delay to ensure DB consistency
    }

    socket.on('tx:created', handleTransactionCreated)

    return () => {
      socket.off('tx:created', handleTransactionCreated)
    }
  }, [socket, playerData, gameId])

  const checkSession = async () => {
    try {
      const response = await fetch('/api/me')
      if (response.ok) {
        const data = await response.json()
        if (data.gameId === gameId) {
          setPlayerData(data)
          await Promise.all([
            fetchAccounts(),
            fetchTransactions()
          ])
        } else {
          router.push('/join')
        }
      } else {
        router.push('/join')
      }
    } catch (error) {
      console.error('Error checking session:', error)
      router.push('/join')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchAccounts = async () => {
    try {
      const response = await fetch(`/api/accounts?gameId=${gameId}`)
      if (response.ok) {
        const data = await response.json()
        setAccounts(data)
      }
    } catch (error) {
      console.error('Error fetching accounts:', error)
    }
  }

  const fetchTransactions = async () => {
    if (!playerData) return

    try {
      const response = await fetch(`/api/tx?gameId=${gameId}&accountId=${playerData.account.id}&limit=20`)
      if (response.ok) {
        const data = await response.json()
        setTransactions(data)
      }
    } catch (error) {
      console.error('Error fetching transactions:', error)
    }
  }

  const handleSend = async () => {
    if (!selectedRecipient || !sendAmount || !playerData) return

    setIsSending(true)

    try {
      const amount = parseInt(sendAmount)
      const response = await fetch('/api/tx', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId,
          fromAccountId: playerData.account.id,
          toAccountId: selectedRecipient,
          amount,
          note: sendNote || undefined
        })
      })

      if (response.ok) {
        setSendAmount('')
        setSendNote('')
        setSelectedRecipient('')
        fetchTransactions()
      } else {
        const error = await response.json()
        alert(error.error || 'Transaction failed')
      }
    } catch (error) {
      console.error('Error sending money:', error)
      alert('Transaction failed')
    } finally {
      setIsSending(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-6 w-6 animate-spin" />
          <span>Loading wallet...</span>
        </div>
      </div>
    )
  }

  if (!playerData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">Session Not Found</h1>
          <p className="text-gray-600 mb-4">Please join the game again.</p>
          <Button onClick={() => router.push('/join')}>Join Game</Button>
        </div>
      </div>
    )
  }

  const otherAccounts = accounts.filter(acc => acc.id !== playerData.account.id)
  const bankAccount = accounts.find(acc => acc.type === 'BANK')
  const playerAccounts = accounts.filter(acc => acc.type === 'PLAYER' && acc.id !== playerData.account.id)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 text-center"
        >
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{playerData.game.name}</h1>
          <p className="text-gray-600">Welcome, {playerData.account.displayName}</p>
          <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs mt-2 ${isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="mb-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center text-white">
                <Wallet className="h-5 w-5 mr-2" />
                Your Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {formatCurrency(playerData.account.balance, playerData.game.currencySymbol)}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Send className="h-5 w-5 mr-2" />
                Send Money
              </CardTitle>
              <CardDescription>Transfer money to other players or the bank</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Send to</label>
                <select
                  value={selectedRecipient}
                  onChange={(e) => setSelectedRecipient(e.target.value)}
                  className="w-full p-2 border rounded-md bg-white"
                >
                  <option value="">Select recipient</option>
                  {bankAccount && (
                    <option value={bankAccount.id}>
                      🏦 {bankAccount.displayName}
                    </option>
                  )}
                  {playerAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      👤 {account.displayName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Amount</label>
                <Input
                  type="number"
                  value={sendAmount}
                  onChange={(e) => setSendAmount(e.target.value)}
                  placeholder="Enter amount"
                  max={playerData.account.balance}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Note (optional)</label>
                <Input
                  value={sendNote}
                  onChange={(e) => setSendNote(e.target.value)}
                  placeholder="What's this for?"
                />
              </div>

              <Button
                onClick={handleSend}
                disabled={!selectedRecipient || !sendAmount || isSending || parseInt(sendAmount) > playerData.account.balance}
                className="w-full"
              >
                {isSending ? 'Sending...' : 'Send Money'}
              </Button>

              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (bankAccount) setSelectedRecipient(bankAccount.id)
                  }}
                >
                  <Building2 className="h-4 w-4 mr-1" />
                  Pay Bank
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSendAmount(Math.floor(playerData.account.balance / 10).toString())}
                >
                  Quick {formatCurrency(Math.floor(playerData.account.balance / 10), playerData.game.currencySymbol)}
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your payment history</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {transactions.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No transactions yet</p>
                ) : (
                  transactions.map((tx) => {
                    const isOutgoing = tx.fromAccount.id === playerData.account.id
                    const otherParty = isOutgoing ? tx.toAccount : tx.fromAccount
                    
                    return (
                      <motion.div
                        key={tx.id}
                        initial={{ opacity: 0, x: isOutgoing ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className={`p-3 rounded-lg border ${isOutgoing ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}`}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center">
                              {isOutgoing ? (
                                <ArrowUpRight className="h-4 w-4 text-red-600 mr-1" />
                              ) : (
                                <ArrowDownLeft className="h-4 w-4 text-green-600 mr-1" />
                              )}
                              <span className="font-medium">
                                {isOutgoing ? 'To' : 'From'} {otherParty.displayName}
                                {otherParty.type === 'BANK' && ' 🏦'}
                              </span>
                            </div>
                            {tx.note && (
                              <p className="text-sm text-gray-600 mt-1">{tx.note}</p>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(tx.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <span className={`font-bold ${isOutgoing ? 'text-red-600' : 'text-green-600'}`}>
                            {isOutgoing ? '-' : '+'}
                            {formatCurrency(tx.amount, playerData.game.currencySymbol)}
                          </span>
                        </div>
                      </motion.div>
                    )
                  })
                )}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="mt-6 text-center">
          <Button
            variant="outline"
            onClick={() => router.push('/')}
            className="text-sm"
          >
            Leave Game
          </Button>
        </div>
      </div>
    </div>
  )
}