#!/bin/bash

# Kill any existing process on port 8787
echo "Checking for existing processes on port 8787..."
EXISTING_PID=$(lsof -tiTCP:8787 2>/dev/null)

if [ ! -z "$EXISTING_PID" ]; then
    echo "Found existing process(es) on port 8787: $EXISTING_PID"
    echo "Killing existing process(es)..."
    kill -9 $EXISTING_PID 2>/dev/null
    sleep 2
    echo "Port 8787 cleared"
else
    echo "Port 8787 is free"
fi

# Start the backend
echo "Starting backend server..."
npm run dev
