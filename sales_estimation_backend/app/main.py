from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List
from datetime import date, datetime
import psycopg

from app.database import get_db, create_tables
from app.models import EstimationRequest, EstimationRequestCreate, EstimationRequestUpdate, EstimationRequestResponse, STATUS_OPTIONS

app = FastAPI(title="Sales Estimation Support Tool", version="1.0.0")

# Disable CORS. Do not remove this for full-stack development.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

@app.on_event("startup")
def startup_event():
    create_tables()

@app.get("/")
def root():
    return {"message": "Sales Estimation API is running"}

@app.get("/healthz")
async def healthz():
    return {"status": "ok"}

@app.get("/api/status-options")
async def get_status_options():
    return {"status_options": STATUS_OPTIONS}

@app.post("/api/estimation-requests", response_model=EstimationRequestResponse)
async def create_estimation_request(
    request: EstimationRequestCreate,
    db: Session = Depends(get_db)
):
    db_request = EstimationRequest(**request.dict())
    db.add(db_request)
    db.commit()
    db.refresh(db_request)
    return db_request

@app.get("/api/estimation-requests", response_model=List[EstimationRequestResponse])
async def get_estimation_requests(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db)
):
    requests = db.query(EstimationRequest).offset(skip).limit(limit).all()
    return requests

@app.get("/api/estimation-requests/{request_id}", response_model=EstimationRequestResponse)
async def get_estimation_request(
    request_id: int,
    db: Session = Depends(get_db)
):
    request = db.query(EstimationRequest).filter(EstimationRequest.id == request_id).first()
    if request is None:
        raise HTTPException(status_code=404, detail="Estimation request not found")
    return request

@app.put("/api/estimation-requests/{request_id}", response_model=EstimationRequestResponse)
async def update_estimation_request(
    request_id: int,
    request_update: EstimationRequestUpdate,
    db: Session = Depends(get_db)
):
    request = db.query(EstimationRequest).filter(EstimationRequest.id == request_id).first()
    if request is None:
        raise HTTPException(status_code=404, detail="Estimation request not found")
    
    update_data = request_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(request, field, value)
    
    request.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(request)
    return request

@app.delete("/api/estimation-requests/{request_id}")
async def delete_estimation_request(
    request_id: int,
    db: Session = Depends(get_db)
):
    request = db.query(EstimationRequest).filter(EstimationRequest.id == request_id).first()
    if request is None:
        raise HTTPException(status_code=404, detail="Estimation request not found")
    
    db.delete(request)
    db.commit()
    return {"message": "Estimation request deleted successfully"}
