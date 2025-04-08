
# Document Comparison Application

This application compares and ranks documents based on customizable criteria or prompts using AI technology.

## Prerequisites

- Python 3.10 or higher
- Node.js 16 or higher
- MongoDB (optional, for persistent storage)

## Setup

1. Clone the repository
2. Install frontend dependencies:
```
npm install
```
3. Install backend dependencies:
```
pip install -r backend/requirements.txt
```

## Running the Application

### Option 1: Automated Startup (Linux/Mac only)

This method starts both backend and frontend with one command:

```
chmod +x run_app.sh  # Make script executable (first time only)
./run_app.sh
```

### Option 2: Manual Startup

#### Start the backend:
```
# Linux/Mac
chmod +x run_backend.sh  # Make script executable (first time only)
./run_backend.sh [port]  # Default port is 5002 if not specified

# Windows
run_backend.bat [port]  # Default port is 5002 if not specified
```

#### Start the frontend:
```
npm run dev
```

## Frontend and Backend Communication

The frontend will automatically connect to the backend using the same host and port from where the frontend is served. This works in both development and production environments.

## Troubleshooting Backend Connections

If you're experiencing backend connection issues:

1. Verify the backend is running:
```
# Linux/Mac
chmod +x test-backend.sh  # Make script executable (first time only)
./test-backend.sh [port]  # Default port is 5002 if not specified
```

2. Check if there are any error messages in the backend console

3. Ensure your firewall allows connections to the backend port

4. The backend should be accessible at: http://localhost:5002/api/health (adjust port if different)

## API Endpoints

- `/api/health` - Check if the backend is running
- `/api/upload-pdfs` - Upload PDF documents for comparison
- `/api/compare-documents` - Compare uploaded documents
- `/api/download-report` - Download the latest comparison report
- `/api/report-history` - Get history of past reports
