const pool = require('../config/db');
const { streamCSV } = require('../utils/csvParser');
const { normalizeRow, normalizeString } = require('../utils/normalize');
const { validateStoreRow } = require('../validators/storeValidator');
const { batchInsert } = require('../utils/batchInsert');

// get-or-create for lookup tables
// normalizes the value first so "Mumbai" and " mumbai " map to the same row
const getOrCreateLookup = async (table, value) => {
    if (!value || value.trim() === '') return null;

    const normalized = normalizeString(value);

    const existing = await pool.query(`SELECT id FROM ${table} WHERE name = $1`, [normalized]);
    if (existing.rows.length > 0) return existing.rows[0].id;

    const inserted = await pool.query(
        `INSERT INTO ${table} (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id`,
        [normalized]
    );
    return inserted.rows[0].id;
};

const processStoresFile = async (filePath) => {
    const rows = await streamCSV(filePath);
    const errors = [];
    const validRows = [];
    const seenStoreIds = new Set(); // catch duplicate store_ids within the file itself

    for (let i = 0; i < rows.length; i++) {
        const rowNumber = i + 2; // +2 because row 1 is header
        const row = normalizeRow(rows[i]);
        const rowErrors = validateStoreRow(row, rowNumber);

        if (rowErrors.length > 0) {
            errors.push(...rowErrors);
            continue;
        }

        if (seenStoreIds.has(row.store_id)) {
            errors.push({ row: rowNumber, column: 'store_id', reason: `duplicate store_id "${row.store_id}" in file` });
            continue;
        }
        seenStoreIds.add(row.store_id);

        validRows.push(row);
    }

    // resolve all lookup FKs and build final insert objects
    const toInsert = [];
    for (const row of validRows) {
        const [brandId, typeId, cityId, stateId, countryId, regionId] = await Promise.all([
            getOrCreateLookup('store_brands', row.store_brand),
            getOrCreateLookup('store_types', row.store_type),
            getOrCreateLookup('cities', row.city),
            getOrCreateLookup('states', row.state),
            getOrCreateLookup('countries', row.country),
            getOrCreateLookup('regions', row.region),
        ]);

        toInsert.push({
            store_id: row.store_id,
            store_external_id: row.store_external_id || '',
            name: row.name,
            title: row.title,
            store_brand_id: brandId,
            store_type_id: typeId,
            city_id: cityId,
            state_id: stateId,
            country_id: countryId,
            region_id: regionId,
            latitude: parseFloat(row.latitude) || 0.0,
            longitude: parseFloat(row.longitude) || 0.0,
            is_active: ['false', '0'].includes(String(row.is_active).toLowerCase()) ? false : true,
        });
    }

    if (toInsert.length > 0) {
        await batchInsert('stores', Object.keys(toInsert[0]), toInsert);
    }

    return {
        total: rows.length,
        inserted: toInsert.length,
        failed: errors.length,
        errors
    };
};

module.exports = { processStoresFile };
