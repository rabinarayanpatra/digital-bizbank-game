import { NextRequest, NextResponse } from 'next/server'
import { prisma, initializeDatabase } from '@/lib/db'
import { createGameSchema } from '@/lib/validation'
import { generateJoinCode } from '@/lib/utils'
import { AccountType } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    await initializeDatabase()
    
    const body = await request.json()
    const data = createGameSchema.parse(body)
    
    if (data.startingMoneyPerPlayer * 10 > data.totalBudget) {
      return NextResponse.json(
        { error: 'Starting money per player is too high for the total budget' },
        { status: 400 }
      )
    }
    
    let joinCode = generateJoinCode()
    let attempts = 0
    
    while (attempts < 10) {
      const existing = await prisma.game.findUnique({
        where: { joinCode }
      })
      
      if (!existing) break
      
      joinCode = generateJoinCode()
      attempts++
    }
    
    if (attempts >= 10) {
      return NextResponse.json(
        { error: 'Failed to generate unique join code' },
        { status: 500 }
      )
    }
    
    const game = await prisma.$transaction(async (tx) => {
      const newGame = await tx.game.create({
        data: {
          name: data.name,
          joinCode,
          currencySymbol: data.currencySymbol,
          totalBudget: data.totalBudget,
          startingMoneyPerPlayer: data.startingMoneyPerPlayer
        }
      })
      
      await tx.account.create({
        data: {
          gameId: newGame.id,
          type: AccountType.BANK,
          displayName: 'Bank',
          balance: data.totalBudget
        }
      })
      
      await tx.setting.create({
        data: {
          gameId: newGame.id,
          allowNegativeBalances: false
        }
      })
      
      return newGame
    })
    
    return NextResponse.json({
      gameId: game.id,
      joinCode: game.joinCode
    })
    
  } catch (error) {
    console.error('Error creating game:', error)
    return NextResponse.json(
      { error: 'Failed to create game' },
      { status: 500 }
    )
  }
}