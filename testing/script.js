// Server-side (Node.js)
const express = require('express');
const fs = require('fs');
const app = express();

app.get('/get-videos', (req, res) => {
    const videoDir = './videos';

    fs.readdir(videoDir, (err, files) => {
        if (err) {
            res.sendStatus(500);
        } else {
            const mp4Files = files.filter(file => file.endsWith('.mp4'));
            res.json(mp4Files);
        }
    });
});

app.listen(3000, () => console.log('Server started on port 3000'));