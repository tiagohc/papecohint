require("dotenv").config();
const bcrypt = require("bcryptjs");
const db = require("./db");

async function updateAdminPassword() {
  const email = "admin@email.com";
  const newPassword = "1234567";
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  try {
    await db.query(
      "UPDATE users SET password = ? WHERE email = ?",
      [hashedPassword, email]
    );

    // Verificar se atualizou
    const [rows] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (rows.length === 0) {
      console.log("❌ Admin não encontrado");
      process.exit(1);
    }

    console.log("✅ Password do admin atualizada com sucesso!");
    console.log(`   Email: ${email}`);
    console.log(`   Nouvelle password: ${newPassword}`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Erro ao atualizar password:", err.message);
    process.exit(1);
  }
}

updateAdminPassword();
