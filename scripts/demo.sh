#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
echo ""
echo "============================================"
echo "  Key Recovery — Decentralized Inheritance"
echo "  ETHGlobal Cannes 2026"
echo "============================================"
echo ""

# Check for .env
if [ ! -f "$ROOT/.env" ]; then
  echo "[!] No .env found. Copying from .env.example..."
  cp "$ROOT/.env.example" "$ROOT/.env"
fi

# Install dependencies if needed
if [ ! -d "$ROOT/backend/node_modules" ]; then
  echo "[*] Installing backend dependencies..."
  cd "$ROOT/backend" && npm install
fi

if [ ! -d "$ROOT/frontend/node_modules" ]; then
  echo "[*] Installing frontend dependencies..."
  cd "$ROOT/frontend" && npm install
fi

echo ""
echo "[*] Starting backend..."
cd "$ROOT/backend"
npm run dev &
BACKEND_PID=$!

echo "[*] Starting frontend..."
cd "$ROOT/frontend"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "============================================"
echo "  Frontend:  http://localhost:3000"
echo "  Backend:   http://localhost:3001"
echo "  Pitch:     http://localhost:3000/pitch-deck.html"
echo "============================================"
echo ""
echo "Press Ctrl+C to stop."
echo ""

cleanup() {
  echo ""
  echo "[*] Shutting down..."
  kill $BACKEND_PID 2>/dev/null || true
  kill $FRONTEND_PID 2>/dev/null || true
  exit 0
}

trap cleanup INT TERM

wait
