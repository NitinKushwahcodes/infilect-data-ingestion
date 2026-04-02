const pool = require('../config/db');
const { streamCSV } = require('../utils/csvParser');
const { normalizeRow } = require('../utils/normalize');
const { validateUserRow } = require('../validators/userValidator');
const { batchInsert } = require('../utils/batchInsert');

const processUsersFile = async (filePath) => {
    const rows = await streamCSV(filePath);
    const errors = [];
    const validRows = [];
    const seenUsernames = new Set();

    for (let i = 0; i < rows.length; i++) {
        const rowNumber = i + 2;
        const row = normalizeRow(rows[i]);
        const rowErrors = validateUserRow(row, rowNumber);

        if (rowErrors.length > 0) {
            errors.push(...rowErrors);
            continue;
        }

        if (seenUsernames.has(row.username)) {
            errors.push({ row: rowNumber, column: 'username', reason: `duplicate username "${row.username}" in file` });
            continue;
        }
        seenUsernames.add(row.username);

        validRows.push(row);
    }

    // supervisor_id references another user — we resolve it after all users are inserted
    // first pass: insert without supervisor_id
    const toInsert = validRows.map((row) => ({
        username: row.username,
        first_name: row.first_name || '',
        last_name: row.last_name || '',
        email: row.email,
        user_type: parseInt(row.user_type) || 1,
        phone_number: row.phone_number || '',
        is_active: ['false', '0'].includes(String(row.is_active).toLowerCase()) ? false : true,
    }));

    if (toInsert.length > 0) {
        await batchInsert('users', Object.keys(toInsert[0]), toInsert);
    }

    // second pass: update supervisor_id where provided
    for (const row of validRows) {
        if (!row.supervisor_username) continue;

        const supervisor = await pool.query('SELECT id FROM users WHERE username = $1', [row.supervisor_username]);
        if (!supervisor.rows.length) continue;

        await pool.query(
            'UPDATE users SET supervisor_id = $1 WHERE username = $2',
            [supervisor.rows[0].id, row.username]
        );
    }

    return {
        total: rows.length,
        inserted: toInsert.length,
        failed: errors.length,
        errors
    };
};

module.exports = { processUsersFile };
