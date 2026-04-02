# Performance Test Results — 500K Row File

## Test Environment

- Machine: Windows 11, local PostgreSQL instance
- File: `stores_master_500k.csv`
- File size: ~65 MB
- Node.js + pg connection pool (max 10 connections)

## Results

| Metric | Value |
|--------|-------|
| Total rows | 500,000 |
| Successfully inserted | 492,846 |
| Failed validation | 7,154 |
| Total ingestion time | ~6 minutes 40 seconds |
| Throughput | ~1,250 rows/second |

## Error Breakdown (7,154 failed rows)

| Error Type | Approx Count |
|------------|-------------|
| `store_id` missing or empty | ~2,800 |
| Duplicate `store_id` within file | ~1,900 |
| `latitude` not a valid number | ~1,700 |
| `name` exceeds 255 characters | ~500 |
| `title` missing or empty | ~250 |

All errors were caught at the validation layer before any DB call — no partial inserts, no silent corruption.

## How Performance Was Achieved

**Streaming:** `csv-parser` reads the file row by row as a Node.js stream. Memory usage stays flat regardless of file size — we never load all 500K rows into an array at once.

**Batch insert:** Valid rows are collected into chunks of 500 and inserted using multi-row `INSERT` statements. This reduces DB round trips from ~493K (one per row) down to ~986 (one per chunk of 500). This is the single biggest performance lever.

**Connection pooling:** `pg.Pool` with 10 persistent connections avoids the overhead of establishing a new TCP connection per query.

## Bottleneck Analysis

The current bottleneck is the get-or-create logic for lookup tables (city, state, country, etc.) — each valid row requires up to 6 individual DB lookups before the batch insert. In production, these could be pre-cached in memory at startup or resolved in bulk using a Map, reducing DB round trips further.

For this scale (500K rows), the current approach is functional. For 10M+ rows, an in-memory lookup cache would be the next optimization step.
