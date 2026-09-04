#!/bin/bash
set -e

echo "==============================================="
echo "   Ayush Case-Taking Software"
echo "   Ministry of Ayush, Government of India"
echo "==============================================="
echo ""

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed!"
    echo "Please install from https://nodejs.org"
    exit 1
fi

echo "Node.js version: $(node --version)"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "[SETUP] Installing dependencies for the first time..."
    echo "This may take 1-2 minutes."
    echo ""
    npm install
    echo ""
    echo "[SETUP] Dependencies installed successfully!"
    echo ""
fi

# Kill any existing processes on our ports
lsof -ti:3001 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true
sleep 1

# Cleanup function
cleanup() {
    echo ""
    echo "Stopping services..."
    kill $SERVER_PID 2>/dev/null || true
    kill $VITE_PID 2>/dev/null || true
    echo "All services stopped."
    exit 0
}
trap cleanup SIGINT SIGTERM

echo "[1/3] Starting Backend Server on port 3001..."
node server/index.js &
SERVER_PID=$!
sleep 2

echo "[2/3] Starting Frontend on port 5173..."
npx vite --port 5173 &
VITE_PID=$!
sleep 3

# Open browser (Mac or Linux)
echo "[3/3] Opening browser..."
if command -v open &> /dev/null; then
    open http://localhost:5173
elif command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:5173
fi

echo ""
echo "==============================================="
echo "   All services running!"
echo "==============================================="
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3001"
echo ""
echo "   CMO:        rahulpd1712@gmail.com / RahulAdmin123!"
echo "   Hospital:   admin.neha@ayush.com  / admin123"
echo "   Doctor:     dr.priya@ayush.com    / doctor123"
echo "   Assistant:  asst.ravi@ayush.com   / asst123"
echo "==============================================="
echo ""
echo "Press Ctrl+C to stop all services..."
echo ""

# Wait for processes
wait
