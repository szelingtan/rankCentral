# backend/models/user.py
from werkzeug.security import generate_password_hash
from datetime import datetime
from bson import ObjectId

class User:
    def __init__(self, email, password, role="user", user_id=None):
        self.email = email
        self.password = generate_password_hash(password)
        self.role = role
        self.created_at = datetime.now().isoformat()
        self.last_login = None
        self.user_id = user_id or str(ObjectId())  # Generate MongoDB-compatible ID if not provided
        
        # User-specific settings (without API keys)
        self.preferences = {
            "max_reports": 5,  # Maximum number of reports to keep
            "default_evaluation_method": "criteria"  # Default evaluation method
        }
        
        # Usage tracking
        self.usage = {
            "total_comparisons": 0,
            "total_documents": 0,
            "last_activity": self.created_at
        }
    
    def to_dict(self):
        """Convert user object to dictionary for MongoDB storage"""
        return {
            "_id": ObjectId(self.user_id) if isinstance(self.user_id, str) else self.user_id,
            "email": self.email,
            "password": self.password,
            "role": self.role,
            "created_at": self.created_at,
            "last_login": self.last_login,
            "preferences": self.preferences,
            "usage": self.usage
        }
    
    @classmethod
    def from_dict(cls, data):
        """Create user object from dictionary"""
        user = cls(
            email=data["email"],
            password="",  # Password is already hashed
            role=data.get("role", "user"),
            user_id=str(data.get("_id", ""))
        )
        user.password = data["password"]  # Use the hashed password directly
        user.created_at = data.get("created_at", datetime.now().isoformat())
        user.last_login = data.get("last_login")
        user.preferences = data.get("preferences", {
            "max_reports": 10,
            "default_evaluation_method": "criteria"
        })
        user.usage = data.get("usage", {
            "total_comparisons": 0,
            "total_documents": 0,
            "last_activity": user.created_at
        })
        return user
    
    def update_last_login(self):
        """Update the last login timestamp"""
        self.last_login = datetime.now().isoformat()
        return self
    
    def track_report_creation(self):
        """Track when a user creates a new report"""
        # Increment report count if field exists, otherwise initialize it
        if "total_reports" not in self.usage:
            self.usage["total_reports"] = 0
        self.usage["total_reports"] += 1
        self.usage["last_activity"] = datetime.now().isoformat()
        return self
        
    def track_comparison(self, document_count=2):
        """Track a new comparison"""
        self.usage["total_comparisons"] += 1
        self.usage["total_documents"] += document_count
        self.usage["last_activity"] = datetime.now().isoformat()
        return self
    
    def update_preferences(self, new_preferences):
        """Update user preferences"""
        self.preferences.update(new_preferences)
        return self