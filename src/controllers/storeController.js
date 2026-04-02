const { processStoresFile } = require('../services/storeService');

const uploadStores = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const result = await processStoresFile(req.file.path);
        return res.status(200).json({
            message: 'Stores file processed',
            ...result
        });
    } catch (err) {
        console.error('Store ingestion error:', err.message);
        return res.status(500).json({ error: 'Failed to process stores file', detail: err.message });
    }
};

module.exports = { uploadStores };
