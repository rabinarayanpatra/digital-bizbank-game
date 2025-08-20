import { z } from 'zod'

export const createGameSchema = z.object({
  name: z.string().min(1, 'Game name is required').max(100, 'Name too long'),
  currencySymbol: z.string().min(1, 'Currency symbol is required').max(10, 'Symbol too long'),
  totalBudget: z.number().int().min(1000, 'Budget must be at least 1000').max(1000000, 'Budget too large'),
  startingMoneyPerPlayer: z.number().int().min(100, 'Starting money must be at least 100')
})

export const joinGameSchema = z.object({
  joinCode: z.string().length(6, 'Join code must be 6 characters'),
  displayName: z.string().min(1, 'Name is required').max(50, 'Name too long')
})

export const createTransactionSchema = z.object({
  gameId: z.string(),
  fromAccountId: z.string(),
  toAccountId: z.string(),
  amount: z.number().int().min(1, 'Amount must be positive'),
  note: z.string().optional()
})

export const getTransactionsSchema = z.object({
  gameId: z.string(),
  limit: z.number().int().min(1).max(100).optional().default(50),
  type: z.enum(['BANK_TO_PLAYER', 'PLAYER_TO_BANK', 'PLAYER_TO_PLAYER', 'ADJUSTMENT']).optional(),
  accountId: z.string().optional()
})

export type CreateGameInput = z.infer<typeof createGameSchema>
export type JoinGameInput = z.infer<typeof joinGameSchema>
export type CreateTransactionInput = z.infer<typeof createTransactionSchema>
export type GetTransactionsInput = z.infer<typeof getTransactionsSchema>