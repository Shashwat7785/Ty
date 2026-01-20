import os
from app import app, db
from sqlalchemy import inspect

def verify_azure_db():
    with app.app_context():
        # 1. Print current working directory and database path
        print(f"DEBUG: Current Directory: {os.getcwd()}", flush=True)
        db_uri = app.config.get('SQLALCHEMY_DATABASE_URI')
        print(f"DEBUG: Database URI: {db_uri}", flush=True)

        # 2. Check if the file physically exists
        db_path = db_uri.replace('sqlite:///', '')
        if os.path.exists(db_path):
            print(f"DEBUG: Database file found at {db_path}", flush=True)
            print(f"DEBUG: File Size: {os.path.getsize(db_path)} bytes", flush=True)
        else:
            print(f"DEBUG: CRITICAL - Database file NOT found!", flush=True)

        # 3. List all tables found in the database
        inspector = inspect(db.engine)
        tables = inspector.get_table_names()
        print(f"DEBUG: Tables found in DB: {tables}", flush=True)

        if 'user' in tables:
            print("DEBUG: 'user' table is present and ready.", flush=True)
        else:
            print("DEBUG: 'user' table is MISSING from the current DB file.", flush=True)

if __name__ == "__main__":
    verify_azure_db()
