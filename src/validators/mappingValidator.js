const validateMappingRow = (row, rowNumber) => {
    const errors = [];

    if (!row.username || row.username.trim() === '') {
        errors.push({ row: rowNumber, column: 'username', reason: 'username is required' });
    }

    if (!row.store_id || row.store_id.trim() === '') {
        errors.push({ row: rowNumber, column: 'store_id', reason: 'store_id is required' });
    }

    // date is optional per schema (nullable) but if present should be a valid date
    if (row.date && row.date.trim() !== '') {
        const parsed = new Date(row.date);
        if (isNaN(parsed.getTime())) {
            errors.push({ row: rowNumber, column: 'date', reason: 'date is not a valid date format' });
        }
    }

    return errors;
};

module.exports = { validateMappingRow };
