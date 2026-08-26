#!/bin/bash

echo "==================================="
echo "  Setting up Taskboy Workspace     "
echo "==================================="

# Navigate to backend
echo -e "\n[1/4] Setting up Django Backend..."
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv venv
else
    echo "Virtual environment already exists."
fi

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Run migrations
echo "Running database migrations..."
python manage.py migrate

# Deactivate and go back to root
deactivate
cd ..

# Navigate to frontend
echo -e "\n[2/4] Setting up Next.js Frontend..."
cd frontend

# Install Node dependencies
echo "Installing Node.js dependencies..."
npm install

echo -e "\n==================================="
echo "  Setup Complete!                  "
echo "  Run ./start.sh to start servers  "
echo "==================================="
