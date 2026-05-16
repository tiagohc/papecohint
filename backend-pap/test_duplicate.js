require("dotenv").config();
const db = require("./db");

async function testDuplicate() {
  try {
    console.log("Passo 1: Buscar missão 45...");
    const [rows] = await db.query(
      "SELECT title, title_en, description, description_en, type, reward_points, access, verification_type, target_kwh FROM missions WHERE id = ?",
      [45]
    );
    
    if (rows.length === 0) {
      console.log("❌ Missão não encontrada");
      process.exit(1);
    }
    
    const m = rows[0];
    console.log("✅ Missão encontrada:", m);

    console.log("\nPasso 2: Validar verification_type...");
    let verType = m.verification_type;
    if (verType === "invoice_kwh_reduce") {
      verType = "invoice_kwh_below";
    }
    console.log(`✅ Tipo de verificação: ${verType}`);

    console.log("\nPasso 3: Inserir nova missão...");
    const [result] = await db.query(
      `INSERT INTO missions (title, title_en, description, description_en, type, reward_points, access, active, verification_type, target_kwh, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?, NOW())`,
      [m.title, m.title_en || null, m.description, m.description_en || null, m.type, m.reward_points, m.access, verType, m.target_kwh]
    );
    console.log("✅ Nova missão inserida com ID:", result.insertId);

    console.log("\nPasso 4: Buscar nova missão...");
    const [newRows] = await db.query(
      "SELECT id, title, title_en, description, description_en, type, access, reward_points AS points, active, verification_type, target_kwh, created_at FROM missions WHERE id = ?",
      [result.insertId]
    );
    console.log("✅ Nova missão:", newRows[0]);

    process.exit(0);
  } catch (err) {
    console.error("❌ Erro:", err.message);
    console.error("Stack:", err.stack);
    process.exit(1);
  }
}

testDuplicate();
