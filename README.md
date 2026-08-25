# Rack Manager - Shoe Store Management System

A comprehensive Progressive Web App (PWA) for managing shoe store inventory, billing, and analytics.

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: FastAPI, Python
- **Database**: PostgreSQL
- **ORM**: SQLAlchemy with Alembic migrations
- **PWA**: next-pwa for offline support

## Features

- ✅ Inventory Management (CRUD operations, stock tracking, low stock alerts)
- ✅ Billing System (Cart management, customer info, payment processing)
- ✅ Dashboard & Analytics (Sales overview, trends, best sellers, category performance)
- ✅ Offline Support (PWA with IndexedDB and background sync)
- ✅ Authentication (JWT-based user authentication)

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+
- PostgreSQL database

### Backend Setup

1. Navigate to backend directory:
```bash
cd backend
```

2. Create virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create `.env` file:
```bash
cp .env.example .env
# Edit .env with your database credentials
```

5. Initialize database:
```bash
alembic upgrade head
python scripts/init_db.py  # Creates admin user (username: admin, password: admin123)
```

6. Run the server:
```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

4. Run the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Project Structure

```
rack_manager/
├── frontend/          # Next.js PWA application
│   ├── app/          # App router pages
│   ├── components/   # Reusable UI components
│   ├── lib/          # Utilities, API clients, offline storage
│   └── hooks/        # Custom React hooks
├── backend/          # FastAPI server
│   ├── app/
│   │   ├── api/      # API route handlers
│   │   ├── models/   # SQLAlchemy models
│   │   ├── schemas/  # Pydantic schemas
│   │   ├── services/ # Business logic
│   │   └── core/     # Config, security, database
│   └── alembic/      # Database migrations
└── README.md
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login and get token
- `GET /api/v1/auth/me` - Get current user info

### Products
- `GET /api/v1/products` - List products
- `GET /api/v1/products/{id}` - Get product
- `POST /api/v1/products` - Create product
- `PUT /api/v1/products/{id}` - Update product
- `DELETE /api/v1/products/{id}` - Delete product
- `POST /api/v1/products/{id}/stock` - Update stock

### Sales
- `GET /api/v1/sales` - List sales
- `GET /api/v1/sales/{id}` - Get sale
- `POST /api/v1/sales` - Create sale

### Customers
- `GET /api/v1/customers` - List customers
- `GET /api/v1/customers/{id}` - Get customer
- `POST /api/v1/customers` - Create customer
- `PUT /api/v1/customers/{id}` - Update customer
- `DELETE /api/v1/customers/{id}` - Delete customer

### Dashboard
- `GET /api/v1/dashboard/stats` - Get comprehensive stats
- `GET /api/v1/dashboard/sales-overview` - Get sales overview
- `GET /api/v1/dashboard/sales-trends` - Get sales trends
- `GET /api/v1/dashboard/best-sellers` - Get best sellers
- `GET /api/v1/dashboard/category-performance` - Get category performance
- `GET /api/v1/dashboard/low-stock` - Get low stock products

## Development

### Running Tests

Backend tests (when implemented):
```bash
cd backend
pytest
```

### Building for Production

Frontend:
```bash
cd frontend
npm run build
npm start
```

Backend:
```bash
cd backend
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## Deployment

### Frontend
Deploy to Vercel, Netlify, or any static hosting service.

### Backend
Deploy to Railway, Render, Fly.io, or AWS EC2/ECS with Docker.

### Database
Use Supabase, Railway PostgreSQL, or AWS RDS.

## License

MIT
