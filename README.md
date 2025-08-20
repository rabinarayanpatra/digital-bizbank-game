# Business UPI - Local Digital Cash System

A fully local, LAN-only digital cash system for the Business board game. Host creates a game on a laptop and players join via their phones using the same Wi-Fi network.

## Features

- **🏠 Local-only hosting**: No internet required, runs entirely on LAN
- **📱 Multi-device support**: Host dashboard on laptop, player wallets on phones
- **⚡ Real-time updates**: Live balance and transaction updates via WebSocket
- **🔒 Budget enforcement**: Strict budget invariants prevent money creation
- **📊 Complete audit trail**: Immutable transaction ledger
- **🎯 Game-ready**: Designed specifically for Business board game flow

## Quick Start

### 1. Setup

```bash
# Install dependencies
npm install

# Set up database
npm run db:migrate

# Start the server
npm run dev
```

The server will start on `http://0.0.0.0:3000` and automatically bind to your local network.

### 2. Create a Game (Host)

1. Open `http://localhost:3000` on the host laptop
2. Fill in game details:
   - Game name
   - Currency symbol (₹, $, €, etc.)
   - Total budget (e.g., ₹20,000)
   - Starting money per player (e.g., ₹1,500)
3. Click "Create Game"
4. Share the **Join Code** and **QR code** with players

### 3. Join Game (Players)

1. On your phone, connect to the same Wi-Fi network
2. Open `http://<host-ip>:3000/join` or scan the QR code
3. Enter the **Join Code** and your name
4. Start playing!

## Usage

### Host Dashboard

- **📊 Real-time overview**: Total budget, bank balance, money in circulation
- **👥 Player management**: View all players and their current balances
- **💰 Bank operations**: Credit/debit any player account
- **📝 Transaction history**: Full audit trail with filters
- **⚡ Live updates**: Automatic refresh when transactions occur

### Player Wallet

- **💳 Balance display**: Current money with currency symbol
- **💸 Send money**: Transfer to other players or pay the bank
- **📱 Mobile-optimized**: Touch-friendly interface for phones
- **📋 Transaction history**: Personal payment history
- **🔄 Real-time sync**: Instant balance updates

## Game Flow Example

1. **Host** creates game: "Family Business Night" with ₹20,000 budget
2. **Players** join with ₹1,500 starting money each
3. **Gameplay**:
   - Players pay rent to bank
   - Players transfer money for trades
   - Bank pays GO bonuses
   - Bank handles loans and penalties
4. **Host** ends game and reviews final balances

## Technical Details

### Architecture

- **Frontend**: Next.js 15 with React + TypeScript
- **Backend**: Next.js API routes with custom Socket.IO server
- **Database**: SQLite with WAL mode for concurrent access
- **Real-time**: Socket.IO for live updates
- **Validation**: Zod schemas with business logic constraints

### Budget Invariant

The system enforces a strict budget invariant:
```
Bank Balance + Sum(All Player Balances) = Total Budget
```

Every transaction is validated to ensure this equation always holds.

### LAN Configuration

The server automatically binds to `0.0.0.0:3000` making it accessible to any device on the same network. Players can access the game using the host's local IP address.

### Data Persistence

- Game data persists across host restarts
- SQLite database with WAL mode for concurrent reads
- Immutable transaction ledger for complete audit trail

## Development Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run test         # Run unit tests
npm run lint         # Lint code
npm run db:migrate   # Run database migrations
npm run db:studio    # Open Prisma Studio
```

## Troubleshooting

**Port 3000 already in use**:
```bash
lsof -ti:3000 | xargs kill -9
npm run dev
```

**Players can't connect**:
- Ensure all devices are on the same Wi-Fi network
- Check firewall settings on host device
- Use the correct local IP address shown in terminal

## Production Deployment

```bash
npm run build
npm start
```

Set environment variable:
```env
NODE_ENV=production
```

---

**Ready to play Business like never before!** 🎲💰
