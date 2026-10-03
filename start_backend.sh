#!/bin/bash
# Start Backend Server

cd "$(dirname "$0")/backend"

echo "Installing Python dependencies..."
python3 -m pip install --user -q -r requirements.txt

PORT="${PORT:-8000}"
echo "Starting FastAPI server on port $PORT"
python3 -m uvicorn app.main:app --host 0.0.0.0 --port $PORT
