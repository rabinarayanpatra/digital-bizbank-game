import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const sessionId = request.cookies.get('sessionId')?.value
    
    if (!sessionId) {
      return NextResponse.json(
        { error: 'No session found' },
        { status: 401 }
      )
    }
    
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        account: {
          include: {
            game: true
          }
        }
      }
    })
    
    if (!session) {
      return NextResponse.json(
        { error: 'Invalid session' },
        { status: 401 }
      )
    }
    
    await prisma.session.update({
      where: { id: sessionId },
      data: { lastSeenAt: new Date() }
    })
    
    return NextResponse.json({
      sessionId: session.id,
      gameId: session.gameId,
      account: session.account,
      game: session.account.game
    })
    
  } catch (error) {
    console.error('Error fetching session:', error)
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    )
  }
}