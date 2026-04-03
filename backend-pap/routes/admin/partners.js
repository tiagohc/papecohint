const express = require("express");
const router = express.Router();
const { auth, adminOnly } = require("../../authMiddleware");
const db = require("../../db");

// todas as rotas precisam de autenticação
router.use(auth);

// ============================
// CRIAR PARCEIRO
// ============================
router.post("/", adminOnly, async (req, res) => {
  const { name, description } = req.body;

  if (!name) return res.status(400).json({ error: "Nome é obrigatório" });

  try {
    const [result] = await db.query(
      "INSERT INTO partners (name, description, active) VALUES (?, ?, 1)",
      [name, description || ""]
    );

    res.status(201).json({ id: result.insertId, name, description, active: 1 });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro no servidor" });
  }
});

// ============================
// LISTAR PARCEIROS
// ============================
router.get("/", adminOnly, async (req, res) => {
  try {
    const [rows] = await db.query("SELECT id, name, description, active FROM partners");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro no servidor" });
  }
});

// ============================
// OBTER PRODUTOS (REWARDS) DE UM PARTNER
// ============================
router.get("/:id/products", adminOnly, async (req, res) => {
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
});

// ============================
// ATUALIZAR STOCK DE UMA REWARD
// ============================
router.put("/:partnerId/products/:productId", adminOnly, async (req, res) => {
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
});

// ============================
// APAGAR UM PRODUTO (REWARD) DE UM PARTNER
// ============================
router.delete("/:partnerId/products/:productId", adminOnly, async (req, res) => {
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
});

// ============================
// APAGAR PARCEIRO
// ============================
router.delete("/:id", adminOnly, async (req, res) => {
  const { id } = req.params;

  try {
    // First, delete all rewards associated with the partner
    await db.query("DELETE FROM rewards WHERE partner_id=?", [id]);

    // Then delete the partner
    const [result] = await db.query("DELETE FROM partners WHERE id=?", [id]);

    if (result.affectedRows === 0)
      return res.status(404).json({ error: "Parceiro não encontrado" });

    res.json({ message: "Parceiro removido com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro no servidor" });
  }
});

module.exports = router;