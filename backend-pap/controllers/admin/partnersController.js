const db = require("../../db");

// ============================
// LISTAR PARCEIROS
// ============================
async function getPartners(req, res) {
  try {
    const [rows] = await db.query("SELECT id, name, description, active FROM partners");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro no servidor" });
  }
}

// ============================
// OBTER PRODUTOS (REWARDS) DE UM PARTNER
// ============================
async function getPartnerProducts(req, res) {
  const { id } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT id, title AS name, description, cost_points AS points, stock, image_url
       FROM rewards
       WHERE partner_id = ?`,
      [id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro no servidor" });
  }
}

// ============================
// ATUALIZAR STOCK DE UMA REWARD
// ============================
async function updateProductStock(req, res) {
  const { partnerId, productId } = req.params;
  const { stock } = req.body;

  if (isNaN(Number(stock))) return res.status(400).json({ error: "Stock inválido" });

  try {
    const [result] = await db.query(
      "UPDATE rewards SET stock=? WHERE id=? AND partner_id=?",
      [Number(stock), productId, partnerId]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Produto não encontrado" });

    res.json({ message: "Stock atualizado com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro no servidor" });
  }
}

// ============================
// APAGAR UM PRODUTO (REWARD) DE UM PARTNER
// ============================
async function deleteProduct(req, res) {
  const { partnerId, productId } = req.params;

  try {
    const [result] = await db.query(
      "DELETE FROM rewards WHERE id=? AND partner_id=?",
      [productId, partnerId]
    );

    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Produto não encontrado" });

    res.json({ message: "Produto removido com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro no servidor" });
  }
}

module.exports = {
  getPartners,
  getPartnerProducts,
  updateProductStock,
  deleteProduct,
};