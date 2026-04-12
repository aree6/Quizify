# Quizify

Workable MVP now includes:

- Frontend (React + Vite + Tailwind) with lecturer/admin pages and public `/quiz` flow
- Backend (Node.js + Express) for course generation, public access, quiz submission, and analytics
- Supabase SQL schema for core entities and basic RLS policies

Quick start:

```bash
# 1) Apply DB schema in Supabase SQL Editor
#    File: supabase/mvp_schema.sql

# 2) Start backend
cd backend
cp .env.example .env
npm install
npm run dev

# 3) Start frontend
cd ../frontend
cp .env.example .env.local
npm install
npm run dev
```

Environment:

- Backend `.env`
  - `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `PORT` (default `3001`)
  - `CORS_ORIGIN` (default `http://localhost:5173`)
- Frontend `.env.local`
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
  - `VITE_API_URL` (default `http://localhost:3001`)
  - `VITE_BASE_PATH` (set to repo path for GitHub Pages)
