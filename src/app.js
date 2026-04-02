const express = require('express');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const routes = require('./routes/index');

// uploads folder git track nahi karta empty folders ko
// isliye server start hone par automatically bana do
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', routes);

// catch multer and other errors cleanly
app.use((err, req, res, next) => {
    console.error(err.message);
    res.status(400).json({ error: err.message });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
