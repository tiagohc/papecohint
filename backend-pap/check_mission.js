require("dotenv").config();
const db = require("./db");

async function checkMission() {
  try {
    const [rows] = await db.query(
      "SELECT id, title, verification_type, type FROM missions WHERE id = 45"
    );

    if (rows.length === 0) {
      console.log("❌ Missão 45 não existe");
      process.exit(1);
    }

    const m = rows[0];
    console.log("📋 Missão 45:");
    console.log(`   ID: ${m.id}`);
    console.log(`   Title: ${m.title}`);
    console.log(`   Type: ${m.type}`);
    console.log(`   Verification Type: ${m.verification_type}`);

    process.exit(0);
  } catch (err) {
    console.error("❌ Erro:", err.message);
    process.exit(1);
  }
}

checkMission();
