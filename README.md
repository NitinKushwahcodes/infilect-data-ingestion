# Infilect Data Ingestion Service

A backend service that accepts CSV uploads for retail master data, validates every row, and ingests clean data into PostgreSQL. Built with Node.js, Express, and pg.

---

## Tech Stack

- **Node.js + Express** — API server
- **PostgreSQL** — primary database
- **multer** — file upload handling
- **csv-parser** — streaming CSV reads
- **pg** — PostgreSQL client with connection pooling

---

## Project Structure

```
src/
├── config/       → DB connection pool
├── controllers/  → HTTP request/response only
├── services/     → business logic (validate + ingest)
├── validators/   → row-level validation rules
├── utils/        → csv parser, batch insert, normalizer
└── routes/       → API route definitions
sql/
└── schema.sql    → all table definitions
uploads/          → temp storage for uploaded files
```

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create the database

```bash
psql -U postgres -c "CREATE DATABASE infilect_db;"
psql -U postgres -d infilect_db -f sql/schema.sql
```

### 3. Configure environment

Edit `.env` with your actual database credentials:

```
PORT=3000
DB_HOST=localhost
DB_PORT=5432
DB_NAME=infilect_db
DB_USER=postgres
DB_PASSWORD=your_password_here
```

### 4. Run the server

```bash
npm run dev      # development (nodemon)
npm start        # production
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/upload/stores` | Upload stores_master.csv |
| POST | `/api/upload/users` | Upload users_master.csv |
| POST | `/api/upload/mapping` | Upload store_user_mapping.csv |
| GET | `/api/health` | Health check |

### Upload order matters

1. `/api/upload/stores` and `/api/upload/users` — can run in parallel
2. `/api/upload/mapping` — must run after both above are done

---

## Request Format

All upload endpoints accept `multipart/form-data` with field name `file`.

**Postman:** Body → form-data → key: `file` (type: File) → select your CSV

**curl:**
```bash
curl -X POST http://localhost:3000/api/upload/stores \
  -F "file=@stores_master.csv"
```

---

## Response Format

```json
{
  "message": "Stores file processed",
  "total": 100,
  "inserted": 94,
  "failed": 6,
  "errors": [
    {
      "row": 12,
      "column": "store_id",
      "reason": "store_id is required"
    },
    {
      "row": 34,
      "column": "latitude",
      "reason": "latitude must be a valid number"
    }
  ]
}
```

---

## Validation Rules

### Stores
- `store_id` — required, max 255 chars, unique
- `name` — required, max 255 chars
- `title` — required
- `latitude`, `longitude` — must be valid floats if present
- `is_active` — must be true/false/1/0 if present

### Users
- `username` — required, max 150 chars, unique
- `email` — required, valid format, max 254 chars
- `user_type` — must be one of: 1, 2, 3, 7
- `phone_number` — max 32 chars

### Mapping
- `username` — required, must exist in users table
- `store_id` — required, must exist in stores table
- `date` — must be a valid date if provided

---

## Data Normalization

Before any DB lookup or insert, string values are:
- Trimmed of leading/trailing whitespace
- Lowercased
- Collapsed internal whitespace

This ensures `"Mumbai"`, `" mumbai "`, and `"MUMBAI"` all map to the same lookup table entry.

---

## Performance — 500K Row File

The large file (`stores_master_500k.csv`) is handled by:

1. **Streaming** — `csv-parser` reads row by row, never loads entire file into memory
2. **Batch insert** — rows are inserted in chunks of 500 using multi-row `INSERT` statements
3. **Connection pool** — `pg.Pool` with 10 connections handles concurrent DB operations

Expected throughput: ~50,000–80,000 rows/minute depending on machine and DB specs.

---

## Failure Policy

**Decision: Skip bad rows, ingest the rest.**

Reasoning: Rejecting the entire file on a single bad row is too harsh for real-world retail data — a 500K row file with 3 bad rows should not block 499,997 valid records. The error report clearly identifies every failed row so the client can fix and re-upload just the problem rows.
