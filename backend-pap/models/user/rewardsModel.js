const db = require("../../db");

// Obter pontos do usuário
async function getUserPoints(userId) {
  const [rows] = await db.query(
    "SELECT eco_points FROM users WHERE id = ?",
    [userId]
  );
  return rows.length > 0 ? rows[0].eco_points : 0;
}

// Listar todas as recompensas disponíveis
async function getAvailableRewards() {
  const [rewards] = await db.query(
    `SELECT r.id, r.title AS name, r.description, r.cost_points AS points,
            r.stock, r.image_url, p.name AS partnerName
     FROM rewards r
     LEFT JOIN partners p ON r.partner_id = p.id
     WHERE r.stock > 0 AND r.status = 'approved'
     ORDER BY r.cost_points ASC`
  );
  return rewards;
}

// Obter uma recompensa específica
async function getRewardById(rewardId) {
  const [rewards] = await db.query(
    `SELECT r.id, r.title AS name, r.description, r.cost_points AS points_required,
            r.stock, r.image_url
     FROM rewards r
     WHERE r.id = ?`,
    [rewardId]
  );
  return rewards.length > 0 ? rewards[0] : null;
}

// Deduzir pontos do usuário
async function deductPoints(userId, points) {
  const [result] = await db.query(
    "UPDATE users SET eco_points = eco_points - ? WHERE id = ?",
    [points, userId]
  );
  return result.affectedRows > 0;
}

// Registrar resgate de recompensa com morada de entrega
async function recordRedemption(userId, rewardId, pointsUsed, address = {}) {
  try {
    const [result] = await db.query(
      `INSERT INTO redemptions (user_id, reward_id, points_used, full_name, address, city, postal_code, phone, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [userId, rewardId, pointsUsed,
       address.full_name || null,
       address.address || null,
       address.city || null,
       address.postal_code || null,
       address.phone || null,
       address.notes || null]
    );
    await db.query("UPDATE rewards SET stock = stock - 1 WHERE id = ? AND stock > 0", [rewardId]);
    return result.insertId;
  } catch (err) {
    // Fallback: tabela redemptions sem colunas de morada (migração ainda não aplicada)
    if (err.code === "ER_BAD_FIELD_ERROR") {
      const [result] = await db.query(
        "INSERT INTO redemptions (user_id, reward_id, points_used) VALUES (?, ?, ?)",
        [userId, rewardId, pointsUsed]
      );
      await db.query("UPDATE rewards SET stock = stock - 1 WHERE id = ? AND stock > 0", [rewardId]);
      return result.insertId;
    }
    throw err;
  }
}

module.exports = {
  getUserPoints,
  getAvailableRewards,
  getRewardById,
  deductPoints,
  recordRedemption,
};
