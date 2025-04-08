
#!/bin/bash

# Set port (default to 5002 if not provided)
PORT=${1:-5002}

# Export port as environment variable
export PORT=$PORT

# Run the backend server
echo "Starting backend server on port $PORT..."
python backend/api.py
