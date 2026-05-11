const mysql = require("mysql2/promise")

// Pool de conexões MySQL — reutiliza ligações automaticamente.
// Não é necessário abrir/fechar a ligação em cada query; basta usar await db.query(...).
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
})

module.exports = pool
