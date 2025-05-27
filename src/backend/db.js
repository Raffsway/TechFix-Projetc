// src/backend/db.js
const { Pool } = require('pg');
require('dotenv').config({ path: require('path').resolve(__dirname, '../../../.env') }); // Carrega .env da raiz do projeto

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST || 'localhost', // Ou o nome do serviço Docker, ex: 'postgres-db'
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT) || 5432,
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  // Ou exportar o pool diretamente se preferir:
  // pool: pool
};