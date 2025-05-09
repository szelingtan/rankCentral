# routes/health.py
import os
from flask import Blueprint, jsonify, current_app
from datetime import datetime
from utils.db_connection import setup_mongodb_connection

# Initialize blueprint
health_bp = Blueprint('health', __name__)

# Get database connection
db = setup_mongodb_connection()

@health_bp.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint to verify backend is running properly"""
    try:
        # Test MongoDB connection if available
        db_status = "connected" if db is not None else "not connected"
        
        # Check if PDF upload folder is accessible
        upload_folder = current_app.config['UPLOAD_FOLDER']
        folder_status = "accessible" if os.access(upload_folder, os.W_OK) else "not accessible"
        
        # Check OpenAI API key
        openai_api_key = os.getenv("OPENAI_API_KEY")
        openai_key_status = "configured" if openai_api_key and len(openai_api_key) > 20 else "not configured"
        
        return jsonify({
            "status": "healthy", 
            "message": "PDF Comparison API is running",
            "version": "1.0.0",
            "timestamp": datetime.now().isoformat(),
            "diagnostics": {
                "mongodb": db_status,
                "upload_folder": folder_status,
                "upload_path": upload_folder,
                "openai_api": openai_key_status
            }
        })
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "message": f"Health check failed: {str(e)}",
            "timestamp": datetime.now().isoformat()
        }), 500