# Business-UPI (Local) 💰

A **fully local, LAN-only** digital cash system for the *Business* board game. A laptop hosts the game (acts as **Bank**) and players on the same Wi-Fi join via a code to send/receive money, with a fixed game budget, real-time balances, and an auditable transaction ledger.

## 🎯 Overview

This application creates a digital payment system for board games that:
- Runs entirely on your local network (no internet required)
- Supports real-time transactions between players
- Maintains budget constraints and transaction integrity
- Provides audit trails for all transactions
- Works on laptops and mobile devices

## ✨ Features

- **🏦 Bank Dashboard**: Create games, manage budgets, credit/debit players
- **📱 Player Wallets**: Send money to other players or the bank
- **⚡ Real-time Updates**: Live balance updates and transaction feeds
- **🔒 Budget Control**: Enforced spending limits and balance validation
- **📊 Transaction Ledger**: Complete audit trail of all payments
- **🌐 LAN Access**: Connect via QR codes or join codes
- **💾 Persistent Data**: SQLite database survives server restarts

## 🛠 Tech Stack

- **Frontend/Backend**: Next.js 15 (App Router)
- **Database**: SQLite with Prisma ORM
- **Real-time**: Socket.IO WebSockets
- **UI**: Tailwind CSS with Lucide Icons
- **Validation**: Zod schemas
- **Testing**: Jest with React Testing Library

## 📋 Prerequisites

- Node.js 18+ 
- npm or yarn
- SQLite (included with Node.js)

## 🚀 Quick Start

### Option 1: Automated Setup (Recommended)

```bash
# Make setup script executable and run
chmod +x setup.sh
./setup.sh
```

### Option 2: Manual Setup

```bash
# Clone and enter directory
git clone <repository-url>
cd business-online-pay

# Install dependencies
npm install

# Set up environment
cp .env.example .env

# Initialize database
npx prisma migrate dev

# Start development server
npm run dev
```

## 🎮 How to Play

### 1. Host Setup (Bank)
1. Start the server on your laptop: `npm run dev`
2. Open `http://localhost:3000` in your browser
3. Click **"Create Game"**
4. Set game parameters:
   - Game Name
   - Total Budget (e.g., ₹20,000)
   - Starting Money Per Player (e.g., ₹1,500)
   - Currency Symbol
5. Share the **Join Code** and **Host IP** with players

### 2. Player Setup
1. Connect to the same Wi-Fi network
2. Open `http://<host-ip>:3000/join` on your device
3. Enter your name and the join code
4. Start transacting!

### 3. Game Flow
- **Players** can send money to other players or the bank
- **Bank** can credit/debit any player account
- All transactions are logged and broadcast in real-time
- Budget constraints prevent overspending
- Game can be ended by the bank with final summary

## 🏗 Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Host Laptop   │    │  Player Phone   │    │  Player Phone   │
│    (Bank)       │    │                 │    │                 │
│  ┌───────────┐  │    │  ┌───────────┐  │    │  ┌───────────┐  │
│  │  Next.js  │  │    │  │  Browser  │  │    │  │  Browser  │  │
│  │  Server   │  │    │  │           │  │    │  │           │  │
│  └───────────┘  │    │  └───────────┘  │    │  └───────────┘  │
│  ┌───────────┐  │    └─────────────────┘    └─────────────────┘
│  │  SQLite   │  │              │                        │
│  │  Database │  │              │    WebSocket/HTTP      │
│  └───────────┘  │              │                        │
└─────────────────┘              └────────────────────────┘
         │                                    │
         └────────────── LAN Network ─────────┘
```

## 📁 Project Structure

```
business-online-pay/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API routes
│   │   │   ├── game/          # Game management
│   │   │   ├── join/          # Player joining
│   │   │   ├── tx/            # Transactions
│   │   │   └── accounts/      # Account management
│   │   ├── host/[id]/         # Bank dashboard
│   │   ├── player/[gameId]/   # Player wallet
│   │   └── join/              # Join page
│   ├── components/            # React components
│   ├── lib/                   # Utilities and business logic
│   ├── contexts/              # React contexts
│   └── types/                 # TypeScript definitions
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
├── server.js                  # Custom server with Socket.IO
└── setup.sh                   # Automated setup script
```

## 🗃 Database Schema

### Core Entities

- **Game**: Game sessions with budget and settings
- **Account**: Bank and player accounts with balances
- **Transaction**: Immutable transaction records
- **Session**: Player session management
- **Setting**: Game-specific configurations

### Key Invariant
```
BankBalance + Σ(PlayerBalances) = TotalBudget
```

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/game` | Create new game |
| GET | `/api/game/:id` | Get game details |
| POST | `/api/join` | Join game as player |
| GET | `/api/me` | Get current user session |
| GET | `/api/accounts` | List all accounts |
| POST | `/api/tx` | Submit transaction |
| GET | `/api/tx` | Query transaction history |
| POST | `/api/game/:id/end` | End game |

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run with coverage
npm run test:coverage
```

## 🔧 Development Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run db:migrate   # Run database migrations
npm run db:generate  # Generate Prisma client
npm run db:studio    # Open Prisma Studio
```

## 🌐 Network Setup

### For LAN Access:
1. Ensure all devices are on the same Wi-Fi network
2. Find your host IP: `ipconfig` (Windows) or `ifconfig` (Mac/Linux)
3. Players access via: `http://<host-ip>:3000`

### Firewall Configuration:
- Allow incoming connections on port 3000
- Ensure no WAN exposure for security

## 🔒 Security

- **LAN-only**: No external internet dependencies
- **Join codes**: 6-8 character access control
- **No PII**: No personal information stored
- **Local storage**: All data stays on host device

## 🐛 Troubleshooting

### Common Issues:

**"Database is locked" errors:**
- Ensure WAL mode is enabled (automatic on startup)
- Check for competing database connections

**Players can't connect:**
- Verify all devices on same network
- Check firewall settings
- Confirm host IP address

**Real-time updates not working:**
- Check WebSocket connection in browser console
- Ensure Socket.IO is properly initialized

**Budget not balancing:**
- Check transaction logs for inconsistencies
- Verify all transactions complete atomically

## 📊 Performance

- **Latency**: <150ms transaction processing
- **Capacity**: Supports 10-12 concurrent players
- **Storage**: Minimal SQLite footprint
- **Memory**: Efficient real-time state management

## 🚀 Deployment

### Development:
```bash
npm run dev
```

### Production:
```bash
npm run build
npm run start
```

### Custom Server:
The application uses a custom server (`server.js`) that combines Next.js with Socket.IO for real-time functionality.

## 🔮 Future Enhancements

- PWA support for offline access
- QR code payment intents
- Property/asset tracking module
- Multi-game support
- Print-friendly reports
- Game analytics dashboard

## 📝 Game Rules

### For Players:
- Cannot send money you don't have (unless bank allows overdraft)
- Cannot send to yourself
- All transactions require confirmation
- Can view your transaction history

### For Bank:
- Can credit/debit any player
- Can adjust game settings
- Can end game and export reports
- Sees all transactions and balances

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Inspired by the need for digital cash systems in board games
- Built with modern web technologies for reliability
- Designed for local-first, privacy-focused gaming

---

**Ready to play?** Run `./setup.sh` and start your first game! 🎮