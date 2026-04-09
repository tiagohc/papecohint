const { createTip, getAllTips, getTipById, updateTip, deleteTip } = require("../../models/admin/tipsModel");

// CRIAR DICA
async function createTipCtrl(req, res) {
  const { title, content, category, points_reward } = req.body;
  if (!title || !content) return res.status(400).json({ error: "Dados em falta" });

  try {
    const tip = await createTip({ title, content, category, points_reward });
    res.status(201).json(tip);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro no servidor" });
  }
}

// LISTAR TODAS AS DICAS
async function getTips(req, res) {
  try {
    const tips = await getAllTips();
    res.json(tips);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro no servidor" });
  }
}

// OBTER UMA DICA
async function getTip(req, res) {
  const { id } = req.params;
  try {
    const tip = await getTipById(id);
    if (!tip) return res.status(404).json({ error: "Dica não encontrada" });
    res.json(tip);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro no servidor" });
  }
}

// ATUALIZAR DICA
async function updateTipCtrl(req, res) {
  const { id } = req.params;
  const { title, content, category, points_reward } = req.body;
  if (!title || !content) return res.status(400).json({ error: "Dados em falta" });

  try {
    const tip = await updateTip(id, { title, content, category, points_reward });
    if (!tip) return res.status(404).json({ error: "Dica não encontrada" });
    res.json(tip);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro no servidor" });
  }
}

// DELETAR DICA
async function deleteTipCtrl(req, res) {
  const { id } = req.params;
  try {
    const deleted = await deleteTip(id);
    if (!deleted) return res.status(404).json({ error: "Dica não encontrada" });
    res.json({ message: "Dica deletada com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro no servidor" });
  }
}

module.exports = { createTipCtrl, getTips, getTip, updateTipCtrl, deleteTipCtrl };
