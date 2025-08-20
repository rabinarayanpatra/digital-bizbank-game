import Link from 'next/link'
import { CreateGameForm } from '@/components/CreateGameForm'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Business UPI
        </h1>
        <p className="text-lg text-gray-600 mb-6">
          Local Digital Cash System for Business Board Game
        </p>
        <p className="text-sm text-gray-500 max-w-md">
          A fully local, LAN-only digital payment system. Host creates a game on this device, 
          players join via their phones using the same Wi-Fi network.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <CreateGameForm />
        
        <div className="text-center">
          <p className="text-gray-600 mb-2">Already have a join code?</p>
          <Link 
            href="/join"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background border border-input hover:bg-accent hover:text-accent-foreground h-10 py-2 px-4"
          >
            Join Game
          </Link>
        </div>
      </div>
    </div>
  )
}
