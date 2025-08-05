#!/usr/bin/env python3
"""Test script to verify PostgreSQL database connection and table creation."""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.database import engine, create_tables
from app.models import EstimationRequest
from sqlalchemy.orm import sessionmaker
from datetime import date

def test_connection():
    try:
        with engine.connect() as connection:
            print("✓ PostgreSQL connection successful!")
        
        create_tables()
        print("✓ Database tables created successfully!")
        
        SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
        db = SessionLocal()
        
        test_record = EstimationRequest(
            request_date=date.today(),
            project_name="PostgreSQL Migration Test",
            status="未着手"
        )
        db.add(test_record)
        db.commit()
        db.refresh(test_record)
        print(f"✓ Test record created with ID: {test_record.id}")
        
        retrieved = db.query(EstimationRequest).filter(EstimationRequest.id == test_record.id).first()
        if retrieved:
            print(f"✓ Test record retrieved: {retrieved.project_name}")
        
        db.delete(test_record)
        db.commit()
        db.close()
        print("✓ Test record cleaned up successfully!")
        
        print("\n🎉 PostgreSQL migration test completed successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Database connection test failed: {e}")
        return False

if __name__ == "__main__":
    success = test_connection()
    sys.exit(0 if success else 1)
