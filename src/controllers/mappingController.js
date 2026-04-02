const { processMappingFile } = require('../services/mappingService');

const uploadMapping = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
        const result = await processMappingFile(req.file.path);
        return res.status(200).json({
            message: 'Store-user mapping file processed',
            ...result
        });
    } catch (err) {
        console.error('Mapping ingestion error:', err.message);
        return res.status(500).json({ error: 'Failed to process mapping file', detail: err.message });
    }
};

module.exports = { uploadMapping };
