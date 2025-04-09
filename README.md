
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
4. Create an `.env` file in the project root with the following content:
```
VITE_API_URL=http://localhost:5002
```

## Running the Application

### Start the backend:
```
# Linux/Mac
chmod +x run_backend.sh  # Make script executable (first time only)
./run_backend.sh [port]  # Default port is 5002 if not specified

# Windows
run_backend.bat [port]  # Default port is 5002 if not specified
```

### Start the frontend:
```
npm run dev
```

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

4. Check that CORS is properly configured on your backend:
   - The backend needs to allow requests from your frontend origin
   - The Python Flask API has CORS enabled with `CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)`

5. Verify that the port in your `.env` file matches the port where the backend is running

6. Try accessing the backend health endpoint directly in your browser:
   - http://localhost:5002/api/health

## API Endpoints

- `/api/health` - Check if the backend is running
- `/api/upload-pdfs` - Upload PDF documents for comparison
- `/api/compare-documents` - Compare uploaded documents
- `/api/download-report` - Download the latest comparison report
- `/api/report-history` - Get history of past reports
