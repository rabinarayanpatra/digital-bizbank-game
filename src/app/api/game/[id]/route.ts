import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

interface RouteContext {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    
    const game = await prisma.game.findUnique({
      where: { id },
      include: {
        accounts: {
          orderBy: { type: 'asc' }
        },
        transactions: {
          include: {
            fromAccount: true,
            toAccount: true
          },
          orderBy: { createdAt: 'desc' },
          take: 50
        },
        settings: true
      }
    })
    
    if (!game) {
      return NextResponse.json(
        { error: 'Game not found' },
        { status: 404 }
      )
    }
    
    const bankAccount = game.accounts.find(acc => acc.type === 'BANK')
    const playerAccounts = game.accounts.filter(acc => acc.type === 'PLAYER')
    
    const totalInCirculation = playerAccounts.reduce((sum, acc) => sum + acc.balance, 0)
    const bankBalance = bankAccount?.balance || 0
    
    return NextResponse.json({
      ...game,
      summary: {
        totalBudget: game.totalBudget,
        bankBalance,
        inCirculation: totalInCirculation,
        playerCount: playerAccounts.length
      }
    })
    
  } catch (error) {
    console.error('Error fetching game:', error)
    return NextResponse.json(
      { error: 'Failed to fetch game' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    
    await prisma.game.update({
      where: { id },
      data: { status: 'ENDED', endedAt: new Date() }
    })
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Error ending game:', error)
    return NextResponse.json(
      { error: 'Failed to end game' },
      { status: 500 }
    )
  }
}