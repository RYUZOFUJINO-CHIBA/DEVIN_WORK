from sqlalchemy import Column, Integer, String, Date, Text, DateTime, create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime, date
from pydantic import BaseModel
from typing import Optional

Base = declarative_base()

class EstimationRequest(Base):
    __tablename__ = "estimation_requests"
    
    id = Column(Integer, primary_key=True, index=True)
    request_date = Column(Date, nullable=False)  # 依頼日
    desired_estimation_date = Column(Date, nullable=True)  # 積算希望日
    project_name = Column(String(255), nullable=False)  # 案件名
    zac_project_number = Column(String(100), nullable=True)  # ZAC案件番号
    sales_person = Column(String(100), nullable=True)  # 営業担当
    estimation_person = Column(String(100), nullable=True)  # 積算担当
    status = Column(String(50), nullable=False, default="未着手")  # ステータス
    estimation = Column(Text, nullable=True)  # 積算
    completion_date = Column(Date, nullable=True)  # 完了日
    remarks = Column(Text, nullable=True)  # 備考
    estimation_materials = Column(Text, nullable=True)  # 積算資料
    box_url = Column(String(500), nullable=True)  # BOXURL
    others = Column(Text, nullable=True)  # その他
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class EstimationRequestBase(BaseModel):
    request_date: date
    desired_estimation_date: Optional[date] = None
    project_name: str
    zac_project_number: Optional[str] = None
    sales_person: Optional[str] = None
    estimation_person: Optional[str] = None
    status: str = "未着手"
    estimation: Optional[str] = None
    completion_date: Optional[date] = None
    remarks: Optional[str] = None
    estimation_materials: Optional[str] = None
    box_url: Optional[str] = None
    others: Optional[str] = None

class EstimationRequestCreate(EstimationRequestBase):
    pass

class EstimationRequestUpdate(BaseModel):
    request_date: Optional[date] = None
    desired_estimation_date: Optional[date] = None
    project_name: Optional[str] = None
    zac_project_number: Optional[str] = None
    sales_person: Optional[str] = None
    estimation_person: Optional[str] = None
    status: Optional[str] = None
    estimation: Optional[str] = None
    completion_date: Optional[date] = None
    remarks: Optional[str] = None
    estimation_materials: Optional[str] = None
    box_url: Optional[str] = None
    others: Optional[str] = None

class EstimationRequestResponse(EstimationRequestBase):
    id: int
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True

STATUS_OPTIONS = [
    "未着手",
    "資料待ち", 
    "着手中",
    "検討中",
    "見積もり待",
    "ZAC登録待",
    "完了",
    "中止"
]
