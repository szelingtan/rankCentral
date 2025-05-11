
# backend/routes/auth.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, create_refresh_token, 
    jwt_required, get_jwt_identity, get_jwt
)
from werkzeug.security import check_password_hash
from utils.db_connection import setup_mongodb_connection
from models.user import User
from utils.jwt_utils import jwt_blacklist

# Initialize blueprint
auth_bp = Blueprint('auth', __name__)

# Get database connection
db = setup_mongodb_connection()
users_collection = db["users"] if db is not None else None

@auth_bp.route('/register', methods=['POST'])
def register():
    """Register a new user"""
    if not users_collection:
        return jsonify({"error": "Database not connected"}), 500
        
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Invalid JSON data"}), 400

        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400

        if users_collection.find_one({"email": email}):
            return jsonify({"error": "User already exists"}), 400

        user = User(email, password)
        result = users_collection.insert_one(user.to_dict())
        
        # Generate tokens
        user_identity = {"id": str(result.inserted_id), "email": email}
        access_token = create_access_token(identity=user_identity)
        refresh_token = create_refresh_token(identity=user_identity)
        
        return jsonify({
            "message": "User registered successfully",
            "access_token": access_token,
            "refresh_token": refresh_token,
            "user": {"id": str(result.inserted_id), "email": email}
        }), 201
        
    except Exception as e:
        # Log the error for debugging
        print(f"Registration error: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@auth_bp.route('/login', methods=['POST'])
def login():
    """User login endpoint"""
    if not users_collection:
        return jsonify({"error": "Database not connected"}), 500
        
    try:
        data = request.json
        if not data:
            return jsonify({"error": "Invalid JSON data"}), 400
            
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({"error": "Email and password are required"}), 400

        user = users_collection.find_one({"email": email})
        if not user or not check_password_hash(user['password'], password):
            return jsonify({"error": "Invalid email or password"}), 401

        access_token = create_access_token(identity={"id": str(user['_id']), "email": user['email']})
        refresh_token = create_refresh_token(identity={"id": str(user['_id']), "email": user['email']})
        
        return jsonify({
            "access_token": access_token, 
            "refresh_token": refresh_token,
            "user": {"id": str(user['_id']), "email": user['email']}
        }), 200
        
    except Exception as e:
        # Log the error for debugging
        print(f"Login error: {str(e)}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500

@auth_bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh access token"""
    try:
        current_user = get_jwt_identity()
        new_access_token = create_access_token(identity=current_user)
        return jsonify({"access_token": new_access_token}), 200
    except Exception as e:
        return jsonify({"error": f"Token refresh failed: {str(e)}"}), 500

@auth_bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout user by blacklisting the JWT token"""
    try:
        jti = get_jwt()["jti"]
        jwt_blacklist.add(jti)
        return jsonify({"message": "Successfully logged out"}), 200
    except Exception as e:
        return jsonify({"error": f"Logout failed: {str(e)}"}), 500

@auth_bp.route('/protected', methods=['GET'])
@jwt_required()
def protected():
    """Protected route example"""
    try:
        current_user = get_jwt_identity()
        return jsonify({"message": f"Hello, {current_user['email']}! This is a protected route."}), 200
    except Exception as e:
        return jsonify({"error": f"Protected route access failed: {str(e)}"}), 500
