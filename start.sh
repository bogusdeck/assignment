#!/bin/bash

echo "==================================="
echo "  Starting Taskboy Servers         "
echo "==================================="

# Function to handle shutdown smoothly
cleanup() {
    echo -e "\nShutting down servers..."
    kill $BACKEND_PID
    kill $FRONTEND_PID
    exit 0
}

# Trap CTRL+C and call cleanup
trap cleanup SIGINT SIGTERM

# Start Django Backend
echo "Starting Django Backend on port 8000..."
cd backend
source venv/bin/activate
python manage.py runserver 8000 &
BACKEND_PID=$!
cd ..

# Start Next.js Frontend
echo "Starting Next.js Frontend on port 3000..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "==================================="
echo "  Frontend: http://localhost:3000  "
echo "  Backend:  http://localhost:8000  "
echo "  Press CTRL+C to stop servers.    "
echo "==================================="

# Wait for processes to exit (keeps script running)
wait $BACKEND_PID
wait $FRONTEND_PID
