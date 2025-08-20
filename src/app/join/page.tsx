'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { motion } from 'framer-motion'

export default function JoinGame() {
  const [formData, setFormData] = useState({
    joinCode: '',
    displayName: ''
  })
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const code = searchParams.get('code')
    if (code) {
      setFormData(prev => ({ ...prev, joinCode: code }))
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to join game')
      }

      const { gameId } = await response.json()
      router.push(`/player/${gameId}`)
    } catch (error) {
      console.error('Error joining game:', error)
      alert(error instanceof Error ? error.message : 'Failed to join game')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Join Game</CardTitle>
            <CardDescription>
              Enter the join code and your name to join the game
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="joinCode" className="block text-sm font-medium mb-1">
                  Join Code
                </label>
                <Input
                  id="joinCode"
                  type="text"
                  value={formData.joinCode}
                  onChange={(e) => setFormData({ ...formData, joinCode: e.target.value.toUpperCase() })}
                  placeholder="ABCD12"
                  maxLength={6}
                  className="font-mono text-center text-lg tracking-wider"
                  required
                />
              </div>

              <div>
                <label htmlFor="displayName" className="block text-sm font-medium mb-1">
                  Your Name
                </label>
                <Input
                  id="displayName"
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="Enter your name"
                  maxLength={50}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Joining...' : 'Join Game'}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t text-center">
              <p className="text-sm text-gray-600 mb-2">Don't have a join code?</p>
              <Button
                variant="outline"
                onClick={() => router.push('/')}
                className="w-full"
              >
                Create New Game
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}