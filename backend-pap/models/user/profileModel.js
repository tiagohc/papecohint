const db = require("../../db");
const bcrypt = require("bcryptjs");

// Obter perfil do usuário por ID
async function getProfileById(userId) {
  const [rows] = await db.query(
    "SELECT id, name, email, role, language, status, created_at FROM users WHERE id = ?",
    [userId]
  );
  return rows.length > 0 ? rows[0] : null;
}

// Atualizar perfil do usuário
async function updateProfile(userId, { name, language }) {
  const [result] = await db.query(
    "UPDATE users SET name = ?, language = ? WHERE id = ?",
    [name, language || null, userId]
  );
  return result.affectedRows > 0;
}

// Obter senha hasheada para validação
async function getPasswordByUserId(userId) {
  const [rows] = await db.query("SELECT password FROM users WHERE id = ?", [userId]);
  return rows.length > 0 ? rows[0].password : null;
}

// Atualizar senha do usuário
async function updatePassword(userId, hashedPassword) {
  const [result] = await db.query(
    "UPDATE users SET password = ? WHERE id = ?",
    [hashedPassword, userId]
  );
  return result.affectedRows > 0;
}

module.exports = {
  getProfileById,
  updateProfile,
  getPasswordByUserId,
  updatePassword,
};
