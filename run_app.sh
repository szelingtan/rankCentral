
#!/bin/bash

# Function to check if a port is in use
port_in_use() {
  if command -v lsof > /dev/null; then
    lsof -i :$1 > /dev/null
  else
    netstat -tuln | grep -q ":$1 "
  fi
}

# Find an available port starting from 5000
BACKEND_PORT=5002
while port_in_use $BACKEND_PORT; do
  echo "Port $BACKEND_PORT is already in use, trying another port..."
  BACKEND_PORT=$((BACKEND_PORT + 1))
done

echo "Starting backend server on port $BACKEND_PORT..."
export PORT=$BACKEND_PORT
nohup python backend/api.py > backend.log 2>&1 &
BACKEND_PID=$!

echo "Backend server started with PID $BACKEND_PID. You can check logs in backend.log"
echo "Please wait a moment for backend services to initialize..."
sleep 3

echo "Starting frontend dev server..."
npm run dev
