
@echo off
setlocal

rem Set port (default to 5002 if not provided)
if "%1"=="" (
    set PORT=5002
) else (
    set PORT=%1
)

rem Export port as environment variable
set PORT=%PORT%

rem Run the backend server
echo Starting backend server on port %PORT%...
python backend/api.py

endlocal
