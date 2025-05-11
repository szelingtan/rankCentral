import os
import io
import zipfile
from datetime import datetime
from zoneinfo import ZoneInfo

def create_zip_from_report_data(report_data):
    """Create a zip file in memory from report data"""
    try:
        # Create a zip buffer in memory
        zip_buffer = io.BytesIO()
        
        # Get file data
        file_data = report_data["csv_files"]
        
        # Create a zip file in memory
        with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
            for file_dict in file_data:
                for filename, content in file_dict.items():
                    # Write each CSV to the zip file
                    zip_file.writestr(filename, content)
        
        # Move to the beginning of the BytesIO buffer
        zip_buffer.seek(0)
        
        return zip_buffer
    except Exception as e:
        print(f"Error creating zip file: {str(e)}")
        return None

def format_timestamp(timestamp):
    """Format timestamp for filenames"""
    try:
        # Convert timestamp to datetime object if it's a string
        if isinstance(timestamp, str):
            timestamp = datetime.fromisoformat(timestamp)
            
        # Convert to Asia/Singapore timezone
        timestamp = timestamp.astimezone(ZoneInfo("Asia/Singapore"))
        
        # Format: DD-MMM-YYYY_HHMMSS (e.g., 22-Apr-2025_100000)
        return timestamp.strftime("%d%b%Y-%H%M%S")
    except Exception as e:
        print(f"Error formatting timestamp: {str(e)}")
        return datetime.now().strftime("%d%b%Y-%H%M%S")