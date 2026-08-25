#!/bin/bash

# Ensure pyenv is initialized
if command -v pyenv 1>/dev/null 2>&1; then
    eval "$(pyenv init -)"
    if pyenv virtualenvs 2>/dev/null | grep -q "assignment"; then
        pyenv activate assignment 2>/dev/null || true
    fi
fi

echo "Starting Backend (Django)..."
cd backend
python manage.py runserver 8000 &
BACKEND_PID=$!
cd ..

echo "Starting Frontend (Next.js)..."
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

echo "========================================="
echo "Both servers are starting up!"
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:3000"
echo "Press Ctrl+C to stop both servers."
echo "========================================="

# Trap SIGINT (Ctrl+C) and terminate both background processes
trap "echo -e '\nStopping servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM

# Wait indefinitely until interrupted
wait
