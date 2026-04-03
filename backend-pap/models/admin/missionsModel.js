const db = require("../../db");

// Criar missão
async function createMission({ title, description, reward_points, public_mission }) {
  const [result] = await db.query(
    "INSERT INTO missions (title, description, reward_points, public) VALUES (?, ?, ?, ?)",
    [title, description, reward_points || 0, public_mission ? 1 : 0]
  );

  return await getMissionById(result.insertId);
}

// Listar todas as missões
async function getAllMissions() {
  const [missions] = await db.query(
    "SELECT id, title, description, reward_points, public, created_at FROM missions ORDER BY created_at DESC"
  );
  return missions;
}

// Obter missão por ID
async function getMissionById(missionId) {
  const [missions] = await db.query(
    "SELECT * FROM missions WHERE id = ?",
    [missionId]
  );
  return missions.length > 0 ? missions[0] : null;
}

// Atualizar missão
async function updateMission(missionId, { title, description, reward_points, public_mission }) {
  const [result] = await db.query(
    "UPDATE missions SET title = ?, description = ?, reward_points = ?, public = ? WHERE id = ?",
    [title, description, reward_points, public_mission ? 1 : 0, missionId]
  );

  return result.affectedRows > 0 ? await getMissionById(missionId) : null;
}

// Deletar missão
async function deleteMission(missionId) {
  const [result] = await db.query("DELETE FROM missions WHERE id = ?", [missionId]);
  return result.affectedRows > 0;
}

module.exports = {
  createMission,
  getAllMissions,
  getMissionById,
  updateMission,
  deleteMission,
};
