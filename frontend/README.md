# API Monitor Dashboard

A full-stack uptime monitoring tool. Add any API endpoint and the backend automatically pings it every 5 minutes, tracking uptime, response time, and status history.

**Live Demo**
- Frontend: https://api-monitor-frontend-b89x.onrender.com
- Backend API: https://api-monitor-v9hg.onrender.com

---

## Tech Stack

**Backend** — Python, FastAPI, SQLAlchemy, APScheduler, Supabase PostgreSQL, deployed on Render

**Frontend** — React, Framer Motion, deployed on Render as a Static Site

---

## Features

- Add any URL to monitor
- Backend auto-pings every 5 minutes via APScheduler
- Tracks uptime %, response time (ms), and up/down status
- View check history per monitor
- Manual check trigger
- Delete monitors
- Neo-brutalist UI — cream background, thick borders, hard shadows, scrolling ticker tape
- Framer Motion animations throughout

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/monitors` | Get all monitors |
| POST | `/monitors` | Add a new monitor |
| DELETE | `/monitors/{id}` | Delete a monitor |
| GET | `/monitors/{id}/checks` | Get check history |
| POST | `/monitors/{id}/check` | Trigger a manual check |

---

## Run Locally

**Backend**
```bash
cd api-monitor
python -m venv venv
venv\Scripts\activate.bat
pip install -r requirements.txt
uvicorn main:app --reload
```

**Frontend**
```bash
cd api-monitor/frontend
npm install --legacy-peer-deps
npm start
```

Set your `DATABASE_URL` environment variable to your Supabase PostgreSQL connection string.