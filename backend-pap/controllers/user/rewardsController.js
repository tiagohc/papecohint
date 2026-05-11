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
    const { rewardId, full_name, address, city, postal_code, phone, notes } = req.body;
    const userId = req.user.id;

    if (!rewardId) return res.status(400).json({ error: "ID da recompensa é obrigatório" });
    if (!full_name || !address || !city || !postal_code) {
      return res.status(400).json({ error: "Morada de entrega incompleta. Preenche nome, morada, cidade e código postal." });
    }

    const reward = await getRewardById(rewardId);
    if (!reward) return res.status(404).json({ error: "Recompensa não encontrada" });
    if (reward.stock <= 0) return res.status(400).json({ error: "Esta recompensa está esgotada." });

    const userPoints = await getPointsFromDB(userId);
    if (userPoints < reward.points_required) {
      return res.status(400).json({ error: `Pontos insuficientes. Precisas de ${reward.points_required} pts e tens ${userPoints} pts.` });
    }

    await deductPoints(userId, reward.points_required);
    await recordRedemption(userId, rewardId, reward.points_required, { full_name, address, city, postal_code, phone, notes });

    res.json({ 
      message: "Recompensa resgatada com sucesso! Receberás o produto na morada indicada.",
      reward_name: reward.name,
      points_used: reward.points_required
    });
  } catch (err) {
    console.error("[redeem] ERRO:", err.message, err.sql || "");
    res.status(500).json({ error: "Erro ao resgatar recompensa: " + err.message });
  }
}

module.exports = {
  getUserPoints,
  getAvailableRewards,
  redeemReward,
};
