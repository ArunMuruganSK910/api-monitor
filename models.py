from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime
from sqlalchemy.sql import func
from database import Base

class Monitor(Base):
    __tablename__ = "monitors"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    url = Column(String, nullable=False)
    is_up = Column(Boolean, default=True)
    response_time = Column(Float, default=0)
    uptime_percent = Column(Float, default=100)
    last_checked = Column(DateTime, default=func.now())
    created_at = Column(DateTime, default=func.now())

class Check(Base):
    __tablename__ = "checks"

    id = Column(Integer, primary_key=True, index=True)
    monitor_id = Column(Integer, nullable=False)
    is_up = Column(Boolean)
    response_time = Column(Float)
    status_code = Column(Integer)
    checked_at = Column(DateTime, default=func.now())