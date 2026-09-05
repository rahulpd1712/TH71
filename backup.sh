#!/bin/bash
set -e

echo "==============================================="
echo "   Ayush Case-Taking Software"
echo "   Database Backup"
echo "==============================================="
echo ""

if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed!"
    echo "Please install from https://nodejs.org"
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo "[ERROR] Dependencies not installed."
    echo "Run start.sh once first (or: npm install)"
    exit 1
fi

npm run backup