// Normalizes a string value before any DB lookup or insert
// Handles the "New York" vs "new york" vs "  New York  " problem
const normalizeString = (val) => {
    if (!val || typeof val !== 'string') return '';
    return val.trim().toLowerCase().replace(/\s+/g, ' ');
};

// For display purposes — stores the normalized version but
// we format it as Title Case when showing to end users
const toTitleCase = (val) => {
    if (!val) return '';
    return val
        .trim()
        .toLowerCase()
        .replace(/\b\w/g, (c) => c.toUpperCase());
};

// Normalize an entire row object — trims all string fields
const normalizeRow = (row) => {
    const cleaned = {};
    for (const key in row) {
        const val = row[key];
        cleaned[key.trim()] = typeof val === 'string' ? val.trim() : val;
    }
    return cleaned;
};

module.exports = { normalizeString, toTitleCase, normalizeRow };
