import { prisma } from './db'
import { AccountType } from '@prisma/client'

export class BusinessLogicError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'BusinessLogicError'
  }
}

export async function validateBudgetInvariant(gameId: string): Promise<boolean> {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: { accounts: true }
  })

  if (!game) {
    throw new BusinessLogicError('Game not found')
  }

  const totalBalances = game.accounts.reduce((sum, account) => sum + account.balance, 0)
  
  if (totalBalances !== game.totalBudget) {
    console.error(`Budget invariant violated for game ${gameId}: total balances ${totalBalances} != budget ${game.totalBudget}`)
    return false
  }

  return true
}

export async function canPlayerAffordTransaction(accountId: string, amount: number): Promise<boolean> {
  const account = await prisma.account.findUnique({
    where: { id: accountId },
    include: { 
      game: { 
        include: { settings: true } 
      } 
    }
  })

  if (!account) {
    throw new BusinessLogicError('Account not found')
  }

  if (account.type === AccountType.BANK) {
    return true
  }

  const allowNegative = account.game.settings?.allowNegativeBalances || false
  const wouldBeNegative = account.balance - amount < 0

  return !wouldBeNegative || allowNegative
}

export async function getGameStatistics(gameId: string) {
  const game = await prisma.game.findUnique({
    where: { id: gameId },
    include: {
      accounts: true,
      transactions: {
        include: {
          fromAccount: true,
          toAccount: true
        }
      }
    }
  })

  if (!game) {
    throw new BusinessLogicError('Game not found')
  }

  const bankAccount = game.accounts.find(acc => acc.type === AccountType.BANK)
  const playerAccounts = game.accounts.filter(acc => acc.type === AccountType.PLAYER)

  const totalInCirculation = playerAccounts.reduce((sum, acc) => sum + acc.balance, 0)
  const bankBalance = bankAccount?.balance || 0

  const transactionVolume = game.transactions.reduce((sum, tx) => sum + tx.amount, 0)
  const transactionCount = game.transactions.length

  const topPlayers = playerAccounts
    .sort((a, b) => b.balance - a.balance)
    .slice(0, 3)

  const recentActivity = game.transactions
    .slice(-10)
    .reverse()

  return {
    totalBudget: game.totalBudget,
    bankBalance,
    totalInCirculation,
    playerCount: playerAccounts.length,
    transactionVolume,
    transactionCount,
    topPlayers,
    recentActivity,
    budgetUtilization: (totalInCirculation / game.totalBudget) * 100
  }
}

export function generateUniqueJoinCode(existingCodes: string[]): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  let attempts = 0
  let code = ''

  do {
    code = ''
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    attempts++
  } while (existingCodes.includes(code) && attempts < 100)

  if (attempts >= 100) {
    throw new BusinessLogicError('Unable to generate unique join code')
  }

  return code
}