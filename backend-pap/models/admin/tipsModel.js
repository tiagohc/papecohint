const db = require("../../db");

// Criar dica
async function createTip({ title, content, category, points_reward }) {
  const [result] = await db.query(
    "INSERT INTO tips (title, content, category, points_reward) VALUES (?, ?, ?, ?)",
    [title, content, category || "general", points_reward || 0]
  );

  return await getTipById(result.insertId);
}

// Listar todas as dicas
async function getAllTips() {
  const [tips] = await db.query(
    "SELECT id, title, content, category, points_reward, created_at FROM tips ORDER BY created_at DESC"
  );
  return tips;
}

// Obter dica por ID
async function getTipById(tipId) {
  const [tips] = await db.query(
    "SELECT * FROM tips WHERE id = ?",
    [tipId]
  );
  return tips.length > 0 ? tips[0] : null;
}

// Atualizar dica
async function updateTip(tipId, { title, content, category, points_reward }) {
  const [result] = await db.query(
    "UPDATE tips SET title = ?, content = ?, category = ?, points_reward = ? WHERE id = ?",
    [title, content, category || "general", points_reward || 0, tipId]
  );

  return result.affectedRows > 0 ? await getTipById(tipId) : null;
}

// Deletar dica
async function deleteTip(tipId) {
  const [result] = await db.query("DELETE FROM tips WHERE id = ?", [tipId]);
  return result.affectedRows > 0;
}

module.exports = {
  createTip,
  getAllTips,
  getTipById,
  updateTip,
  deleteTip,
};
