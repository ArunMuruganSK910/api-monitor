from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import desc
from database import engine, get_db, Base
from models import Monitor, Check
from pydantic import BaseModel
from typing import Optional
import httpx
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:3001", "https://api-monitor-frontend-b89x.onrender.com"],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
)

class MonitorCreate(BaseModel):
    name: str
    url: str

def check_url(url: str):
    try:
        start = datetime.now()
        response = httpx.get(url, timeout=10)
        response_time = (datetime.now() - start).total_seconds() * 1000
        return {
            "is_up": response.status_code < 500,
            "response_time": round(response_time, 2),
            "status_code": response.status_code
        }
    except Exception:
        return {
            "is_up": False,
            "response_time": 0,
            "status_code": 0
        }

def run_checks():
    from database import SessionLocal
    db = SessionLocal()
    try:
        monitors = db.query(Monitor).all()
        for monitor in monitors:
            result = check_url(monitor.url)
            check = Check(
                monitor_id=monitor.id,
                is_up=result["is_up"],
                response_time=result["response_time"],
                status_code=result["status_code"]
            )
            db.add(check)
            monitor.is_up = result["is_up"]
            monitor.response_time = result["response_time"]
            monitor.last_checked = datetime.now()
            recent_checks = db.query(Check).filter(
                Check.monitor_id == monitor.id
            ).order_by(desc(Check.checked_at)).limit(100).all()
            if recent_checks:
                up_count = sum(1 for c in recent_checks if c.is_up)
                monitor.uptime_percent = round((up_count / len(recent_checks)) * 100, 1)
            db.commit()
    finally:
        db.close()

scheduler = BackgroundScheduler()
scheduler.add_job(run_checks, "interval", minutes=5)
scheduler.start()

@app.get("/")
def home():
    return {"message": "API Monitor is running!"}

@app.get("/monitors")
def get_monitors(db: Session = Depends(get_db)):
    monitors = db.query(Monitor).all()
    return {"monitors": monitors}

@app.post("/monitors")
def add_monitor(monitor: MonitorCreate, db: Session = Depends(get_db)):
    new_monitor = Monitor(name=monitor.name, url=monitor.url)
    db.add(new_monitor)
    db.commit()
    db.refresh(new_monitor)
    result = check_url(monitor.url)
    new_monitor.is_up = result["is_up"]
    new_monitor.response_time = result["response_time"]
    new_monitor.last_checked = datetime.now()
    check = Check(
        monitor_id=new_monitor.id,
        is_up=result["is_up"],
        response_time=result["response_time"],
        status_code=result["status_code"]
    )
    db.add(check)
    db.commit()
    db.refresh(new_monitor)
    return {"message": "Monitor added!", "monitor": new_monitor}

@app.delete("/monitors/{monitor_id}")
def delete_monitor(monitor_id: int, db: Session = Depends(get_db)):
    monitor = db.query(Monitor).filter(Monitor.id == monitor_id).first()
    if monitor is None:
        return {"error": "Monitor not found"}
    db.query(Check).filter(Check.monitor_id == monitor_id).delete()
    db.delete(monitor)
    db.commit()
    return {"message": "Monitor deleted!"}

@app.get("/monitors/{monitor_id}/checks")
def get_checks(monitor_id: int, db: Session = Depends(get_db)):
    checks = db.query(Check).filter(
        Check.monitor_id == monitor_id
    ).order_by(desc(Check.checked_at)).limit(50).all()
    return {"checks": checks}

@app.post("/monitors/{monitor_id}/check")
def manual_check(monitor_id: int, db: Session = Depends(get_db)):
    monitor = db.query(Monitor).filter(Monitor.id == monitor_id).first()
    if monitor is None:
        return {"error": "Monitor not found"}
    result = check_url(monitor.url)
    check = Check(
        monitor_id=monitor.id,
        is_up=result["is_up"],
        response_time=result["response_time"],
        status_code=result["status_code"]
    )
    db.add(check)
    monitor.is_up = result["is_up"]
    monitor.response_time = result["response_time"]
    monitor.last_checked = datetime.now()
    db.commit()
    db.refresh(monitor)
    return {"message": "Check complete!", "result": result, "monitor": monitor}