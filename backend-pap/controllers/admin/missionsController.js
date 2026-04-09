const db = require("../../db");

function isMissingTableError(err, tableName) {
  return err?.code === "ER_NO_SUCH_TABLE" && String(err?.sqlMessage || "").includes(tableName);
}

// ============================
// LISTAR MISSÕES
// ============================
async function getMissions(req, res) {
  try {
    const [missions] = await db.query(
      `SELECT id, title, description, type, access, reward_points AS points, active, created_at
       FROM missions
       ORDER BY created_at DESC`
    );
    res.json(missions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao listar missões" });
  }
}

// ============================
// OBTER MISSÃO POR ID
// ============================
async function getMission(req, res) {
  const { id } = req.params;
  try {
    const [rows] = await db.query(
      "SELECT id, title, description, type, access, reward_points AS points, active, created_at FROM missions WHERE id = ?",
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Missão não encontrada" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao obter missão" });
  }
}

// ============================
// CRIAR MISSÃO
// ============================
async function createMission(req, res) {
  const { title, description, type, points, access } = req.body;

  if (!title || !points) {
    return res.status(400).json({ error: "Título e pontos são obrigatórios" });
  }

  const missionAccess = access === "premium" ? "premium" : "free";

  try {
    const [result] = await db.query(
      `INSERT INTO missions (title, description, type, reward_points, access, active)
       VALUES (?, ?, ?, ?, ?, 1)`,
      [title, description || "", type || "daily", Number(points), missionAccess]
    );

    const [rows] = await db.query(
      "SELECT id, title, description, type, access, reward_points AS points, active, created_at FROM missions WHERE id = ?",
      [result.insertId]
    );

    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao criar missão" });
  }
}

// ============================
// ATUALIZAR MISSÃO
// ============================
async function updateMission(req, res) {
  const { id } = req.params;
  const { title, description, type, points, active, access } = req.body;

  const setClauses = [];
  const values = [];

  if (title !== undefined)       { setClauses.push("title = ?");          values.push(title); }
  if (description !== undefined) { setClauses.push("description = ?");    values.push(description); }
  if (type !== undefined)        { setClauses.push("type = ?");            values.push(type); }
  if (points !== undefined)      { setClauses.push("reward_points = ?");   values.push(Number(points)); }
  if (active !== undefined)      { setClauses.push("active = ?");          values.push(active ? 1 : 0); }
  if (access !== undefined)      { setClauses.push("access = ?");          values.push(access === "premium" ? "premium" : "free"); }

  if (setClauses.length === 0) {
    return res.status(400).json({ error: "Nenhum campo para atualizar" });
  }

  values.push(id);

  try {
    const [result] = await db.query(
      `UPDATE missions SET ${setClauses.join(", ")} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) return res.status(404).json({ error: "Missão não encontrada" });

    const [rows] = await db.query(
      "SELECT id, title, description, type, access, reward_points AS points, active, created_at FROM missions WHERE id = ?",
      [id]
    );

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao atualizar missão" });
  }
}

// ============================
// ELIMINAR MISSÃO
// ============================
async function deleteMission(req, res) {
  const { id } = req.params;
  try {
    const [result] = await db.query("DELETE FROM missions WHERE id = ?", [id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: "Missão não encontrada" });
    res.json({ message: "Missão eliminada" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao eliminar missão" });
  }
}

// ============================
// SUBMETER CONCLUSÃO DE MISSÃO (utilizador envia foto)
// ============================
async function submitMission(req, res) {
  const userId = req.user.id;
  const { missionId } = req.params;
  const { photoUrl } = req.body;

  if (!photoUrl) return res.status(400).json({ error: "Foto é obrigatória" });

  try {
    const [mission] = await db.query(
      "SELECT id, reward_points AS points FROM missions WHERE id = ? AND active = 1",
      [missionId]
    );
    if (mission.length === 0) return res.status(404).json({ error: "Missão não encontrada" });

    const [existing] = await db.query(
      "SELECT id FROM user_missions WHERE user_id = ? AND mission_id = ?",
      [userId, missionId]
    );
    if (existing.length > 0) return res.status(400).json({ error: "Missão já foi submetida" });

    await db.query(
      `INSERT INTO user_missions (user_id, mission_id, photo_url, verified, completed_at)
       VALUES (?, ?, ?, 0, NOW())`,
      [userId, missionId, photoUrl]
    );

    res.status(201).json({ message: "Missão submetida para verificação", points: mission[0].points });
  } catch (err) {
    console.error(err);
    if (isMissingTableError(err, "user_missions")) {
      return res.status(503).json({ error: "Tabela user_missions não existe. Execute a migração." });
    }
    res.status(500).json({ error: "Erro ao submeter missão" });
  }
}

// ============================
// RESGATAR PONTOS DE MISSÃO VERIFICADA
// ============================
async function redeemMission(req, res) {
  const userId = req.user.id;
  const { missionId } = req.params;

  try {
    const [userMission] = await db.query(
      `SELECT um.id, m.reward_points AS points
       FROM user_missions um
       JOIN missions m ON um.mission_id = m.id
       WHERE um.user_id = ? AND um.mission_id = ? AND um.verified = 1 AND (um.redeemed IS NULL OR um.redeemed = 0)`,
      [userId, missionId]
    );

    if (userMission.length === 0) {
      return res.status(400).json({ error: "Missão não verificada ou já resgatada" });
    }

    await db.query(
      "UPDATE user_missions SET redeemed = 1, redeemed_at = NOW() WHERE id = ?",
      [userMission[0].id]
    );

    await db.query("UPDATE users SET points = points + ? WHERE id = ?", [userMission[0].points, userId]);

    res.json({ message: "Pontos resgatados com sucesso", points: userMission[0].points });
  } catch (err) {
    console.error(err);
    if (isMissingTableError(err, "user_missions")) {
      return res.status(503).json({ error: "Tabela user_missions não existe. Execute a migração." });
    }
    res.status(500).json({ error: "Erro ao resgatar pontos" });
  }
}

// ============================
// ADMIN: LISTAR SUBMISSÕES PENDENTES
// ============================
async function getPendingMissions(req, res) {
  try {
    const [pending] = await db.query(
      `SELECT um.id, um.user_id, u.name AS user_name, u.email,
              m.title, m.reward_points AS points,
              um.photo_url, um.completed_at
       FROM user_missions um
       JOIN users u ON um.user_id = u.id
       JOIN missions m ON um.mission_id = m.id
       WHERE um.verified = 0
       ORDER BY um.completed_at DESC`
    );
    res.json(pending);
  } catch (err) {
    console.error(err);
    if (isMissingTableError(err, "user_missions")) return res.json([]);
    res.status(500).json({ error: "Erro ao buscar missões pendentes" });
  }
}

// ============================
// ADMIN: VERIFICAR / REJEITAR SUBMISSÃO
// ============================
async function verifyMission(req, res) {
  const { userMissionId } = req.params;
  const { approved } = req.body;

  try {
    if (approved) {
      await db.query("UPDATE user_missions SET verified = 1 WHERE id = ?", [userMissionId]);

      const [data] = await db.query(
        `SELECT um.user_id, m.title, m.reward_points AS points
         FROM user_missions um
         JOIN missions m ON um.mission_id = m.id
         WHERE um.id = ?`,
        [userMissionId]
      );

      if (data.length > 0) {
        const { user_id, title, points } = data[0];
        try {
          await db.query(
            `INSERT INTO notifications (user_id, title, message, type, is_read, created_at)
             VALUES (?, ?, ?, 'mission', 0, NOW())`,
            [user_id, "Missão Aprovada!", `A tua missão '${title}' foi aprovada. Ganhaste +${points} pontos!`]
          );
        } catch (notifErr) {
          if (!isMissingTableError(notifErr, "notifications")) throw notifErr;
        }
      }

      res.json({ message: "Missão aprovada" });
    } else {
      await db.query("DELETE FROM user_missions WHERE id = ?", [userMissionId]);
      res.json({ message: "Missão rejeitada" });
    }
  } catch (err) {
    console.error(err);
    if (isMissingTableError(err, "user_missions")) {
      return res.status(503).json({ error: "Tabela user_missions não existe. Execute a migração." });
    }
    res.status(500).json({ error: "Erro ao verificar missão" });
  }
}

module.exports = {
  getMissions,
  getMission,
  createMission,
  updateMission,
  deleteMission,
  submitMission,
  redeemMission,
  getPendingMissions,
  verifyMission,
};
