import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { createTransactionSchema, getTransactionsSchema } from '@/lib/validation'
import { emitToGame } from '@/lib/socket'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const data = createTransactionSchema.parse(body)
    
    if (data.fromAccountId === data.toAccountId) {
      return NextResponse.json(
        { error: 'Cannot send money to yourself' },
        { status: 400 }
      )
    }
    
    const [fromAccount, toAccount, game] = await Promise.all([
      prisma.account.findUnique({ where: { id: data.fromAccountId } }),
      prisma.account.findUnique({ where: { id: data.toAccountId } }),
      prisma.game.findUnique({ 
        where: { id: data.gameId },
        include: { settings: true }
      })
    ])
    
    if (!fromAccount || !toAccount || !game) {
      return NextResponse.json(
        { error: 'Invalid account or game' },
        { status: 404 }
      )
    }
    
    if (game.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'Game is not active' },
        { status: 400 }
      )
    }
    
    const wouldBeNegative = fromAccount.balance - data.amount < 0
    const allowNegative = game.settings?.allowNegativeBalances || false
    
    if (wouldBeNegative && !allowNegative && fromAccount.type === 'PLAYER') {
      return NextResponse.json(
        { error: 'Insufficient funds' },
        { status: 400 }
      )
    }
    
    const result = await prisma.$transaction(async (tx) => {
      await tx.account.update({
        where: { id: data.fromAccountId },
        data: { balance: fromAccount.balance - data.amount }
      })
      
      await tx.account.update({
        where: { id: data.toAccountId },
        data: { balance: toAccount.balance + data.amount }
      })
      
      const transaction = await tx.transaction.create({
        data: {
          gameId: data.gameId,
          fromAccountId: data.fromAccountId,
          toAccountId: data.toAccountId,
          amount: data.amount,
          note: data.note
        },
        include: {
          fromAccount: true,
          toAccount: true
        }
      })
      
      const allAccounts = await tx.account.findMany({
        where: { gameId: data.gameId }
      })
      
      const balancesSnapshot = allAccounts.reduce((acc, account) => {
        acc[account.id] = account.balance
        return acc
      }, {} as Record<string, number>)
      
      return { transaction, balancesSnapshot }
    })
    
    emitToGame(data.gameId, 'tx:created', result)
    
    return NextResponse.json({ success: true, transaction: result.transaction })
    
  } catch (error) {
    console.error('Error creating transaction:', error)
    return NextResponse.json(
      { error: 'Failed to create transaction' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = getTransactionsSchema.parse({
      gameId: searchParams.get('gameId'),
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : undefined,
      type: searchParams.get('type') as any,
      accountId: searchParams.get('accountId') || undefined
    })
    
    const where: any = { gameId: query.gameId }
    
    if (query.type) {
      if (query.type === 'BANK_TO_PLAYER') {
        where.fromAccount = { type: 'BANK' }
        where.toAccount = { type: 'PLAYER' }
      } else if (query.type === 'PLAYER_TO_BANK') {
        where.fromAccount = { type: 'PLAYER' }
        where.toAccount = { type: 'BANK' }
      } else if (query.type === 'PLAYER_TO_PLAYER') {
        where.fromAccount = { type: 'PLAYER' }
        where.toAccount = { type: 'PLAYER' }
      }
    }
    
    if (query.accountId) {
      where.OR = [
        { fromAccountId: query.accountId },
        { toAccountId: query.accountId }
      ]
    }
    
    const transactions = await prisma.transaction.findMany({
      where,
      include: {
        fromAccount: true,
        toAccount: true
      },
      orderBy: { createdAt: 'desc' },
      take: query.limit
    })
    
    return NextResponse.json(transactions)
    
  } catch (error) {
    console.error('Error fetching transactions:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transactions' },
      { status: 500 }
    )
  }
}