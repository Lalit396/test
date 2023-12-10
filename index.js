const express = require('express');
const { Client } = require('pg');
const axios = require('axios');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);

const dbConfig = {
  user: 'your_db_user',
  host: 'your_db_host',
  database: 'your_db_name',
  password: 'your_db_password',
  port: 5432,
};

const client = new Client(dbConfig);

client.connect()
  .then(() => console.log('Connected to the database'))
  .catch(err => console.error('Error connecting to the database', err));

app.get('/', async (req, res) => {
  try {
    const result = await client.query('SELECT * FROM ticker_data');
    const data = result.rows;
    res.render('index', { data });
  } catch (error) {
    console.error('Error retrieving data from the database', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

async function fetchDataAndStoreInDatabase() {
  try {
    const response = await axios.get('https://api.wazirx.com/api/v2/tickers');
    const tickers = response.data;

    await client.query('TRUNCATE TABLE ticker_data');

    for (const ticker of tickers.slice(0, 10)) {
      const { name, last, buy, sell, volume, base_unit } = ticker;
      const query = 'INSERT INTO ticker_data (name, last, buy, sell, volume, base_unit) VALUES ($1, $2, $3, $4, $5, $6)';
      await client.query(query, [name, last, buy, sell, volume, base_unit]);
    }

    console.log('Data stored in the database');
  } catch (error) {
    console.error('Error fetching data from WazirX API', error);
  }
}

fetchDataAndStoreInDatabase();

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
