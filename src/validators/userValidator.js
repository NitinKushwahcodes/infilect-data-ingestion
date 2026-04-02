const validateUserRow = (row, rowNumber) => {
    const errors = [];

    if (!row.username || row.username.trim() === '') {
        errors.push({ row: rowNumber, column: 'username', reason: 'username is required' });
    }

    if (row.username && row.username.length > 150) {
        errors.push({ row: rowNumber, column: 'username', reason: 'username exceeds 150 characters' });
    }

    if (!row.email || row.email.trim() === '') {
        errors.push({ row: rowNumber, column: 'email', reason: 'email is required' });
    }

    // basic email format check
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (row.email && !emailRegex.test(row.email.trim())) {
        errors.push({ row: rowNumber, column: 'email', reason: 'invalid email format' });
    }

    if (row.email && row.email.length > 254) {
        errors.push({ row: rowNumber, column: 'email', reason: 'email exceeds 254 characters' });
    }

    const validUserTypes = ['1', '2', '3', '7'];
    if (row.user_type && !validUserTypes.includes(row.user_type.toString().trim())) {
        errors.push({ row: rowNumber, column: 'user_type', reason: `user_type must be one of: ${validUserTypes.join(', ')}` });
    }

    // phone_number: optional, but if present should be reasonable length
    if (row.phone_number && row.phone_number.length > 32) {
        errors.push({ row: rowNumber, column: 'phone_number', reason: 'phone_number exceeds 32 characters' });
    }

    return errors;
};

module.exports = { validateUserRow };
