# ScamTracer

## Tech Stack

- Frontend: React + TypeScript + Vite
- Backend: Python 3 + `http.server` + `psycopg` (raw SQL)
- Database: PostgreSQL (Supabase-compatible schema)

## Project Structure

- `Backend/`
  - `server.py` HTTP API server (default port `8000`)
  - `raw_sql_queries.py` SQL data access layer
  - `Schema.sql` DB schema
  - `requirements.txt` Python dependencies
- `Frontend/Frontend/`
  - React app (default dev port `5173`)
  - Vite proxy maps `/api/*` to backend `http://localhost:8000/*`

## Prerequisites

- Python `3.11+` (or recent Python 3)
- Node.js `18+` and npm
- PostgreSQL database (Supabase project is fine)

## 1) Database Setup

Run the SQL in `Backend/Schema.sql` on your database.

Important: `Schema.sql` expects a DB function used by trigger/procedure paths:

- `normalize_phone_trigger()` (trigger function on `phone_numbers`)
- `submit_fraud_report(varchar, varchar, text)` (optional but used if available)

If `submit_fraud_report(...)` is missing, backend code falls back to direct insert logic.

## 2) Environment Variables

Backend needs `DATABASE_URL`.

Create either:
- `Backend/.env.database`, or
- `Backend/.env`

Example:

```env
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME
```

The backend auto-loads both files if present.

## 3) Install Dependencies

### Backend

```bash
cd Backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### Frontend

```bash
cd Frontend/Frontend
npm install
```

## 4) Run the App

Open two terminals.

### Terminal A: Backend

```bash
cd Backend
source .venv/bin/activate
python3 server.py
```

Backend runs at:
- `http://localhost:8000`

### Terminal B: Frontend

```bash
cd Frontend/Frontend
npm run dev
```

Frontend runs at:
- `http://localhost:5173`

## 5) Quick Verification Flow

1. Open `http://localhost:5173`
2. Search a number from homepage
3. Submit a fraud report from "Rapportera bluff"
4. Search the same number again and verify report appears
5. Check homepage tabs:
   - Top reported numbers
   - Recent reports
   - Most searched (no reports)
   - Fraud types

## API Endpoints

Base URL: `http://localhost:8000`

- `GET /health`
  - Health check
- `GET /search?number=<phone>`
  - Increments search count and returns insights/reports
- `GET /reports?phone=<phone>`
  - Returns all reports for a phone number
- `POST /reports`
  - Creates a report
  - JSON body:
    ```json
    {
      "number": "0701234567",
      "category": "SMS-bluff",
      "description": "Example description"
    }
    ```
- `GET /number-stats?number=<phone>`
  - Returns search/report totals for one number (read-only)
- `GET /homepage-reports?mode=recent|top|searched&limit=10`
  - Homepage list data
- `GET /fraud-types?limit=20`
  - Fraud type categories with count of unique reported numbers
- `GET /fraud-type-numbers?type=<fraud_type>&limit=100`
  - Numbers linked to a selected fraud type
- `GET /reports/recent?limit=20`
- `GET /stats/top?limit=10`
- `GET /stats/types`

## Notes

- SQL is implemented in `Backend/raw_sql_queries.py` with direct `cur.execute(...)` usage.
- Phone searches are stored in `phone_searches` table.
- Risk in UI is based on search count (`50 searches = 100%` scale in frontend).
- Frontend routes are hash-based (e.g. `#/nummer/<number>`).
