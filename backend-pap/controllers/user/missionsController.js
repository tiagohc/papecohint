const { getUserMissions: getMissionsFromDB, getUserMissionById, completeMission, getMissionReward, addPointsToUser } = require("../../models/user/missionsModel");

// LISTAR MISSÕES DO USUÁRIO
async function getUserMissions(req, res) {
  try {
    const userId = req.user.id;
    const missions = await getMissionsFromDB(userId);

    res.json(missions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao listar missões" });
  }
}

// OBTER DETALHES DE UMA MISSÃO
async function getUserMission(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const mission = await getUserMissionById(id, userId);

    if (!mission) return res.status(404).json({ error: "Missão não encontrada" });

    res.json(mission);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao obter missão" });
  }
}

// COMPLETAR MISSÃO
async function completeUserMission(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Verificar se a missão existe e pertence ao usuário
    const mission = await getUserMissionById(id, userId);

    if (!mission) return res.status(404).json({ error: "Missão não encontrada" });

    // Completar missão
    await completeMission(id, userId);

    // Adicionar pontos ao usuário (se a missão tiver recompensa)
    const reward = await getMissionReward(id);
    if (reward) {
      await addPointsToUser(userId, reward);
    }

    res.json({ message: "Missão completada com sucesso", points_awarded: reward || 0 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao completar missão" });
  }
}

module.exports = {
  getUserMissions,
  getUserMission,
  completeUserMission,
};
