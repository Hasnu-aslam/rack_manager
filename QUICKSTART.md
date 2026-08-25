# Quick Start Guide

## Prerequisites

- Python 3.9+ installed
- Node.js 18+ and npm installed
- PostgreSQL database (optional for initial testing - can use SQLite for development)

## Quick Start

### Option 1: Use the startup scripts

**Terminal 1 - Backend:**
```bash
./start_backend.sh
```

**Terminal 2 - Frontend:**
```bash
./start_frontend.sh
```

### Option 2: Manual start

**Backend:**
```bash
cd backend
python3 -m pip install --user -r requirements.txt
python3 -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Access the Application

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## Database Setup (Optional)

If you want to use PostgreSQL:

1. Create a database:
```bash
createdb rack_manager
```

2. Update `backend/.env`:
```
DATABASE_URL=postgresql://user:password@localhost:5432/rack_manager
```

3. Run migrations:
```bash
cd backend
alembic upgrade head
python scripts/init_db.py
```

## Default Login

After running `python scripts/init_db.py`:
- Username: `admin`
- Password: `admin123`

## Troubleshooting

### Backend errors:
- Make sure all Python dependencies are installed: `pip install -r requirements.txt`
- Check that PostgreSQL is running (if using PostgreSQL)
- Verify DATABASE_URL in `.env` file

### Frontend errors:
- Run `npm install` to install dependencies
- Check that backend is running on port 8000
- Verify `NEXT_PUBLIC_API_URL` in `.env.local`

### Port already in use:
- Backend: Change port in uvicorn command: `--port 8001`
- Frontend: Change port: `npm run dev -- -p 3001`
