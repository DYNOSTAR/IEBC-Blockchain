# IEBC Blockchain Voting System (Phase 1)

This repository contains the Phase 1 scaffold:
- **Backend**: Node.js + Express + PostgreSQL
- **Frontend**: React + Vite + Tailwind CSS

If you want to run this locally in **VS Code**, follow the guide below.

## 1) Prerequisites

Install:
- Node.js 18+ (Node 20/22 recommended)
- npm 9+
- Docker Desktop (for PostgreSQL)
- VS Code

## 2) Open project in VS Code

1. Open VS Code.
2. `File` → `Open Folder...` → select this project root (`IEBC-Blockchain`).
3. Open an integrated terminal: `Terminal` → `New Terminal`.

## 3) Configure environment files

Create local env files from templates:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Update values in `backend/.env` if your DB credentials differ.

## 4) Start PostgreSQL (Docker)

If you already have a Postgres container running with these credentials, skip this section.

Example one-liner:

```bash
docker run -d \
  --name voting-postgres \
  -e POSTGRES_DB=voting_db \
  -e POSTGRES_USER=voting_user \
  -e POSTGRES_PASSWORD=voting_pass123 \
  -p 5432:5432 \
  postgres:16
```

Verify:

```bash
docker ps
```

## 5) Install dependencies

In **Terminal A**:

```bash
cd backend
npm install
```

In **Terminal B**:

```bash
cd frontend
npm install
```

## 6) Run backend

In **Terminal A** (`backend`):

```bash
npm run check-db
npm run dev
```

Backend expected on: `http://localhost:3000`

Health check:

```bash
curl http://localhost:3000/health
```

## 7) Run frontend

In **Terminal B** (`frontend`):

```bash
npm run dev
```

Frontend expected on: `http://localhost:5173`

## 8) Quick API checks

```bash
curl http://localhost:3000/api/elections
curl http://localhost:3000/api/counties
```

## 9) VS Code workflow tips

- Use two terminals side-by-side (backend + frontend).
- Optional: use the included VS Code tasks:
  - `Terminal` → `Run Task...`
  - `Backend: dev`
  - `Frontend: dev`

## 10) Common issues

- **`E403` during `npm install`**: corporate/private npm proxy policy issue. Fix npm registry/proxy config and retry.
- **`ECONNREFUSED 5432`**: PostgreSQL is not running or wrong host/port.
- **Frontend shows offline API**: backend not running or `VITE_API_URL` incorrect.
