#!/bin/bash
set -e

echo "Starting PostgreSQL..."
docker-compose up -d

echo "Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!

echo "Starting frontend..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo "✅ All services started!"
echo "📱 Frontend: http://localhost:5173"
echo "🔧 Backend: http://localhost:3000"
echo "🗄️  Prisma Studio: http://localhost:5555 (run 'cd backend && npx prisma studio')"
echo ""
echo "Press Ctrl+C to stop all services"

trap "kill $BACKEND_PID $FRONTEND_PID; docker-compose down; exit" INT
wait
