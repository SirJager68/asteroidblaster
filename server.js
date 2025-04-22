// server.js
require('dotenv').config();
const { Pool }= require('pg');
const express = require('express');
const path    = require('path');
const app     = express();

// 1) JSON‐body parsing for POST
app.use(express.json());

// 2) Your GET‐and‐POST /highscores _before_ static:
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: false }
      : false
  });
  


app.get('/highscores', async (req, res) => {
    const { cat } = req.query;
    let sql;
  
    switch (cat) {
      case 'monthly':
        sql = `
          SELECT username, score, devicetype, created_at
          FROM highscores
          WHERE date_trunc('month', created_at) = date_trunc('month', CURRENT_DATE)
          ORDER BY score DESC
          LIMIT 20
        `;
        break;
  
      case 'weekly':
        sql = `
          SELECT username, score, devicetype, created_at
          FROM highscores
          WHERE date_trunc('week', created_at) = date_trunc('week', CURRENT_DATE)
          ORDER BY score DESC
          LIMIT 20
        `;
        break;
  
      case 'daily':
        sql = `
          SELECT username, score, devicetype, created_at
          FROM highscores
          WHERE created_at::date = CURRENT_DATE
          ORDER BY score DESC
          LIMIT 20
        `;
        break;
  
      case 'last20':
        sql = `
          SELECT username, score, devicetype, created_at
          FROM highscores
          ORDER BY created_at DESC
          LIMIT 20
        `;
        break;
  
      case 'alltime':
      default:
        sql = `
          SELECT username, score, devicetype, created_at
          FROM highscores
          ORDER BY score DESC
          LIMIT 20
        `;
    }
  
    try {
      const { rows } = await pool.query(sql);
      res.json(rows);
    } catch (err) {
      console.error('GET /highscores error:', err.message);
      res.status(500).json({ error: err.message });
    }
  });
  

app.post('/highscores', async (req, res) => {
  const { username, score, devicetype, gameid, gameversion } = req.body;
  try {
    await pool.query(
      `INSERT INTO highscores
         (username, score, devicetype, gameid, gameversion)
       VALUES ($1,$2,$3,$4,$5)`,
      [username, score, devicetype, gameid, gameversion]
    );
    res.json({ status: 'success' });
  } catch (err) {
    res.status(500).json({ status:'error', message: err.message });
  }
});

// 3) Now your static + root route
app.use(express.static(path.join(__dirname)));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// 4) And finally start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server on ${PORT}`));
