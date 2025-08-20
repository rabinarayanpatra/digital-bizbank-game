import { PrismaClient } from '@prisma/client'

declare global {
  var prisma: PrismaClient | undefined
}

export const prisma = globalThis.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma
}

export async function initializeDatabase() {
  try {
    await prisma.$queryRaw`PRAGMA journal_mode=WAL;`
    await prisma.$queryRaw`PRAGMA busy_timeout=10000;`
    console.log('Database initialized with WAL mode')
  } catch (error) {
    console.error('Failed to initialize database:', error)
  }
}