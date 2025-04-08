
#!/bin/bash

# This script tests if the backend server is running correctly

# Get port (default to 5002)
PORT=${1:-5002}

echo "Testing backend connection on port $PORT..."

# Check if curl is available
if command -v curl &> /dev/null; then
  # Use curl to test the connection
  response=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$PORT/api/health)
  
  if [ "$response" = "200" ]; then
    echo "SUCCESS: Backend is running correctly on port $PORT"
    echo "API health endpoint returned HTTP 200"
    echo "Details:"
    curl -s http://localhost:$PORT/api/health | jq || curl -s http://localhost:$PORT/api/health
  else
    echo "ERROR: Backend is not responding on port $PORT"
    echo "API health endpoint returned HTTP $response"
  fi
else
  echo "curl not found. Please install curl to test the backend."
fi

# Additional connection info
echo -e "\nBackend URL should be: http://localhost:$PORT/api/health"
echo "Make sure this port matches what's used in your frontend configuration."
