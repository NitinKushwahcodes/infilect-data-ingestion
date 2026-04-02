# Approach Document — Infilect Data Ingestion Assignment

## High-Level Approach

The service exposes three POST endpoints — one each for stores, users, and store-user mappings. Each endpoint accepts a CSV file upload, streams it row by row, validates every field, resolves lookup foreign keys via get-or-create, and batch-inserts valid rows into PostgreSQL. Invalid rows are collected into an error report returned in the API response.

---

## Validation Strategy

Validation runs at two levels:

**Row-level (before any DB call):**  
Required fields, data type checks, length limits, email format, allowed enum values (user_type). This catches cheap errors early without touching the database.

**Referential integrity (during ingestion):**  
For mapping rows, we verify that the referenced username and store_id actually exist in the DB. For stores, lookup fields (city, region, etc.) are handled by get-or-create — not treated as errors.

Every error is recorded with its exact row number, column name, and a human-readable reason.

---

## Get-or-Create for Lookup Tables

Lookup tables (store_brands, store_types, cities, states, countries, regions) have no pre-seeded data. During ingestion, each lookup value is normalized (trimmed + lowercased), then looked up. If found, we use the existing ID. If not, we insert it and return the new ID.

**Normalization is applied before lookup** — this means "Mumbai", " mumbai ", and "MUMBAI" all resolve to the same row. Without this step, the same city would end up as multiple rows, corrupting every FK join downstream.

---

## 500K Row Performance Strategy

Three things make the large file manageable:

1. **Streaming** — `csv-parser` emits rows as a stream. Memory usage stays flat regardless of file size. We never load all 500K rows into an array.
2. **Batch insert** — Instead of one `INSERT` per row (500K round trips), we collect rows into chunks of 500 and execute multi-row inserts. This reduces DB round trips by ~1000x.
3. **Connection pooling** — `pg.Pool` keeps 10 persistent connections, avoiding the overhead of establishing a new connection per query.

---

## Failure Policy — Skip Bad Rows

**Decision: Skip invalid rows and ingest the rest.**

Rejecting the entire file on a single validation error is not practical for real-world bulk data uploads. A 500K row file with a handful of bad rows should not block all valid data. The error report in the response clearly lists every skipped row with its reason, so the client can isolate and fix just the problematic records.

---

## Tradeoffs Considered

| Decision | Alternative | Why I chose this |
|----------|-------------|------------------|
| Skip bad rows | Reject entire file | Better UX for bulk uploads; errors are reported clearly |
| Normalize to lowercase | Store as-is | Prevents duplicate lookup entries from case/whitespace variance |
| Batch insert (500/chunk) | Row-by-row insert | ~1000x fewer DB round trips on large files |
| Disk-based upload (multer) | Memory upload | Allows streaming large files without OOM risk |
| Two-pass user insert | Single pass | Needed to handle self-referential supervisor_id FK |
