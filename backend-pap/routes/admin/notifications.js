const express = require("express");
const router = express.Router();
const { auth } = require("../../authMiddleware");
const db = require("../../db");

// ============================
// LISTAR NOTIFICAÇÕES DO USUÁRIO
// ============================
router.get("/", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const [notifications] = await db.query(
      `SELECT id, title, message, type, is_read as isRead, created_at as createdAt
       FROM notifications
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );

    res.json(notifications);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar notificações" });
  }
});

// ============================
// MARCAR NOTIFICAÇÃO COMO LIDA
// ============================
router.post("/:notificationId/read", auth, async (req, res) => {
  const userId = req.user.id;
  const { notificationId } = req.params;

  try {
    await db.query(
      "UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?",
      [notificationId, userId]
    );

    res.json({ message: "Notificação marcada como lida" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao marcar notificação" });
  }
});

// ============================
// CRIAR NOTIFICAÇÃO (para uso interno, ex: quando admin cria produto)
// ============================
router.post("/create", auth, async (req, res) => {
  const { userId, title, message, type } = req.body;

  if (!userId || !title || !message || !type) {
    return res.status(400).json({ error: "Dados obrigatórios faltando" });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
       VALUES (?, ?, ?, ?, 0, NOW())`,
      [userId, title, message, type]
    );

    res.status(201).json({
      id: result.insertId,
      title,
      message,
      type
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao criar notificação" });
  }
});

module.exports = router;