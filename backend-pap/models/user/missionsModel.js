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
    await db.query("UPDATE users SET points = points + ? WHERE id = ?", [points, userId]);
  }

  return { alreadyCompleted: false, missionUnavailable: false, points };
}

module.exports = {
  isMissingTableError,
  getUserMissions,
  getUserMissionById,
  completeMissionDirect,
};
