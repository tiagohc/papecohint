require("dotenv").config();
const db = require("./db");

async function listAllColumns() {
  try {
    const [rows] = await db.query(
      "DESCRIBE missions"
    );

    console.log("📋 TODAS as colunas da tabela missions:");
    rows.forEach(col => {
      console.log(`   - ${col.Field}`);
    });

    process.exit(0);
  } catch (err) {
    console.error("❌ Erro:", err.message);
    process.exit(1);
  }
}

listAllColumns();
