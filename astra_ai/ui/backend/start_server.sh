#!/bin/bash
# JARVIS Server Startup Script (Linux/Mac)
# ======================================

echo "🚀 Starting JARVIS Server (NovaAI Backend)"
echo ""

# Set environment variables
export GROQ_API_KEY="your_api_key_here"
export PYTHONPATH="${PWD}/../../.."

# Check if virtual environment exists
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv .venv
fi

# Activate virtual environment
source .venv/bin/activate

# Install/Update dependencies
echo "Installing dependencies..."
pip install -r requirements.txt

# Start the server
echo ""
echo "✅ Starting JARVIS Server on ws://localhost:8340/ws/voice"
echo ""
python server.py
