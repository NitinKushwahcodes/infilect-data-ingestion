const { Pool } = require('pg');
require('dotenv').config();

// Using a connection pool — keeps connections alive and reuses them
// much better than creating a new connection per query
const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    max: 10,          // max 10 simultaneous connections
    idleTimeoutMillis: 30000
});

// quick check on startup to confirm DB is reachable
pool.connect((err, client, release) => {
    if (err) {
        console.error('Could not connect to database:', err.message);
        return;
    }
    release();
    console.log('Connected to PostgreSQL');
});

module.exports = pool;
