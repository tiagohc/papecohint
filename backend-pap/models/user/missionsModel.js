const db = require("../../db");

const MISSION_AVAILABILITY_CONDITION = `(
  (m.type = 'daily' AND NOW() <= DATE_ADD(m.created_at, INTERVAL 1 DAY))
  OR (m.type = 'monthly' AND NOW() <= DATE_ADD(m.created_at, INTERVAL 1 MONTH))
)`;

function isMissingTableError(err, tableName) {
  return err?.code === "ER_NO_SUCH_TABLE" && String(err?.sqlMessage || "").includes(tableName);
}

// Listar missões ativas com estado do utilizador
async function getUserMissions(userId, isPremium = false) {
  const accessFilter = isPremium
    ? ""
    : "AND m.access = 'free'";

  try {
    const [missions] = await db.query(
      `SELECT m.id,
              m.title,
              m.description,
              m.type,
              m.access,
              IFNULL(m.verification_type, 'photo') AS verification_type,
              m.reward_points AS points,
              m.created_at,
              CASE
                WHEN m.type = 'daily' THEN DATE_ADD(m.created_at, INTERVAL 1 DAY)
                WHEN m.type = 'monthly' THEN DATE_ADD(m.created_at, INTERVAL 1 MONTH)
                ELSE NULL
              END AS expires_at,
              IF(um.id IS NULL, 0, 1) AS isCompleted,
              IFNULL(um.verified, 0) AS verified,
              IFNULL(um.redeemed, 0) AS redeemed,
              um.photo_url,
              um.completed_at
       FROM missions m
       LEFT JOIN user_missions um
              ON um.mission_id = m.id
             AND um.user_id = ?
       WHERE m.active = 1
       AND ${MISSION_AVAILABILITY_CONDITION}
       ${accessFilter}
       ORDER BY m.created_at DESC`,
      [userId]
    );
    return missions;
  } catch (err) {
    if (isMissingTableError(err, "user_missions")) {
      const [missions] = await db.query(
        `SELECT m.id,
                m.title,
                m.description,
                m.type,
                m.access,
                IFNULL(m.verification_type, 'photo') AS verification_type,
                m.reward_points AS points,
                m.created_at,
                  CASE
                    WHEN m.type = 'daily' THEN DATE_ADD(m.created_at, INTERVAL 1 DAY)
                    WHEN m.type = 'monthly' THEN DATE_ADD(m.created_at, INTERVAL 1 MONTH)
                    ELSE NULL
                  END AS expires_at,
                0 AS isCompleted,
                0 AS verified,
                0 AS redeemed,
                NULL AS photo_url,
                NULL AS completed_at
         FROM missions m
         WHERE m.active = 1
                AND ${MISSION_AVAILABILITY_CONDITION}
         ${accessFilter}
         ORDER BY m.created_at DESC`
      );
      return missions;
    }
    throw err;
  }
}

// Obter uma missão específica com estado do utilizador
async function getUserMissionById(missionId, userId) {
  const [missions] = await db.query(
    `SELECT m.id,
            m.title,
            m.description,
            m.type,
            m.access,
            IFNULL(m.verification_type, 'photo') AS verification_type,
            m.reward_points AS points,
            m.created_at,
            CASE
              WHEN m.type = 'daily' THEN DATE_ADD(m.created_at, INTERVAL 1 DAY)
              WHEN m.type = 'monthly' THEN DATE_ADD(m.created_at, INTERVAL 1 MONTH)
              ELSE NULL
            END AS expires_at,
            IF(um.id IS NULL, 0, 1) AS isCompleted,
            IFNULL(um.verified, 0) AS verified,
            IFNULL(um.redeemed, 0) AS redeemed,
            um.photo_url,
            um.completed_at
     FROM missions m
     LEFT JOIN user_missions um
            ON um.mission_id = m.id
           AND um.user_id = ?
     WHERE m.id = ?
       AND m.active = 1
       AND ${MISSION_AVAILABILITY_CONDITION}`,
    [userId, missionId]
  );
  return missions.length > 0 ? missions[0] : null;
}

// Completar missão diretamente (sem confirmação manual)
async function completeMissionDirect(missionId, userId, photoUrl) {
  const [existing] = await db.query(
    "SELECT id FROM user_missions WHERE mission_id = ? AND user_id = ?",
    [missionId, userId]
  );

  if (existing.length > 0) {
    return { alreadyCompleted: true, missionUnavailable: false, points: 0 };
  }

  const [missionRows] = await db.query(
    `SELECT m.reward_points
     FROM missions m
     WHERE m.id = ?
       AND m.active = 1
       AND ${MISSION_AVAILABILITY_CONDITION}`,
    [missionId]
  );

  if (missionRows.length === 0) {
    return { alreadyCompleted: false, missionUnavailable: true, points: 0 };
  }

  const points = missionRows.length > 0 ? Number(missionRows[0].reward_points || 0) : 0;

  await db.query(
    `INSERT INTO user_missions (user_id, mission_id, photo_url, verified, redeemed, completed_at, redeemed_at)
     VALUES (?, ?, ?, 1, 1, NOW(), NOW())`,
    [userId, missionId, photoUrl]
  );

  if (points > 0) {
    await db.query("UPDATE users SET eco_points = eco_points + ? WHERE id = ?", [points, userId]);
  }

  return { alreadyCompleted: false, missionUnavailable: false, points };
}

// ──────────────────────────────────────────────
// Auto-complete invoice-based missions
// Called after a user confirms an energy invoice
// ──────────────────────────────────────────────

async function checkAndCompleteInvoiceMissions(userId, kwh, previousKwh, invoicePeriodStart, invoicePeriodEnd) {
  const completed = [];
  let totalPoints = 0;

  if (kwh === null || kwh === undefined) {
    return { completed, pointsAwarded: 0 };
  }

  // Fetch active invoice missions not yet completed by this user
  const [missions] = await db.query(
    `SELECT m.id, m.title, m.reward_points, m.verification_type, m.target_kwh, m.created_at,
            CASE
              WHEN m.type = 'daily'   THEN DATE_ADD(m.created_at, INTERVAL 1 DAY)
              WHEN m.type = 'monthly' THEN DATE_ADD(m.created_at, INTERVAL 1 MONTH)
            END AS expires_at
     FROM missions m
     LEFT JOIN user_missions um ON um.mission_id = m.id AND um.user_id = ?
     WHERE m.active = 1
       AND m.verification_type IN ('invoice_kwh_below', 'invoice_kwh_reduce')
       AND um.id IS NULL
       AND ${MISSION_AVAILABILITY_CONDITION}`,
    [userId]
  );

  for (const mission of missions) {
    let qualifies = false;

    if (mission.verification_type === "invoice_kwh_below" && mission.target_kwh !== null) {
      qualifies = kwh < mission.target_kwh;
    } else if (mission.verification_type === "invoice_kwh_reduce") {
      // Only qualifies if we have a previous reading to compare
      qualifies = previousKwh !== null && kwh < previousKwh;
    }

    if (!qualifies) continue;

    // ── Validate invoice billing period against mission period ────────────
    if (invoicePeriodStart || invoicePeriodEnd) {
      const missionStart = mission.created_at ? new Date(mission.created_at) : null;
      const missionEnd   = mission.expires_at  ? new Date(mission.expires_at)  : null;

      if (missionStart && missionEnd) {
        // Invoice period must OVERLAP the mission window
        const invStart = invoicePeriodStart ? new Date(invoicePeriodStart) : null;
        const invEnd   = invoicePeriodEnd   ? new Date(invoicePeriodEnd)   : null;

        const startOk = !invStart || invStart <= missionEnd;
        const endOk   = !invEnd   || invEnd   >= missionStart;

        if (!startOk || !endOk) {
          // Invoice billing period is outside the mission window — skip
          continue;
        }
      }
    }

    // Mark mission as completed
    await db.query(
      `INSERT INTO user_missions (user_id, mission_id, photo_url, verified, redeemed, completed_at, redeemed_at)
       VALUES (?, ?, NULL, 1, 1, NOW(), NOW())`,
      [userId, mission.id]
    );

    const points = Number(mission.reward_points || 0);
    if (points > 0) {
      await db.query("UPDATE users SET eco_points = eco_points + ? WHERE id = ?", [points, userId]);
      totalPoints += points;
    }

    completed.push({ id: mission.id, title: mission.title, points });
  }

  return { completed, pointsAwarded: totalPoints };
}

// Histórico do utilizador: missões expiradas (concluídas ou falhadas) + concluídas ainda ativas
async function getUserMissionsHistory(userId) {
  try {
    const [rows] = await db.query(
      `SELECT m.id,
              m.title,
              m.description,
              m.type,
              m.access,
              IFNULL(m.verification_type, 'photo') AS verification_type,
              m.reward_points AS points,
              m.created_at,
              CASE
                WHEN m.type = 'daily'   THEN DATE_ADD(m.created_at, INTERVAL 1 DAY)
                WHEN m.type = 'monthly' THEN DATE_ADD(m.created_at, INTERVAL 1 MONTH)
                ELSE NULL
              END AS expires_at,
              IF(um.id IS NULL, 0, 1) AS isCompleted,
              um.completed_at
       FROM missions m
       INNER JOIN user_missions um ON um.mission_id = m.id AND um.user_id = ?
       ORDER BY um.completed_at DESC
       LIMIT 60`,
      [userId]
    );
    return rows;
  } catch (err) {
    if (isMissingTableError(err, "user_missions")) return [];
    throw err;
  }
}

module.exports = {
  isMissingTableError,
  getUserMissions,
  getUserMissionById,
  completeMissionDirect,
  checkAndCompleteInvoiceMissions,
  getUserMissionsHistory,
};
