#!/bin/bash
# scripts/kill_8000.sh
set -e
if command -v lsof >/dev/null 2>&1; then
  PID=$(lsof -ti tcp:8000 || true)
  if [ -n "$PID" ]; then
    echo "Killing PID $PID on port 8000"
    kill -9 $PID
  else
    echo "No process on port 8000"
  fi
else
  echo "lsof not found"
fi

