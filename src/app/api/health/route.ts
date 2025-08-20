import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import os from 'os'

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`
    
    const networkInterfaces = os.networkInterfaces()
    const localIPs = Object.values(networkInterfaces)
      .flat()
      .filter(iface => 
        iface && 
        !iface.internal && 
        iface.family === 'IPv4'
      )
      .map(iface => iface?.address)
    
    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: 'connected',
      localIPs,
      uptime: process.uptime()
    })
    
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Database connection failed'
      },
      { status: 500 }
    )
  }
}