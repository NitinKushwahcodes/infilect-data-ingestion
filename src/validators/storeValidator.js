// Validates a single store row from the CSV
// Returns an array of error objects — empty array means row is valid

const validateStoreRow = (row, rowNumber) => {
    const errors = [];

    if (!row.store_id || row.store_id.trim() === '') {
        errors.push({ row: rowNumber, column: 'store_id', reason: 'store_id is required' });
    }

    if (!row.name || row.name.trim() === '') {
        errors.push({ row: rowNumber, column: 'name', reason: 'name is required' });
    }

    if (!row.title || row.title.trim() === '') {
        errors.push({ row: rowNumber, column: 'title', reason: 'title is required' });
    }

    if (row.name && row.name.length > 255) {
        errors.push({ row: rowNumber, column: 'name', reason: 'name exceeds 255 characters' });
    }

    if (row.store_id && row.store_id.length > 255) {
        errors.push({ row: rowNumber, column: 'store_id', reason: 'store_id exceeds 255 characters' });
    }

    if (row.latitude && isNaN(parseFloat(row.latitude))) {
        errors.push({ row: rowNumber, column: 'latitude', reason: 'latitude must be a valid number' });
    }

    if (row.longitude && isNaN(parseFloat(row.longitude))) {
        errors.push({ row: rowNumber, column: 'longitude', reason: 'longitude must be a valid number' });
    }

    if (row.is_active !== undefined && row.is_active !== '') {
        const val = row.is_active.toString().toLowerCase();
        if (!['true', 'false', '0', '1'].includes(val)) {
            errors.push({ row: rowNumber, column: 'is_active', reason: 'is_active must be true or false' });
        }
    }

    return errors;
};

module.exports = { validateStoreRow };
