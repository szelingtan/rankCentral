
from pymongo import MongoClient
from dotenv import load_dotenv
import os

load_dotenv()

connection_string = os.getenv("MONGODB_CONNECTION_STRING")

# Establish a connection to MongoDB
def connect_to_mongodb(connection_string):
    try:
        # Create a connection using MongoClient
        client = MongoClient(connection_string)
        
        # Test the connection
        client.admin.command('ping')
        print("Successfully connected to MongoDB!")
        
        return client
    except Exception as e:
        print(f"Failed to connect to MongoDB: {e}")
        return None

# Create a database access function
def get_database(client, db_name):
    return client[db_name]

# Example usage in your backend server
def setup_mongodb_connection():
    # Connect to MongoDB
    client = connect_to_mongodb(connection_string)
    
    if client:
        # Get the database
        db = get_database(client, "rankCentral_DB")
        
        return db
    else:
        return None

# In your main server code (e.g., with Flask or FastAPI)
db = setup_mongodb_connection()
