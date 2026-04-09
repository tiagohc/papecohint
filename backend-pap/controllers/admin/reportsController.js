const { getUsersReport, getMissionsReport, getRewardsReport, getPartnersReport, getGeneralReport } = require("../../models/admin/reportsModel");
const db = require("../../db");

function isMissingPartnerUsersTable(err) {
  return err?.code === "ER_NO_SUCH_TABLE" && String(err?.sqlMessage || "").includes("partner_users");
}

// ESTATÍSTICAS GERAIS
async function getStats(req, res) {
  try {
    const [users] = await db.query("SELECT COUNT(*) as count FROM users");
    const [partners] = await db.query("SELECT COUNT(*) as count FROM partners");
    const [rewards] = await db.query("SELECT COUNT(*) as count FROM rewards");
    const [missions] = await db.query("SELECT COUNT(*) as count FROM missions");

    const stats = {
      totalUsers: users[0].count,
      totalPartners: partners[0].count,
      totalRewards: rewards[0].count,
      totalMissions: missions[0].count,
    };

    res.json(stats);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar estatísticas" });
  }
}

// USUÁRIOS POR TIPO
async function getUsersByRole(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT CASE WHEN pu.user_id IS NOT NULL THEN 'partner' ELSE u.role END AS role,
              COUNT(*) AS count
       FROM users u
       LEFT JOIN partner_users pu ON pu.user_id = u.id
       GROUP BY CASE WHEN pu.user_id IS NOT NULL THEN 'partner' ELSE u.role END`
    );
    res.json(rows);
  } catch (err) {
    if (isMissingPartnerUsersTable(err)) {
      try {
        const [fallbackRows] = await db.query("SELECT role, COUNT(*) as count FROM users GROUP BY role");
        return res.json(fallbackRows);
      } catch (fallbackErr) {
        console.error(fallbackErr);
        return res.status(500).json({ error: "Erro ao buscar usuários" });
      }
    }

    console.error(err);
    res.status(500).json({ error: "Erro ao buscar usuários" });
  }
}

// REWARDS POR PARTNER
async function getRewardsByPartner(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT p.id, p.name, COUNT(r.id) as totalRewards, SUM(r.stock) as totalStock
       FROM partners p
       LEFT JOIN rewards r ON p.id = r.partner_id
       GROUP BY p.id, p.name`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar rewards" });
  }
}

// TOP REWARDS
async function getTopRewards(req, res) {
  try {
    const [rows] = await db.query(
      `SELECT r.id, r.title as name, r.cost_points as points, 
              (r.stock) as availableStock, p.name as partnerName
       FROM rewards r
       LEFT JOIN partners p ON r.partner_id = p.id
       ORDER BY r.stock DESC
       LIMIT 10`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar rewards" });
  }
}

// RESUMO GERAL
async function getSummary(req, res) {
  try {
    const [stats] = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as totalUsers,
        (SELECT COUNT(*) FROM users WHERE role = 'admin') as totalAdmins,
        (SELECT COUNT(*)
           FROM users u
           LEFT JOIN partner_users pu ON pu.user_id = u.id
          WHERE u.role = 'user' AND pu.user_id IS NULL) as totalRegularUsers,
        (SELECT COUNT(*)
           FROM users u
           INNER JOIN partner_users pu ON pu.user_id = u.id) as totalPartnersUsers,
        (SELECT COUNT(*) FROM partners) as totalPartners,
        (SELECT COUNT(*) FROM rewards) as totalRewards,
        (SELECT COUNT(*) FROM missions) as totalMissions,
        (SELECT SUM(stock) FROM rewards) as totalStock,
        (SELECT AVG(cost_points) FROM rewards) as avgPointsCost,
        (SELECT COUNT(*) FROM user_premium WHERE status = 'active') as totalPremiumUsers
    `);

    res.json(stats[0]);
  } catch (err) {
    if (isMissingPartnerUsersTable(err)) {
      try {
        const [fallbackStats] = await db.query(`
          SELECT 
            (SELECT COUNT(*) FROM users) as totalUsers,
            (SELECT COUNT(*) FROM users WHERE role = 'admin') as totalAdmins,
            (SELECT COUNT(*) FROM users WHERE role = 'user') as totalRegularUsers,
            0 as totalPartnersUsers,
            (SELECT COUNT(*) FROM partners) as totalPartners,
            (SELECT COUNT(*) FROM rewards) as totalRewards,
            (SELECT COUNT(*) FROM missions) as totalMissions,
            (SELECT SUM(stock) FROM rewards) as totalStock,
            (SELECT AVG(cost_points) FROM rewards) as avgPointsCost,
            (SELECT COUNT(*) FROM user_premium WHERE status = 'active') as totalPremiumUsers
        `);
        return res.json(fallbackStats[0]);
      } catch (fallbackErr) {
        console.error(fallbackErr);
        return res.status(500).json({ error: "Erro ao buscar resumo" });
      }
    }

    console.error(err);
    res.status(500).json({ error: "Erro ao buscar resumo" });
  }
}

// RELATÓRIO DE USUÁRIOS
async function getUsersRep(req, res) {
  try {
    const report = await getUsersReport();
    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro no servidor" });
  }
}

// RELATÓRIO DE MISSÕES
async function getMissionsRep(req, res) {
  try {
    const report = await getMissionsReport();
    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro no servidor" });
  }
}

// RELATÓRIO DE RECOMPENSAS
async function getRewardsRep(req, res) {
  try {
    const report = await getRewardsReport();
    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro no servidor" });
  }
}

// RELATÓRIO DE PARCEIROS
async function getPartnersRep(req, res) {
  try {
    const report = await getPartnersReport();
    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro no servidor" });
  }
}

// RELATÓRIO GERAL
async function getGeneralRep(req, res) {
  try {
    const report = await getGeneralReport();
    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro no servidor" });
  }
}

module.exports = { getStats, getUsersByRole, getRewardsByPartner, getTopRewards, getSummary, getUsersRep, getMissionsRep, getRewardsRep, getPartnersRep, getGeneralRep };