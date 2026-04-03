const db = require("../../db");

// Listar todas as missões do usuário (suas + públicas)
async function getUserMissions(userId) {
  const [missions] = await db.query(
    `SELECT id, title, description, reward_points, completed, created_at 
     FROM missions 
     WHERE user_id = ? OR public = 1
     ORDER BY created_at DESC`,
    [userId]
  );
  return missions;
}

// Obter uma missão específica do usuário
async function getUserMissionById(missionId, userId) {
  const [missions] = await db.query(
    `SELECT * FROM missions 
     WHERE id = ? AND (user_id = ? OR public = 1)`,
    [missionId, userId]
  );
  return missions.length > 0 ? missions[0] : null;
}

// Marcar missão como completada
async function completeMission(missionId, userId) {
  const [result] = await db.query(
    "UPDATE missions SET completed = 1 WHERE id = ? AND user_id = ?",
    [missionId, userId]
  );
  return result.affectedRows > 0;
}

// Obter detalhes da missão (incluindo pontos de recompensa)
async function getMissionReward(missionId) {
  const [missions] = await db.query(
    "SELECT reward_points FROM missions WHERE id = ?",
    [missionId]
  );
  return missions.length > 0 ? missions[0].reward_points : 0;
}

// Adicionar pontos ao usuário
async function addPointsToUser(userId, points) {
  const [result] = await db.query(
    "UPDATE users SET points = points + ? WHERE id = ?",
    [points, userId]
  );
  return result.affectedRows > 0;
}

module.exports = {
  getUserMissions,
  getUserMissionById,
  completeMission,
  getMissionReward,
  addPointsToUser,
};
