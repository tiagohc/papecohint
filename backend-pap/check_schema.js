require("dotenv").config();
const db = require("./db");

async function checkTableSchema() {
  try {
    const [rows] = await db.query(
      "DESCRIBE missions"
    );

    console.log("📋 Esquema da tabela missions:");
    rows.forEach(col => {
      console.log(`   ${col.Field}: ${col.Type} ${col.Null === 'NO' ? 'NOT NULL' : 'NULL'} ${col.Default ? `DEFAULT ${col.Default}` : ''}`);
    });

    process.exit(0);
  } catch (err) {
    console.error("❌ Erro:", err.message);
    process.exit(1);
  }
}

checkTableSchema();
