const pool = require('../config/db');
const { streamCSV } = require('../utils/csvParser');
const { normalizeRow } = require('../utils/normalize');
const { validateMappingRow } = require('../validators/mappingValidator');
const { batchInsert } = require('../utils/batchInsert');

const processMappingFile = async (filePath) => {
    const rows = await streamCSV(filePath);
    const errors = [];
    const toInsert = [];

    for (let i = 0; i < rows.length; i++) {
        const rowNumber = i + 2;
        const row = normalizeRow(rows[i]);
        const rowErrors = validateMappingRow(row, rowNumber);

        if (rowErrors.length > 0) {
            errors.push(...rowErrors);
            continue;
        }

        // look up actual DB ids — these must exist already
        const userResult = await pool.query('SELECT id FROM users WHERE username = $1', [row.username]);
        if (!userResult.rows.length) {
            errors.push({ row: rowNumber, column: 'username', reason: `user "${row.username}" not found in database` });
            continue;
        }

        const storeResult = await pool.query('SELECT id FROM stores WHERE store_id = $1', [row.store_id]);
        if (!storeResult.rows.length) {
            errors.push({ row: rowNumber, column: 'store_id', reason: `store "${row.store_id}" not found in database` });
            continue;
        }

        toInsert.push({
            user_id: userResult.rows[0].id,
            store_id: storeResult.rows[0].id,
            date: row.date && row.date.trim() !== '' ? row.date : null,
            is_active: ['false', '0'].includes(String(row.is_active).toLowerCase()) ? false : true,
        });
    }

    if (toInsert.length > 0) {
        await batchInsert('permanent_journey_plans', Object.keys(toInsert[0]), toInsert);
    }

    return {
        total: rows.length,
        inserted: toInsert.length,
        failed: errors.length,
        errors
    };
};

module.exports = { processMappingFile };
