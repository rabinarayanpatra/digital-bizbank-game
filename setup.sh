#!/bin/bash

# Business-UPI (Local) Setup Script
# Automated setup for the local digital cash system

set -e  # Exit on any error

echo "🏦 Business-UPI (Local) Setup Script"
echo "===================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to get local IP address
get_local_ip() {
    if command_exists "ipconfig"; then
        # Windows
        ipconfig | grep "IPv4" | awk '{print $NF}' | head -1
    elif command_exists "ifconfig"; then
        # macOS/Linux with ifconfig
        ifconfig | grep "inet " | grep -v "127.0.0.1" | awk '{print $2}' | head -1
    elif command_exists "ip"; then
        # Linux with ip command
        ip route get 1.1.1.1 | awk '{print $7}' | head -1
    elif command_exists "hostname"; then
        # Alternative method
        hostname -I | awk '{print $1}' 2>/dev/null || hostname -i | awk '{print $1}' 2>/dev/null
    else
        echo "Unable to detect"
    fi
}

# Check system requirements
echo "🔍 Checking system requirements..."
echo ""

# Check Node.js
if ! command_exists "node"; then
    print_error "Node.js is not installed!"
    print_info "Please install Node.js 18+ from: https://nodejs.org/"
    exit 1
else
    NODE_VERSION=$(node --version)
    print_status "Node.js found: $NODE_VERSION"
    
    # Check if Node.js version is 18+
    NODE_MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | sed 's/v//')
    if [ "$NODE_MAJOR_VERSION" -lt 18 ]; then
        print_warning "Node.js version $NODE_VERSION detected. Version 18+ recommended."
    fi
fi

# Check npm
if ! command_exists "npm"; then
    print_error "npm is not installed!"
    print_info "npm usually comes with Node.js. Please reinstall Node.js."
    exit 1
else
    NPM_VERSION=$(npm --version)
    print_status "npm found: $NPM_VERSION"
fi

# Check if we're in the correct directory
if [ ! -f "package.json" ]; then
    print_error "package.json not found!"
    print_info "Please run this script from the project root directory."
    exit 1
fi

# Verify this is the correct project
if ! grep -q "business-online-pay" package.json; then
    print_error "This doesn't appear to be the business-online-pay project!"
    exit 1
fi

print_status "Project structure verified"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
echo ""

if npm install; then
    print_status "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

echo ""

# Setup environment file
echo "⚙️  Setting up environment..."
echo ""

if [ ! -f ".env" ]; then
    cat > .env << EOF
# Environment variables for Business-UPI (Local)
# Database configuration
DATABASE_URL="file:./prisma/dev.db"

# Server configuration
HOSTNAME=0.0.0.0
PORT=3000
EOF
    print_status "Environment file (.env) created"
else
    print_info "Environment file (.env) already exists"
fi

# Setup database
echo ""
echo "🗄️  Setting up database..."
echo ""

# Generate Prisma client
if npx prisma generate; then
    print_status "Prisma client generated"
else
    print_error "Failed to generate Prisma client"
    exit 1
fi

# Run database migrations
if npx prisma migrate dev --name init; then
    print_status "Database migrations completed"
else
    print_info "Database migrations may have already been run"
fi

# Enable WAL mode for SQLite
echo ""
print_info "Configuring SQLite for optimal performance..."
if command_exists "sqlite3"; then
    if [ -f "./prisma/dev.db" ]; then
        sqlite3 ./prisma/dev.db "PRAGMA journal_mode=WAL;"
        print_status "SQLite WAL mode enabled"
    fi
else
    print_warning "sqlite3 command not found. WAL mode will be set at runtime."
fi

# Run tests to verify setup
echo ""
echo "🧪 Running tests to verify setup..."
echo ""

if npm test -- --passWithNoTests; then
    print_status "Tests passed successfully"
else
    print_warning "Some tests failed, but setup can continue"
fi

# Get network information
echo ""
echo "🌐 Network Configuration"
echo "======================="
echo ""

LOCAL_IP=$(get_local_ip)
if [ "$LOCAL_IP" != "Unable to detect" ] && [ ! -z "$LOCAL_IP" ]; then
    print_status "Local IP detected: $LOCAL_IP"
    print_info "Players can join at: http://$LOCAL_IP:3000"
else
    print_warning "Could not auto-detect local IP"
    print_info "You'll need to find your IP manually:"
    print_info "  - Windows: ipconfig"
    print_info "  - macOS/Linux: ifconfig"
    print_info "Then players can join at: http://YOUR_IP:3000"
fi

# Create a quick start script
cat > start-game.sh << EOF
#!/bin/bash
echo "🏦 Starting Business-UPI (Local)..."
echo "=================================="
echo ""
echo "Host Dashboard: http://localhost:3000"
if [ "$LOCAL_IP" != "Unable to detect" ] && [ ! -z "$LOCAL_IP" ]; then
echo "Players join at: http://$LOCAL_IP:3000/join"
else
echo "Players join at: http://YOUR_IP:3000/join"
fi
echo ""
echo "Press Ctrl+C to stop the server"
echo ""
npm run dev
EOF

chmod +x start-game.sh

# Setup completion
echo ""
echo "🎉 Setup Complete!"
echo "=================="
echo ""
print_status "Business-UPI (Local) is ready to use!"
echo ""
print_info "Quick Start Options:"
echo ""
echo "1. Start the game server:"
echo "   ./start-game.sh"
echo ""
echo "2. Or start manually:"
echo "   npm run dev"
echo ""
print_info "Game Flow:"
echo "1. 🏦 Host: Open http://localhost:3000 and create a game"
echo "2. 📱 Players: Connect to the same Wi-Fi and join via the join code"
echo "3. 💰 Start transacting!"
echo ""
print_info "Useful Commands:"
echo "   npm run dev          - Start development server"
echo "   npm run build        - Build for production"
echo "   npm run start        - Start production server"
echo "   npm test             - Run tests"
echo "   npm run db:studio    - Open database browser"
echo ""

# Final network reminder
if [ "$LOCAL_IP" != "Unable to detect" ] && [ ! -z "$LOCAL_IP" ]; then
    print_info "Network Info:"
    echo "   Host IP: $LOCAL_IP"
    echo "   Port: 3000"
    echo "   Player URL: http://$LOCAL_IP:3000/join"
else
    print_warning "Remember to find your local IP address for players to connect!"
fi

echo ""
print_status "Setup script completed successfully! 🚀"
print_info "Run './start-game.sh' to begin your first game session."