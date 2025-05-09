# models/user.py
from werkzeug.security import generate_password_hash
from datetime import datetime

class User:
    def __init__(self, email, password, role="user"):
        self.email = email
        self.password = generate_password_hash(password)
        self.role = role
        self.created_at = datetime.now().isoformat()
        self.last_login = None
    
    def to_dict(self):
        """Convert user object to dictionary for MongoDB storage"""
        return {
            "email": self.email,
            "password": self.password,
            "role": self.role,
            "created_at": self.created_at,
            "last_login": self.last_login
        }
    
    @classmethod
    def from_dict(cls, data):
        """Create user object from dictionary"""
        user = cls(
            email=data["email"],
            password="",  # Password is already hashed
            role=data.get("role", "user")
        )
        user.password = data["password"]  # Use the hashed password directly
        user.created_at = data.get("created_at", datetime.now().isoformat())
        user.last_login = data.get("last_login")
        return user