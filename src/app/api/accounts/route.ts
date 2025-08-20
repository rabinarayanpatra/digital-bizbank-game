import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { z } from 'zod'

const querySchema = z.object({
  gameId: z.string()
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = querySchema.parse({
      gameId: searchParams.get('gameId')
    })
    
    const accounts = await prisma.account.findMany({
      where: { gameId: query.gameId },
      orderBy: [
        { type: 'asc' },
        { displayName: 'asc' }
      ]
    })
    
    return NextResponse.json(accounts)
    
  } catch (error) {
    console.error('Error fetching accounts:', error)
    return NextResponse.json(
      { error: 'Failed to fetch accounts' },
      { status: 500 }
    )
  }
}