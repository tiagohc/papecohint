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
      `SELECT id, title, description, type, access, reward_points AS points, active, verification_type, target_kwh, created_at
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
      "SELECT id, title, description, type, access, reward_points AS points, active, verification_type, target_kwh, created_at FROM missions WHERE id = ?",
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
  const { title, description, type, points, access, verification_type, target_kwh } = req.body;

  if (!title || !points) {
    return res.status(400).json({ error: "Título e pontos são obrigatórios" });
  }

  const missionAccess = access === "premium" ? "premium" : "free";
  const verType = ["photo", "invoice_kwh_below", "invoice_kwh_reduce", "transport_ticket"].includes(verification_type)
    ? verification_type
    : "photo";
  const targetKwh = verType === "invoice_kwh_below" && target_kwh ? Number(target_kwh) : null;

  try {
    const [result] = await db.query(
      `INSERT INTO missions (title, description, type, reward_points, access, active, verification_type, target_kwh)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
      [title, description || "", type || "daily", Number(points), missionAccess, verType, targetKwh]
    );

    const [rows] = await db.query(
      "SELECT id, title, description, type, access, reward_points AS points, active, verification_type, target_kwh, created_at FROM missions WHERE id = ?",
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
  const { title, description, type, points, active, access, verification_type, target_kwh } = req.body;

  const setClauses = [];
  const values = [];

  if (title !== undefined)             { setClauses.push("title = ?");              values.push(title); }
  if (description !== undefined)       { setClauses.push("description = ?");        values.push(description); }
  if (type !== undefined)              { setClauses.push("type = ?");               values.push(type); }
  if (points !== undefined)            { setClauses.push("reward_points = ?");      values.push(Number(points)); }
  if (active !== undefined)            { setClauses.push("active = ?");             values.push(active ? 1 : 0); }
  if (access !== undefined)            { setClauses.push("access = ?");             values.push(access === "premium" ? "premium" : "free"); }
  if (verification_type !== undefined) { setClauses.push("verification_type = ?"); values.push(verification_type); }
  if (target_kwh !== undefined)        { setClauses.push("target_kwh = ?");        values.push(target_kwh !== null ? Number(target_kwh) : null); }

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
      "SELECT id, title, description, type, access, reward_points AS points, active, verification_type, target_kwh, created_at FROM missions WHERE id = ?",
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

// ============================
// ADMIN: LISTAR TODAS AS CONCLUSÕES (histórico completo)
// ============================
async function getAllCompletions(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT um.id, um.user_id, IFNULL(u.name, u.email) AS user_name, u.email,
              m.id AS mission_id, m.title, m.reward_points AS points, IFNULL(m.verification_type, 'photo') AS verification_type,
              um.photo_url, um.verified, um.redeemed, um.completed_at
       FROM user_missions um
       JOIN users u ON um.user_id = u.id
       JOIN missions m ON um.mission_id = m.id
       ORDER BY um.completed_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error('[admin/completions]', err);
    if (isMissingTableError(err, 'user_missions')) return res.json([]);
    res.status(500).json({ error: 'Erro ao buscar histórico de conclusões' });
  }
}

// ============================
// ADMIN: RESET DE CONCLUSÃO (permite ao utilizador repetir a missão)
// ============================
async function resetCompletion(req, res) {
  const { completionId } = req.params;
  try {
    // Revert the points that were added when the mission was completed
    const [rows] = await db.query(
      `SELECT um.user_id, m.reward_points AS points
       FROM user_missions um
       JOIN missions m ON um.mission_id = m.id
       WHERE um.id = ?`,
      [completionId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "Conclusão não encontrada" });
    }

    const { user_id, points } = rows[0];

    // Remove the user_missions record
    await db.query("DELETE FROM user_missions WHERE id = ?", [completionId]);

    // Revert eco_points (only if points > 0)
    if (points > 0) {
      await db.query(
        "UPDATE users SET eco_points = GREATEST(0, eco_points - ?) WHERE id = ?",
        [points, user_id]
      );
    }

    res.json({ message: "Conclusão removida. O utilizador pode repetir a missão." });
  } catch (err) {
    console.error(err);
    if (isMissingTableError(err, "user_missions")) {
      return res.status(503).json({ error: "Tabela user_missions não existe." });
    }
    res.status(500).json({ error: "Erro ao fazer reset da missão" });
  }
}

// ============================
// LISTAR MISSÕES EXPIRADAS (para o admin ver histórico)
// ============================
async function getExpiredMissions(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT id, title, description, type, access, reward_points AS points,
              verification_type, target_kwh, created_at,
              CASE
                WHEN type = 'daily'   THEN DATE_ADD(created_at, INTERVAL 1 DAY)
                WHEN type = 'monthly' THEN DATE_ADD(created_at, INTERVAL 1 MONTH)
                ELSE NULL
              END AS expires_at
       FROM missions
       WHERE NOT (
         (type = 'daily'   AND NOW() <= DATE_ADD(created_at, INTERVAL 1 DAY))
         OR (type = 'monthly' AND NOW() <= DATE_ADD(created_at, INTERVAL 1 MONTH))
       )
       ORDER BY created_at DESC
       LIMIT 100`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao listar missões expiradas" });
  }
}

// ============================
// DUPLICAR MISSÃO (nova cópia com created_at = NOW)
// ============================
async function duplicateMission(req, res) {
  const { id } = req.params;
  try {
    const [rows] = await db.query(
      "SELECT title, description, type, reward_points, access, verification_type, target_kwh FROM missions WHERE id = ?",
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Missão não encontrada" });
    const m = rows[0];
    const [result] = await db.query(
      `INSERT INTO missions (title, description, type, reward_points, access, active, verification_type, target_kwh, created_at)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?, NOW())`,
      [m.title, m.description, m.type, m.reward_points, m.access, m.verification_type, m.target_kwh]
    );
    const [newRows] = await db.query(
      "SELECT id, title, description, type, access, reward_points AS points, active, verification_type, target_kwh, created_at FROM missions WHERE id = ?",
      [result.insertId]
    );
    res.status(201).json(newRows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao duplicar missão" });
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
  getAllCompletions,
  resetCompletion,
  duplicateMission,
  getExpiredMissions,
};
