
from pymongo import MongoClient
from dotenv import load_dotenv
import os
import time

load_dotenv()

connection_string = os.getenv("MONGODB_CONNECTION_STRING")

# Establish a connection to MongoDB with retry logic
def connect_to_mongodb(connection_string, max_retries=3, retry_delay=2):
    retries = 0
    last_error = None

    while retries < max_retries:
        try:
            # Create a connection using MongoClient
            client = MongoClient(connection_string, serverSelectionTimeoutMS=5000)
            
            # Test the connection
            client.admin.command('ping')
            print("Successfully connected to MongoDB!")
            
            return client
        except Exception as e:
            last_error = e
            retries += 1
            if retries < max_retries:
                print(f"Failed to connect to MongoDB (attempt {retries}/{max_retries}): {e}")
                print(f"Retrying in {retry_delay} seconds...")
                time.sleep(retry_delay)
            else:
                print(f"Failed to connect to MongoDB after {max_retries} attempts: {e}")
    
    return None

# Create a database access function
def get_database(client, db_name):
    return client[db_name]

# Example usage in your backend server
def setup_mongodb_connection():
    # Connect to MongoDB
    if not connection_string:
        print("Warning: MongoDB connection string is not set in environment variables")
        print("Using connection string from MONGODB_CONNECTION_STRING environment variable")
        print("Make sure MongoDB is running and accessible")
        return None
    
    # Extract database name from connection string for better error messages
    db_name = connection_string.split("/")[-1] if "/" in connection_string else "rankCentral_DB"
    print(f"Attempting to connect to MongoDB database: {db_name}")
    
    client = connect_to_mongodb(connection_string)
    
    if client is not None:
        # Get the database
        db = get_database(client, db_name)
        print(f"Connected to MongoDB database: {db_name}")
        return db
    else:
        print("Unable to connect to MongoDB. Check your connection string and ensure MongoDB is running.")
        print(f"Connection string format should be: mongodb://[username:password@]host[:port]/[database]")
        return None

# In your main server code (e.g., with Flask or FastAPI)
db = setup_mongodb_connection()
