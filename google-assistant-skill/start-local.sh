#!/bin/bash
# Start local development server for Google Assistant

# Set ThingsBoard URL
export THINGSBOARD_URL="http://localhost:8080"
export PORT=3000

echo "🚀 Starting Google Assistant Local Server..."
echo "📍 ThingsBoard URL: $THINGSBOARD_URL"
echo "🌐 Server will run on: http://localhost:$PORT"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Start server
node dist/index.js
