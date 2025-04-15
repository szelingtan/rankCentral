
#!/bin/bash

# Set port (default to 5003 if not provided)
PORT=${1:-5003}

# Export port as environment variable
export PORT=$PORT

# Make sure script has execute permissions
chmod +x run_backend.sh

# Run the backend server
echo "Starting backend server on port $PORT..."
python backend/api.py

