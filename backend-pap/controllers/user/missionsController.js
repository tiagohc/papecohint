const {
  getUserMissions: getMissionsFromDB,
  getUserMissionById,
  completeMissionDirect,
  isMissingTableError,
} = require("../../models/user/missionsModel");
const { getPremiumStatus } = require("../../models/user/premiumModel");

// LISTAR MISSÕES DO USUÁRIO
async function getUserMissions(req, res) {
  try {
    const userId = req.user.id;

    let isPremium = false;
    try {
      const status = await getPremiumStatus(userId);
      isPremium = status?.status === "active";
    } catch (_) {
      // tabela user_premium pode não existir — tratar como não premium
    }

    const missions = await getMissionsFromDB(userId, isPremium);

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

// COMPLETAR MISSÃO (sem confirmação manual)
async function completeUserMission(req, res) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { photoUrl } = req.body;

    if (!photoUrl) {
      return res.status(400).json({ error: "Foto é obrigatória" });
    }

    const mission = await getUserMissionById(id, userId);
    if (!mission) return res.status(404).json({ error: "Missão não encontrada" });

    const result = await completeMissionDirect(id, userId, photoUrl);
    if (result.alreadyCompleted) {
      return res.status(400).json({ error: "Missão já foi completada" });
    }
    if (result.missionUnavailable) {
      return res.status(404).json({ error: "Missão indisponível ou expirada" });
    }

    res.status(201).json({ message: "Missão completada com sucesso", points_awarded: result.points });
  } catch (err) {
    console.error(err);
    if (isMissingTableError(err, "user_missions")) {
      return res.status(503).json({
        error: "Tabela user_missions não existe. Execute a migração da base de dados.",
      });
    }
    res.status(500).json({ error: "Erro ao completar missão" });
  }
}

// Endpoint mantido por compatibilidade; resgate manual desativado
async function redeemUserMission(req, res) {
  res.status(400).json({
    error: "Resgate manual desativado. Os pontos são atribuídos ao completar a missão.",
  });
}

module.exports = {
  getUserMissions,
  getUserMission,
  completeUserMission,
  redeemUserMission,
};
