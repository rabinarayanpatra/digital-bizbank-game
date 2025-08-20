import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { joinGameSchema } from '@/lib/validation'
import { AccountType } from '@prisma/client'
import { emitToGame } from '@/lib/socket'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = joinGameSchema.parse(body)
    
    const game = await prisma.game.findUnique({
      where: { 
        joinCode: data.joinCode,
        status: 'ACTIVE'
      },
      include: {
        accounts: {
          where: { type: AccountType.BANK }
        }
      }
    })
    
    if (!game) {
      return NextResponse.json(
        { error: 'Invalid join code or game not active' },
        { status: 404 }
      )
    }
    
    const bankAccount = game.accounts[0]
    
    if (bankAccount.balance < game.startingMoneyPerPlayer) {
      return NextResponse.json(
        { error: 'Insufficient funds in bank to join game' },
        { status: 400 }
      )
    }
    
    const result = await prisma.$transaction(async (tx) => {
      const account = await tx.account.create({
        data: {
          gameId: game.id,
          type: AccountType.PLAYER,
          displayName: data.displayName,
          balance: game.startingMoneyPerPlayer
        }
      })
      
      await tx.account.update({
        where: { id: bankAccount.id },
        data: { balance: bankAccount.balance - game.startingMoneyPerPlayer }
      })
      
      const transaction = await tx.transaction.create({
        data: {
          gameId: game.id,
          fromAccountId: bankAccount.id,
          toAccountId: account.id,
          amount: game.startingMoneyPerPlayer,
          note: 'Starting money'
        },
        include: {
          fromAccount: true,
          toAccount: true
        }
      })
      
      const sessionId = uuidv4()
      await tx.session.create({
        data: {
          id: sessionId,
          gameId: game.id,
          accountId: account.id,
          clientFingerprint: 'web-client'
        }
      })
      
      return { account, transaction, sessionId }
    })
    
    emitToGame(game.id, 'player:joined', { account: result.account })
    emitToGame(game.id, 'tx:created', { 
      tx: result.transaction,
      balancesSnapshot: {
        [bankAccount.id]: bankAccount.balance - game.startingMoneyPerPlayer,
        [result.account.id]: game.startingMoneyPerPlayer
      }
    })
    
    const response = NextResponse.json({
      success: true,
      gameId: game.id,
      accountId: result.account.id,
      balance: result.account.balance
    })
    
    response.cookies.set('sessionId', result.sessionId, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24
    })
    
    return response
    
  } catch (error) {
    console.error('Error joining game:', error)
    return NextResponse.json(
      { error: 'Failed to join game' },
      { status: 500 }
    )
  }
}