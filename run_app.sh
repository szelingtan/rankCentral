
#!/bin/bash

# Function to check if a port is in use
port_in_use() {
  if command -v lsof > /dev/null; then
    lsof -i :$1 > /dev/null
  else
    netstat -tuln | grep -q ":$1 "
  fi
}

# Function to find an available port starting from a base port
find_available_port() {
  local base_port=$1
  local port=$base_port
  local max_attempts=20
  local attempt=0
  
  while port_in_use $port && [ $attempt -lt $max_attempts ]; do
    echo "Port $port is already in use, trying the next one..."
    port=$((port + 1))
    attempt=$((attempt + 1))
  done
  
  if [ $attempt -eq $max_attempts ]; then
    echo "Could not find an available port after $max_attempts attempts"
    exit 1
  fi
  
  echo $port
}

# Find an available port for the backend
BACKEND_PORT=$(find_available_port 5003)

echo "Starting backend server on port $BACKEND_PORT..."
export PORT=$BACKEND_PORT
nohup python backend/api.py > backend.log 2>&1 &
BACKEND_PID=$!

echo "Backend server started with PID $BACKEND_PID. You can check logs in backend.log"
echo "Please wait a moment for backend services to initialize..."
sleep 3

echo "Testing backend connection..."
if curl -s http://localhost:$BACKEND_PORT/api/health > /dev/null; then
  echo "Backend is running successfully!"
else
  echo "Warning: Backend may not be fully initialized yet, but proceeding with frontend startup"
fi

echo "Starting frontend dev server..."
npm run dev

# When the npm process exits, also kill the backend process
echo "Shutting down backend server (PID: $BACKEND_PID)..."
kill $BACKEND_PID 2>/dev/null || true
