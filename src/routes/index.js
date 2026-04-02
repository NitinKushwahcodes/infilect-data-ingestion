const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();

const { uploadStores } = require('../controllers/storeController');
const { uploadUsers } = require('../controllers/userController');
const { uploadMapping } = require('../controllers/mappingController');

// save uploads to disk (not memory) so we can stream large files
const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
        const unique = `${Date.now()}-${file.originalname}`;
        cb(null, unique);
    }
});

const upload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (path.extname(file.originalname) !== '.csv') {
            return cb(new Error('Only CSV files are allowed'));
        }
        cb(null, true);
    }
});

router.post('/upload/stores', upload.single('file'), uploadStores);
router.post('/upload/users', upload.single('file'), uploadUsers);
router.post('/upload/mapping', upload.single('file'), uploadMapping);

// health check
router.get('/health', (req, res) => res.json({ status: 'ok' }));

module.exports = router;
