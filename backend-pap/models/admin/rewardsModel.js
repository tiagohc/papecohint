const db = require("../../db");

// Criar recompensa
async function createReward({ name, description, points, stock, image_url, partner_id }) {
  const [result] = await db.query(
    `INSERT INTO rewards (title, description, cost_points, stock, image_url, partner_id)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [name, description || "", points, stock, image_url || null, partner_id]
  );

  return await getRewardById(result.insertId);
}

// Listar todas as recompensas
async function getAllRewards() {
  const [rewards] = await db.query(
    `SELECT r.id, r.title AS name, r.description, r.cost_points AS points, 
            r.stock, r.image_url, r.partner_id, p.name AS partner_name,
            r.status, r.created_at
     FROM rewards r
     LEFT JOIN partners p ON r.partner_id = p.id
     ORDER BY r.created_at DESC`
  );
  return rewards;
}

// Obter recompensa por ID
async function getRewardById(rewardId) {
  const [rewards] = await db.query(
    `SELECT r.id, r.title AS name, r.description, r.cost_points AS points,
            r.stock, r.image_url, r.partner_id, p.name AS partner_name,
            r.status, r.created_at
     FROM rewards r
     LEFT JOIN partners p ON r.partner_id = p.id
     WHERE r.id = ?`,
    [rewardId]
  );
  return rewards.length > 0 ? rewards[0] : null;
}

// Atualizar recompensa
async function updateReward(rewardId, { name, description, points, stock, image_url, partner_id }) {
  const [result] = await db.query(
    `UPDATE rewards 
     SET title = ?, description = ?, cost_points = ?, stock = ?, image_url = ?, partner_id = ?
     WHERE id = ?`,
    [name, description || "", points, stock, image_url || null, partner_id, rewardId]
  );

  return result.affectedRows > 0 ? await getRewardById(rewardId) : null;
}

// Deletar recompensa
async function deleteReward(rewardId) {
  const [result] = await db.query("DELETE FROM rewards WHERE id = ?", [rewardId]);
  return result.affectedRows > 0;
}

// Criar notificações para novos prêmios
async function notifyAllUsersAboutNewReward(rewardName) {
  const [users] = await db.query("SELECT id FROM users WHERE role = 'user'");
  
  const notificationTitle = "Novo Produto Disponível";
  const notificationMessage = `Um novo produto sustentável chegou à loja: '${rewardName}'. Aproveite!`;

  for (const user of users) {
    await db.query(
      "INSERT INTO notifications (user_id, title, message, type) VALUES (?, ?, ?, 'info')",
      [user.id, notificationTitle, notificationMessage]
    );
  }

  return true;
}

module.exports = {
  createReward,
  getAllRewards,
  getRewardById,
  updateReward,
  deleteReward,
  notifyAllUsersAboutNewReward,
};
