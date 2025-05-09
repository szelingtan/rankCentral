from flask import jsonify
from flask_jwt_extended import get_jwt

# Store revoked tokens in a blacklist
jwt_blacklist = set()

def check_if_token_in_blacklist(jwt_header, jwt_payload):
    """Check if token is in blacklist"""
    jti = jwt_payload["jti"]
    return jti in jwt_blacklist

def setup_jwt_error_handlers(jwt):
    """Setup JWT error handlers"""
    
    @jwt.expired_token_loader
    def expired_token_callback(jwt_header, jwt_payload):
        return jsonify({"error": "Token has expired"}), 401

    @jwt.invalid_token_loader
    def invalid_token_callback(error):
        return jsonify({"error": "Invalid token"}), 401

    @jwt.unauthorized_loader
    def unauthorized_callback(error):
        return jsonify({"error": "Missing or invalid authorization header"}), 401