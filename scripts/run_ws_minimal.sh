#!/bin/bash
# scripts/run_ws_minimal.sh
set -e
cd "$(dirname "$0")/.."
if [ -f ".venv/bin/activate" ]; then
  . .venv/bin/activate
fi
echo "Killing any process on 8000 to start fresh"
if command -v lsof >/dev/null 2>&1; then
  PID=$(lsof -ti tcp:8000 || true)
  if [ -n "$PID" ]; then
    kill -9 $PID || true
  fi
fi
echo "Starting WS minimal on http://localhost:8000"
python api_ws_minimal.py

