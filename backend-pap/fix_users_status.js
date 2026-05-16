const mysql = require("mysql2/promise");

async function main() {
  const db = await mysql.createConnection({
    host: "turntable.proxy.rlwy.net",
    port: 58158,
    user: "root",
    password: "rPIdDqYNFCJVFceagOYdpPBZDMrbsqim",
    database: "railway",
    ssl: { rejectUnauthorized: false },
  });

  // Check if column exists first
  const [rows] = await db.query(`SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA='railway' AND TABLE_NAME='users' AND COLUMN_NAME='status'`);
  if (rows.length === 0) {
    await db.query(`ALTER TABLE users ADD COLUMN status ENUM('active','suspended') NOT NULL DEFAULT 'active'`);
    console.log("✓ Coluna status adicionada");
  } else {
    console.log("✓ Coluna status já existe");
  }
  await db.end();
}

main().catch(e => { console.error("ERRO:", e.message); process.exit(1); });
