const express = require("express");
const router = express.Router();
const db = require("../../db");
const { auth, adminOnly } = require("../../authMiddleware");

router.use(auth);
router.use(adminOnly);

// GET /admin/settings — devolve nome e email do admin autenticado
router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query("SELECT id, name, email FROM users WHERE id = ?", [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ error: "Utilizador não encontrado" });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: "Erro ao obter definições: " + err.message });
  }
});

// PATCH /admin/settings — atualiza nome do admin
router.patch("/", async (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: "O nome não pode estar vazio." });
  try {
    await db.query("UPDATE users SET name = ? WHERE id = ?", [name.trim(), req.user.id]);
    res.json({ message: "Definições atualizadas com sucesso." });
  } catch (err) {
    res.status(500).json({ error: "Erro ao atualizar definições: " + err.message });
  }
});

module.exports = router;
