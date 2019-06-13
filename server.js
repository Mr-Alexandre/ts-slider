const express = require('express');
const cors = require('cors');
const app = express();
const path = require('path');

app.use(cors());


app.post('/test', function (req, res) {
    res.setHeader('Content-Type', 'text/html');
    res.send('<p>Test successful</p>');
});


const server = app.listen(8181, function () {
    console.log('API server started, Available on: http://127.0.0.1:8181');
});

