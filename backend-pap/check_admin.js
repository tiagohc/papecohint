require("dotenv").config();
const bcrypt = require("bcryptjs");
const db = require("./db");

async function checkAdmin() {
  try {
    const [rows] = await db.query(
      "SELECT id, name, email, role, status, email_verified, password FROM users WHERE email = ?",
      ["admin@email.com"]
    );

    if (rows.length === 0) {
      console.log("❌ Admin não encontrado");
      process.exit(1);
    }

    const admin = rows[0];
    console.log("📋 Dados do Admin:");
    console.log(`   ID: ${admin.id}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Status: ${admin.status}`);
    console.log(`   Email Verified: ${admin.email_verified}`);
    console.log(`   Password Hash: ${admin.password.substring(0, 20)}...`);

    // Testar se a password 1234567 bate com o hash
    const match = await bcrypt.compare("1234567", admin.password);
    console.log(`   Password Matches "1234567": ${match ? "✅ SIM" : "❌ NÃO"}`);

    if (admin.status !== "active") {
      console.log("\n⚠️  Admin está inativo! Status: " + admin.status);
    }
    if (!admin.email_verified) {
      console.log("\n⚠️  Email não verificado!");
    }

    process.exit(0);
  } catch (err) {
    console.error("❌ Erro:", err.message);
    process.exit(1);
  }
}

checkAdmin();
