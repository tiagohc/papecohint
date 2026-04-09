const bcrypt = require("bcryptjs");
const db = require("../../db");

function isMissingPartnerUsersTable(err) {
  return err?.code === "ER_NO_SUCH_TABLE" && String(err?.sqlMessage || "").includes("partner_users");
}

async function getUserWithEffectiveRoleById(userId) {
  try {
    const [rows] = await db.query(
      `SELECT u.id,
              u.name,
              u.email,
              CASE WHEN pu.user_id IS NOT NULL THEN 'partner' ELSE u.role END AS role,
              u.status
       FROM users u
       LEFT JOIN partner_users pu ON pu.user_id = u.id
       WHERE u.id = ?
       LIMIT 1`,
      [userId]
    );
    return rows.length > 0 ? rows[0] : null;
  } catch (err) {
    if (!isMissingPartnerUsersTable(err)) {
      throw err;
    }

    const [fallbackRows] = await db.query(
      "SELECT id, name, email, role, status FROM users WHERE id = ?",
      [userId]
    );
    return fallbackRows.length > 0 ? fallbackRows[0] : null;
  }
}

// Criar usuário
async function createUser({ name, email, password, role = "user", status = "active" }) {
  const hashedPassword = await bcrypt.hash(password, 10);

  const [result] = await db.query(
    "INSERT INTO users (name, email, password, role, status) VALUES (?, ?, ?, ?, ?)",
    [name, email, hashedPassword, role, status]
  );

  return getUserWithEffectiveRoleById(result.insertId);
}

// Listar todos os usuários
async function getAllUsers() {
  try {
    const [rows] = await db.query(
      `SELECT u.id,
              u.name,
              u.email,
              CASE WHEN pu.user_id IS NOT NULL THEN 'partner' ELSE u.role END AS role,
              u.status,
              CASE WHEN up.status = 'active' THEN 1 ELSE 0 END AS is_premium
       FROM users u
       LEFT JOIN partner_users pu ON pu.user_id = u.id
       LEFT JOIN user_premium up ON up.user_id = u.id`
    );
    return rows;
  } catch (err) {
    if (!isMissingPartnerUsersTable(err)) {
      throw err;
    }

    const [fallbackRows] = await db.query(
      `SELECT u.id, u.name, u.email, u.role, u.status,
              CASE WHEN up.status = 'active' THEN 1 ELSE 0 END AS is_premium
       FROM users u
       LEFT JOIN user_premium up ON up.user_id = u.id`
    );
    return fallbackRows;
  }
}

// Obter usuário por ID
async function getUserById(userId) {
  return getUserWithEffectiveRoleById(userId);
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
