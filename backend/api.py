import os
from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from dotenv import load_dotenv
from datetime import timedelta

# Import blueprints
from routes.auth import auth_bp
from routes.health import health_bp
from routes.reports import reports_bp
from routes.document import documents_bp
from routes.criteria import criteria_bp

# Import database connection
from backend.utils.db_connection import setup_mongodb_connection

# Load environment variables
load_dotenv()

def create_app():
    """Factory function to create the Flask application"""
    app = Flask(__name__)
    
    # Configure CORS
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)
    
    # Setup MongoDB connection
    db = setup_mongodb_connection()
    
    # Configure uploads folder
    from backend.utils.file_utils import setup_upload_folder
    app.config['UPLOAD_FOLDER'] = setup_upload_folder()
    
    # Configure JWT
    app.config['JWT_SECRET_KEY'] = os.environ.get('JWT_SECRET_KEY')
    app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=1)
    jwt = JWTManager(app)
    
    # Setup JWT token blocklist
    from backend.utils.jwt_utils import jwt_blacklist, check_if_token_in_blacklist
    jwt.token_in_blocklist_loader(check_if_token_in_blacklist)
    
    # Setup JWT error handlers
    from backend.utils.jwt_utils import setup_jwt_error_handlers
    setup_jwt_error_handlers(jwt)
    
    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(health_bp, url_prefix='/api')
    app.register_blueprint(reports_bp, url_prefix='/api')
    app.register_blueprint(documents_bp, url_prefix='/api')
    app.register_blueprint(criteria_bp, url_prefix='/api')
    
    return app

# Create the Flask application
app = create_app()

if __name__ == '__main__':
    # Get port from environment variable or use default
    port = int(os.environ.get('PORT', 5003))
    
    print(f"Starting backend server on port {port}...")
    print(f"API will be available at: http://localhost:{port}/api/health")
    print(f"Temporary uploads directory: {app.config['UPLOAD_FOLDER']}")
    print(f"OpenAI API key status: {'Configured' if os.getenv('OPENAI_API_KEY') else 'Not configured'}")
    
    # Use the host 0.0.0.0 to make the server externally visible
    app.run(host='0.0.0.0', port=port, debug=True)