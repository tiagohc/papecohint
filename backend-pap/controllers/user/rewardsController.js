const { getUserPoints: getPointsFromDB, getAvailableRewards: getRewardsFromDB, getRewardById, deductPoints, recordRedemption } = require("../../models/user/rewardsModel");
const { sendPushToAdmins, sendPushToPartnerUsers } = require("../../services/pushNotificationService");
const db = require("../../db");

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
    const numUserPoints = Number(userPoints) || 0;
    const numRequired = Number(reward.points_required) || 0;
    if (numUserPoints < numRequired) {
      return res.status(400).json({ error: `Pontos insuficientes. Precisas de ${numRequired} pts e tens ${numUserPoints} pts.` });
    }

    await deductPoints(userId, numRequired);
    await recordRedemption(userId, rewardId, numRequired, { full_name, address, city, postal_code, phone, notes });

    // Get user name for notification
    let userName = "Utilizador";
    try {
      const [rows] = await db.query("SELECT name FROM users WHERE id = ?", [userId]);
      if (rows.length > 0) userName = rows[0].name;
    } catch (_) {}

    // Notify admins
    sendPushToAdmins(
      "🛍️ Nova compra de produto",
      `${userName} resgatou "${reward.name}" (${numRequired} pts)`
    ).catch(() => {});

    // Notify partner if reward has a partner
    if (reward.partner_id) {
      // Get full reward with partner_id from admin model
      const [rewardRows] = await db.query(
        "SELECT partner_id FROM rewards WHERE id = ?",
        [rewardId]
      ).catch(() => [[]]);
      const pid = rewardRows?.[0]?.partner_id ?? reward.partner_id;
      sendPushToPartnerUsers(
        pid,
        "🛍️ Produto resgatado",
        `${userName} resgatou o teu produto "${reward.name}"`
      ).catch(() => {});
    }

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
