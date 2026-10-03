#!/bin/bash
# Start Backend Server

cd "$(dirname "$0")/backend"

echo "Installing Python dependencies..."
python3 -m pip install --user -q -r requirements.txt

echo "Starting FastAPI server on http://localhost:8000"
echo "API docs available at http://localhost:8000/docs"
python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
