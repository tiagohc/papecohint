const db = require("../../db");

// Obter pontos do usuário
async function getUserPoints(userId) {
  const [rows] = await db.query(
    "SELECT points FROM users WHERE id = ?",
    [userId]
  );
  return rows.length > 0 ? rows[0].points : 0;
}

// Listar todas as recompensas disponíveis
async function getAvailableRewards() {
  const [rewards] = await db.query(
    `SELECT id, name, description, points_required, status 
     FROM rewards 
     WHERE status = 'active'
     ORDER BY points_required ASC`
  );
  return rewards;
}

// Obter uma recompensa específica
async function getRewardById(rewardId) {
  const [rewards] = await db.query(
    "SELECT * FROM rewards WHERE id = ? AND status = 'active'",
    [rewardId]
  );
  return rewards.length > 0 ? rewards[0] : null;
}

// Deduzir pontos do usuário
async function deductPoints(userId, points) {
  const [result] = await db.query(
    "UPDATE users SET points = points - ? WHERE id = ?",
    [points, userId]
  );
  return result.affectedRows > 0;
}

// Registrar resgate de recompensa (para histórico/auditoria)
async function recordRedemption(userId, rewardId, pointsUsed) {
  // Você pode criar uma tabela de histórico se necessário
  // Por enquanto, apenas registramos nos logs
  console.log(`Redemption: User ${userId} redeemed Reward ${rewardId} for ${pointsUsed} points`);
  return true;
}

module.exports = {
  getUserPoints,
  getAvailableRewards,
  getRewardById,
  deductPoints,
  recordRedemption,
};
