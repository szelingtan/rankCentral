
@echo off
setlocal

rem Set port (default to 5003 if not provided)
if "%1"=="" (
    set PORT=5003
) else (
    set PORT=%1
)

rem Export port as environment variable
set PORT=%PORT%

rem Run the backend server
echo Starting backend server on port %PORT%...
python backend/api.py

endlocal
