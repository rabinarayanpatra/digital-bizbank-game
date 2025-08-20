'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useRouter } from 'next/navigation'

export function CreateGameForm() {
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    currencySymbol: '₹',
    totalBudget: 20000,
    startingMoneyPerPlayer: 1500
  })
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create game')
      }

      const { gameId } = await response.json()
      router.push(`/host/${gameId}`)
    } catch (error) {
      console.error('Error creating game:', error)
      alert(error instanceof Error ? error.message : 'Failed to create game')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Create New Game</CardTitle>
        <CardDescription>
          Set up a new Business board game session
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">
              Game Name
            </label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="My Business Game"
              required
            />
          </div>

          <div>
            <label htmlFor="currency" className="block text-sm font-medium mb-1">
              Currency Symbol
            </label>
            <Input
              id="currency"
              type="text"
              value={formData.currencySymbol}
              onChange={(e) => setFormData({ ...formData, currencySymbol: e.target.value })}
              placeholder="₹"
              maxLength={10}
              required
            />
          </div>

          <div>
            <label htmlFor="budget" className="block text-sm font-medium mb-1">
              Total Budget
            </label>
            <Input
              id="budget"
              type="number"
              value={formData.totalBudget}
              onChange={(e) => setFormData({ ...formData, totalBudget: Number(e.target.value) })}
              min={1000}
              max={1000000}
              required
            />
          </div>

          <div>
            <label htmlFor="starting" className="block text-sm font-medium mb-1">
              Starting Money Per Player
            </label>
            <Input
              id="starting"
              type="number"
              value={formData.startingMoneyPerPlayer}
              onChange={(e) => setFormData({ ...formData, startingMoneyPerPlayer: Number(e.target.value) })}
              min={100}
              max={formData.totalBudget / 2}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Create Game'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}