const express = require("express");
const router = express.Router();
const db = require("../../db");
const { auth, partnerOnly } = require("../../authMiddleware");

router.use(auth);
router.use(partnerOnly);

router.get("/", async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id,
              title AS name,
              description,
              cost_points AS points,
              stock,
              image_url
       FROM rewards
       WHERE partner_id = ?
       ORDER BY id DESC`,
      [req.user.partner_id]
    );

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao listar produtos" });
  }
});

router.post("/", async (req, res) => {
  let { name, description, points, stock, image_url } = req.body;

  points = Number(points);
  stock = Number(stock);

  if (!name || Number.isNaN(points) || points < 0 || Number.isNaN(stock) || stock < 0) {
    return res.status(400).json({ error: "Dados inválidos" });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO rewards (partner_id, title, description, cost_points, stock, image_url)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [req.user.partner_id, name, description || "", points, stock, image_url || null]
    );

    const [rows] = await db.query(
      `SELECT id,
              title AS name,
              description,
              cost_points AS points,
              stock,
              image_url
       FROM rewards
       WHERE id = ? AND partner_id = ?`,
      [result.insertId, req.user.partner_id]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao criar produto" });
  }
});

router.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { name, description, points, stock, image_url } = req.body;

  const set = [];
  const values = [];

  if (name !== undefined) {
    set.push("title = ?");
    values.push(name);
  }

  if (description !== undefined) {
    set.push("description = ?");
    values.push(description || "");
  }

  if (points !== undefined) {
    const numPoints = Number(points);
    if (Number.isNaN(numPoints) || numPoints < 0) {
      return res.status(400).json({ error: "Pontos inválidos" });
    }
    set.push("cost_points = ?");
    values.push(numPoints);
  }

  if (stock !== undefined) {
    const numStock = Number(stock);
    if (Number.isNaN(numStock) || numStock < 0) {
      return res.status(400).json({ error: "Stock inválido" });
    }
    set.push("stock = ?");
    values.push(numStock);
  }

  if (image_url !== undefined) {
    set.push("image_url = ?");
    values.push(image_url || null);
  }

  if (set.length === 0) {
    return res.status(400).json({ error: "Nenhum campo para atualizar" });
  }

  try {
    const [result] = await db.query(
      `UPDATE rewards
       SET ${set.join(", ")}
       WHERE id = ? AND partner_id = ?`,
      [...values, id, req.user.partner_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }

    const [rows] = await db.query(
      `SELECT id,
              title AS name,
              description,
              cost_points AS points,
              stock,
              image_url
       FROM rewards
       WHERE id = ? AND partner_id = ?`,
      [id, req.user.partner_id]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao atualizar produto" });
  }
});

router.delete("/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const [result] = await db.query(
      "DELETE FROM rewards WHERE id = ? AND partner_id = ?",
      [id, req.user.partner_id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Produto não encontrado" });
    }

    res.json({ message: "Produto removido com sucesso" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao apagar produto" });
  }
});

module.exports = router;
