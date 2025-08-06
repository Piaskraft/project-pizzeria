// server.js
const path = require('path');
const express = require('express');
const jsonServer = require('json-server');

const app = express();
const PORT = process.env.PORT || 3131;

// 1) Serwuj statyczny frontend z folderu dist
app.use(express.static(path.join(__dirname, 'dist')));

// 2) Pod ścieżką /api ustaw JSON-Server na dist/db/app.json
const router = jsonServer.router(path.join(__dirname, 'dist', 'db', 'app.json'));
app.use('/api', jsonServer.defaults(), router);

// 3) Wszystkie nie-API żądania kieruj na index.html (HTML5 History)
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`Server up on port ${PORT}`);
});
