#!/bin/bash

# MathASD Startup Script

set -e

echo "🚀 MathASD — Starting Application"
echo "=================================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
  echo "❌ Docker is not running. Please start Docker Desktop."
  exit 1
fi

echo "✓ Docker is running"
echo ""

# Check if docker-compose is available
if ! command -v docker-compose &> /dev/null; then
  echo "❌ docker-compose is not installed."
  exit 1
fi

echo "✓ docker-compose is available"
echo ""

# Build and start containers
echo "📦 Building and starting containers..."
docker-compose up --build -d

echo ""
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check if services are running
echo ""
echo "🔍 Checking service status..."
docker-compose ps

echo ""
echo "✅ Application started successfully!"
echo ""
echo "📍 Access points:"
echo "   Frontend:     http://localhost:3000"
echo "   Backend API:  http://localhost:3001"
echo "   ML Service:   http://localhost:8000"
echo "   PostgreSQL:   localhost:5432"
echo ""
echo "📝 To view logs:"
echo "   docker-compose logs -f"
echo ""
echo "🛑 To stop:"
echo "   docker-compose down"
echo ""
