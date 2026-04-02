const pool = require('../config/db');

// Inserts rows in chunks instead of one by one
// row-by-row inserts on 500K records = ~500K round trips to DB = very slow
// batch insert = one query per chunk = much faster
const batchInsert = async (table, columns, rows, chunkSize = 500) => {
    if (!rows.length) return;

    for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);

        const placeholders = chunk.map((_, rowIndex) => {
            const cols = columns.map((_, colIndex) => `$${rowIndex * columns.length + colIndex + 1}`);
            return `(${cols.join(', ')})`;
        }).join(', ');

        const values = chunk.flatMap((row) => columns.map((col) => row[col]));

        const query = `
            INSERT INTO ${table} (${columns.join(', ')})
            VALUES ${placeholders}
            ON CONFLICT DO NOTHING
        `;

        await pool.query(query, values);
    }
};

module.exports = { batchInsert };
