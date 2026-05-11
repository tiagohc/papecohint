const db = require("../../db");

// Devolve os dados do perfil do utilizador pelo seu ID
async function getProfileById(userId) {
  const [rows] = await db.query(
    "SELECT id, name, email, role, status, avatar_url, created_at FROM users WHERE id = ?",
    [userId]
  );
  return rows.length > 0 ? rows[0] : null;
}

// Atualiza o nome do utilizador
async function updateProfile(userId, { name }) {
  const [result] = await db.query(
    "UPDATE users SET name = ? WHERE id = ?",
    [name, userId]
  );
  return result.affectedRows > 0;
}

// Atualiza o URL do avatar do utilizador
async function updateAvatar(userId, avatarUrl) {
  const [result] = await db.query(
    "UPDATE users SET avatar_url = ? WHERE id = ?",
    [avatarUrl, userId]
  );
  return result.affectedRows > 0;
}

// Devolve a password em hash (para validação na troca de senha)
async function getPasswordByUserId(userId) {
  const [rows] = await db.query("SELECT password FROM users WHERE id = ?", [userId]);
  return rows.length > 0 ? rows[0].password : null;
}

// Guarda a nova password já em hash
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
  updateAvatar,
  getPasswordByUserId,
  updatePassword,
};
