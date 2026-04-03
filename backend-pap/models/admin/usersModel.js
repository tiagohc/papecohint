const bcrypt = require("bcryptjs");
const db = require("../../db");

// Criar usuário
async function createUser({ name, email, password, role = "user", status = "active" }) {
  const hashedPassword = await bcrypt.hash(password, 10);

  const [result] = await db.query(
    "INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)",
    [name, email, hashedPassword, role, status]
  );

  const [user] = await db.query(
    "SELECT id, name, email, role, status FROM users WHERE id = ?",
    [result.insertId]
  );

  return user.length > 0 ? user[0] : null;
}

// Listar todos os usuários
async function getAllUsers() {
  const [rows] = await db.query("SELECT id, name, email, role, status FROM users");
  return rows;
}

// Obter usuário por ID
async function getUserById(userId) {
  const [rows] = await db.query("SELECT id, name, email, role, status FROM users WHERE id = ?", [userId]);
  return rows.length > 0 ? rows[0] : null;
}

// Obter usuário por email
async function getUserByEmail(email) {
  const [rows] = await db.query("SELECT id, name, email FROM users WHERE email = ?", [email]);
  return rows.length > 0 ? rows[0] : null;
}

// Atualizar usuário
async function updateUser(userId, { name, email, role, status }) {
  const [result] = await db.query(
    "UPDATE users SET name = ?, email = ?, role = ?, status = ? WHERE id = ?",
    [name, email, role, status, userId]
  );

  return result.affectedRows > 0 ? await getUserById(userId) : null;
}

// Deletar usuário
async function deleteUser(userId) {
  const [result] = await db.query("DELETE FROM users WHERE id = ?", [userId]);
  return result.affectedRows > 0;
}

module.exports = {
  createUser,
  getAllUsers,
  getUserById,
  getUserByEmail,
  updateUser,
  deleteUser,
};
