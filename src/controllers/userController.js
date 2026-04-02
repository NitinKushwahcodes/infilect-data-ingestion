const { processUsersFile } = require('../services/userService');

const uploadUsers = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const result = await processUsersFile(req.file.path);
        return res.status(200).json({
            message: 'Users file processed',
            ...result
        });
    } catch (err) {
        console.error('User ingestion error:', err.message);
        return res.status(500).json({ error: 'Failed to process users file', detail: err.message });
    }
};

module.exports = { uploadUsers };
