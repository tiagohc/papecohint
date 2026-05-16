require("dotenv").config();
const bcrypt = require("bcryptjs");
const db = require("./db");

async function createAdmin() {
  const email = "admin@email.com";
  const password = "1234567";
  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    // Verificar se admin já existe
    const [existing] = await db.query(
      "SELECT id FROM users WHERE email = ?",
      [email]
    );

    if (existing.length > 0) {
      console.log("✅ Admin já existe na base de dados.");
      process.exit(0);
    }

    // Criar admin
    await db.query(
      `INSERT INTO users (name, username, email, password, role, status, email_verified, language)
       VALUES (?, ?, ?, ?, 'admin', 'active', 1, 'pt')`,
      ["Admin", "admin", email, hashedPassword]
    );

    console.log("✅ Admin criado com sucesso!");
    console.log(`   Email: ${email}`);
    console.log(`   Password: ${password}`);
    process.exit(0);
  } catch (err) {
    console.error("❌ Erro ao criar admin:", err.message);
    process.exit(1);
  }
}

createAdmin();
