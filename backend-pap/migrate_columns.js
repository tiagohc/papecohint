require("dotenv").config();
const db = require("./db");

async function migrate() {
  const steps = [
    "ALTER TABLE users ADD COLUMN email_verified TINYINT(1) NOT NULL DEFAULT 0 AFTER email",
    "ALTER TABLE users ADD COLUMN email_verify_token VARCHAR(64) NULL AFTER email_verified",
    "ALTER TABLE users ADD COLUMN language VARCHAR(5) NOT NULL DEFAULT 'pt' AFTER email_verify_token",
  ];

  for (const sql of steps) {
    try {
      await db.query(sql);
      console.log("OK:", sql.substring(0, 70));
    } catch (e) {
      if (e.code === "ER_DUP_FIELDNAME") {
        console.log("JA EXISTE:", sql.substring(30, 70));
      } else {
        console.error("ERRO:", e.message);
      }
    }
  }

  // Marcar utilizadores existentes como verificados (não obrigar quem já tem conta a verificar)
  try {
    const [r] = await db.query(
      "UPDATE users SET email_verified = 1 WHERE email_verified = 0 AND email_verify_token IS NULL"
    );
    console.log("Utilizadores existentes marcados como verificados:", r.affectedRows);
  } catch (e) {
    console.error("Erro ao marcar verificados:", e.message);
  }

  process.exit(0);
}

migrate();
