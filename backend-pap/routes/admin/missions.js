const express = require("express");
const router = express.Router();
const { auth, adminOnly } = require("../../authMiddleware");
const db = require("../../db");

// todas as rotas precisam de autenticação
router.use(auth);

// ============================
// LISTAR MISSÕES (usuário)
// ============================
router.get("/", async (req, res) => {
  try {
    const userId = req.user.id;
    const [missions] = await db.query(
      `SELECT m.id, m.title, m.description, m.type, m.points, m.image_url,
              CASE WHEN um.id IS NOT NULL THEN 1 ELSE 0 END as isCompleted,
              um.verified, um.completed_at
       FROM missions m
       LEFT JOIN user_missions um ON m.id = um.mission_id AND um.user_id = ?
       WHERE m.active = 1
       ORDER BY m.type, m.created_at DESC`,
      [userId]
    );

    res.json(missions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar missões" });
  }
});

// ============================
// COMPLETAR MISSÃO (enviar foto)
// ============================
router.post("/:missionId/complete", async (req, res) => {
  const userId = req.user.id;
  const { missionId } = req.params;
  const { photoUrl } = req.body;

  if (!photoUrl) {
    return res.status(400).json({ error: "Foto é obrigatória" });
  }

  try {
    // Check if mission exists
    const [mission] = await db.query(
      "SELECT id, points FROM missions WHERE id = ?",
      [missionId]
    );

    if (mission.length === 0) {
      return res.status(404).json({ error: "Missão não encontrada" });
    }

    // Check if user already completed
    const [existing] = await db.query(
      "SELECT id FROM user_missions WHERE user_id = ? AND mission_id = ?",
      [userId, missionId]
    );

    if (existing.length > 0) {
      return res.status(400).json({ error: "Missão já foi submetida" });
    }

    // Create user mission with pending verification
    await db.query(
      `INSERT INTO user_missions (user_id, mission_id, photo_url, verified, completed_at)
       VALUES (?, ?, ?, 0, NOW())`,
      [userId, missionId, photoUrl]
    );

    res.status(201).json({
      message: "Missão submetida para verificação",
      points: mission[0].points
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao completar missão" });
  }
});

// ============================
// RESGATAR MISSÃO VERIFICADA (admin verifica, user resgata pontos)
// ============================
router.post("/:missionId/redeem", async (req, res) => {
  const userId = req.user.id;
  const { missionId } = req.params;

  try {
    // Check if mission is verified
    const [userMission] = await db.query(
      `SELECT um.id, m.points FROM user_missions um
       JOIN missions m ON um.mission_id = m.id
       WHERE um.user_id = ? AND um.mission_id = ? AND um.verified = 1`,
      [userId, missionId]
    );

    if (userMission.length === 0) {
      return res.status(400).json({ error: "Missão não verificada ou não encontrada" });
    }

    // Update user points (você precisa ter tabela user_points ou similar)
    // Por enquanto, apenas marca como resgatada
    await db.query(
      "UPDATE user_missions SET redeemed = 1, redeemed_at = NOW() WHERE id = ?",
      [userMission[0].id]
    );

    res.json({
      message: "Pontos resgatados com sucesso",
      points: userMission[0].points
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao resgatar pontos" });
  }
});

// ============================
// ADMIN: LISTAR MISSÕES PARA VERIFICAÇÃO
// ============================
router.get("/admin/pending", adminOnly, async (req, res) => {
  try {
    const [pending] = await db.query(
      `SELECT um.id, um.user_id, u.email, m.title, m.points, um.photo_url, um.completed_at
       FROM user_missions um
       JOIN users u ON um.user_id = u.id
       JOIN missions m ON um.mission_id = m.id
       WHERE um.verified = 0
       ORDER BY um.completed_at DESC`
    );

    res.json(pending);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar missões pendentes" });
  }
});

// ============================
// ADMIN: VERIFICAR MISSÃO
// ============================
router.post("/admin/:userMissionId/verify", adminOnly, async (req, res) => {
  const { userMissionId } = req.params;
  const { approved } = req.body;

  try {
    if (approved) {
      await db.query(
        "UPDATE user_missions SET verified = 1 WHERE id = ?",
        [userMissionId]
      );

      // Criar notificação para o usuário
      const [userMissionData] = await db.query(
        `SELECT um.user_id, m.title, m.points
         FROM user_missions um
         JOIN missions m ON um.mission_id = m.id
         WHERE um.id = ?`,
        [userMissionId]
      );

      if (userMissionData.length > 0) {
        const { user_id, title, points } = userMissionData[0];
        await db.query(
          `INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
           VALUES (?, ?, ?, 'mission', 0, NOW())`,
          [user_id, "Missão Aprovada!", `Sua missão '${title}' foi aprovada. Você ganhou +${points} pontos!`]
        );
      }

      res.json({ message: "Missão aprovada" });
    } else {
      await db.query(
        "DELETE FROM user_missions WHERE id = ?",
        [userMissionId]
      );
      res.json({ message: "Missão rejeitada" });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao verificar missão" });
  }
});

// ============================
// ADMIN: CRIAR MISSÃO
// ============================
router.post("/admin/create", adminOnly, async (req, res) => {
  const { title, description, type, points, imageUrl } = req.body;

  if (!title || !type || !points) {
    return res.status(400).json({ error: "Dados obrigatórios faltando" });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO missions (title, description, type, points, image_url, active)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [title, description || "", type, points, imageUrl || null]
    );

    res.status(201).json({
      id: result.insertId,
      title,
      type,
      points
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao criar missão" });
  }
});

module.exports = router;
