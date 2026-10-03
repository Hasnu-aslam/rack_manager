#!/bin/bash
# Start Frontend Server

cd "$(dirname "$0")/frontend"

echo "Installing Node dependencies..."
npm install

echo "Starting Next.js dev server on http://localhost:3000"
npm run dev
