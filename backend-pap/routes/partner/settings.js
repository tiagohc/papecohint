const express = require("express");
const router = express.Router();
const db = require("../../db");
const { auth, partnerOnly } = require("../../authMiddleware");

router.use(auth);
router.use(partnerOnly);

// GET /partner/settings — get current partner info
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT id, name, description FROM partners WHERE id = ?",
      [req.user.partner_id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Parceiro não encontrado" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao obter definições" });
  }
});

// PATCH /partner/settings — update store name (and optionally description)
router.patch("/", async (req, res) => {
  const { name, description } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: "O nome da loja não pode estar vazio" });
  }

  try {
    const fields = ["name = ?"];
    const values = [name.trim()];

    if (description !== undefined) {
      fields.push("description = ?");
      values.push(description);
    }

    values.push(req.user.partner_id);
    await db.query(
      `UPDATE partners SET ${fields.join(", ")} WHERE id = ?`,
      values
    );
    res.json({ message: "Definições atualizadas com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao atualizar definições" });
  }
});

module.exports = router;
