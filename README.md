
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

### Option 1: Separate Terminals

**Start the backend:**
```
# Linux/Mac
./run_backend.sh [port]  # Default port is 5002 if not specified

# Windows
run_backend.bat [port]  # Default port is 5002 if not specified
```

**Start the frontend:**
```
npm run dev
```

### Option 2: All-in-One (Linux/Mac only)

```
./run_app.sh
```

## Important Notes

- The frontend and backend must be running simultaneously
- The backend server must be accessible from the browser
- The backend runs on port 5002 by default, but you can change it using the environment variable `PORT`
- If using a different port, make sure your firewall allows connections to that port

## Troubleshooting

If you see "Backend not connected" errors:

1. Make sure the backend server is running
2. Check if there are any error messages in the backend terminal
3. Verify your firewall settings allow the connection
4. Try restarting both the frontend and backend servers

## API Endpoints

- `/api/health` - Check if the backend is running
- `/api/upload-pdfs` - Upload PDF documents for comparison
- `/api/compare-documents` - Compare uploaded documents
- `/api/download-report` - Download the latest comparison report
- `/api/report-history` - Get history of past reports
