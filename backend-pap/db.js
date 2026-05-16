const mysql = require("mysql2/promise")

// Pool de conexões MySQL — reutiliza ligações automaticamente.
// Não é necessário abrir/fechar a ligação em cada query; basta usar await db.query(...).
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "3306"),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  charset: "utf8mb4",
  ssl: process.env.DB_HOST && !process.env.DB_HOST.includes("localhost")
    ? { rejectUnauthorized: false }
    : undefined,
  connectTimeout: 10000,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
})

module.exports = pool
