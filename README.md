# ProgrammingPlus Deployment Guide

## 1) Prepare Environment Files

1. Copy `backend/.env.example` to `backend/.env`.
2. Copy `frontend/.env.example` to `frontend/.env`.
3. Fill real secrets in `backend/.env`:
   - `JWT_SECRET`
   - `GEMINI_API_KEY`
   - `EMAIL_USER`, `EMAIL_PASS`

## 2) Run Locally (without Docker)

1. Backend:
   - `cd backend`
   - `npm install`
   - `npm start`
2. Frontend:
   - `cd frontend`
   - `npm install`
   - `npm run dev`

Frontend expects backend base URL from `VITE_API_BASE_URL`.

## 3) Run with Docker Compose (for tester access)

From repo root:

```bash
docker compose up --build
```

Services:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- Health check: `http://localhost:5000/api/health`
- MongoDB: `mongodb://localhost:27017/programmingplus`

## 4) Production/Scalability Notes

- Keep backend stateless; store only persistent data in MongoDB.
- Use MongoDB Atlas for production and set `MONGO_URI` accordingly.
- Put frontend and backend behind a reverse proxy (Nginx/Cloudflare).
- Set `CORS_ORIGINS` to exact production domains.
- Run multiple backend replicas behind a load balancer.
- Add Redis for rate limiting, queues, and interview session pub/sub at scale.
- Use centralized logging and metrics before going live to larger traffic.

  
