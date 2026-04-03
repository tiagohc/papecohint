const { getUserPoints: getPointsFromDB, getAvailableRewards: getRewardsFromDB, getRewardById, deductPoints, recordRedemption } = require("../../models/user/rewardsModel");

// OBTER PONTOS DO USUÁRIO
async function getUserPoints(req, res) {
  try {
    const userId = req.user.id;
    const points = await getPointsFromDB(userId);

    res.json({ points });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao obter pontos" });
  }
}

// LISTAR RECOMPENSAS DISPONÍVEIS
async function getAvailableRewards(req, res) {
  try {
    const rewards = await getRewardsFromDB();
    res.json(rewards);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao listar recompensas" });
  }
}

// RESGATAR RECOMPENSA
async function redeemReward(req, res) {
  try {
    const { rewardId } = req.body;
    const userId = req.user.id;

    if (!rewardId) return res.status(400).json({ error: "ID da recompensa é obrigatório" });

    // Obter informações da recompensa
    const reward = await getRewardById(rewardId);

    if (!reward) return res.status(404).json({ error: "Recompensa não encontrada" });

    // Verificar pontos do usuário
    const userPoints = await getPointsFromDB(userId);

    if (userPoints < reward.points_required) {
      return res.status(400).json({ error: "Pontos insuficientes" });
    }

    // Deduzir pontos do usuário
    await deductPoints(userId, reward.points_required);

    // Registrar resgate
    await recordRedemption(userId, rewardId, reward.points_required);

    res.json({ 
      message: "Recompensa resgatada com sucesso",
      reward_name: reward.name,
      points_used: reward.points_required
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao resgatar recompensa" });
  }
}

module.exports = {
  getUserPoints,
  getAvailableRewards,
  redeemReward,
};
