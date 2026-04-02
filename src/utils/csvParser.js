const fs = require('fs');
const csv = require('csv-parser');

// Streams a CSV file row by row instead of loading it all into memory
// This is what makes the 500K row file manageable
const streamCSV = (filePath) => {
    return new Promise((resolve, reject) => {
        const rows = [];

        fs.createReadStream(filePath)
            .pipe(csv())
            .on('data', (row) => rows.push(row))
            .on('end', () => resolve(rows))
            .on('error', (err) => reject(err));
    });
};

// Same as above but accepts a callback per row instead of collecting all
// Use this for the 500K file — don't accumulate rows in memory
const streamCSVWithCallback = (filePath, onRow) => {
    return new Promise((resolve, reject) => {
        const stream = fs.createReadStream(filePath).pipe(csv());

        stream
            .on('data', (row) => {
                stream.pause();          // pause stream while we process
                Promise.resolve(onRow(row)).then(() => stream.resume());
            })
            .on('end', () => resolve())
            .on('error', (err) => reject(err));
    });
};

module.exports = { streamCSV, streamCSVWithCallback };
