const express = require("express");
const router = express.Router();
const { auth, adminOnly } = require("../../authMiddleware");
const db = require("../../db");

// todas as rotas precisam de autenticação
router.use(auth);

// ============================
// ESTATÍSTICAS GERAIS
// ============================
router.get("/stats", adminOnly, async (req, res) => {
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
});

// ============================
// USUÁRIOS POR TIPO
// ============================
router.get("/users-by-role", adminOnly, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT role, COUNT(*) as count FROM users GROUP BY role"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar usuários" });
  }
});

// ============================
// REWARDS POR PARTNER
// ============================
router.get("/rewards-by-partner", adminOnly, async (req, res) => {
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
});

// ============================
// TOP REWARDS MORE USED
// ============================
router.get("/top-rewards", adminOnly, async (req, res) => {
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
});

// ============================
// RESUMO GERAL
// ============================
router.get("/summary", adminOnly, async (req, res) => {
  try {
    const [stats] = await db.query(`
      SELECT 
        (SELECT COUNT(*) FROM users) as totalUsers,
        (SELECT COUNT(*) FROM users WHERE role = 'admin') as totalAdmins,
        (SELECT COUNT(*) FROM users WHERE role = 'user') as totalRegularUsers,
        (SELECT COUNT(*) FROM partners) as totalPartners,
        (SELECT COUNT(*) FROM rewards) as totalRewards,
        (SELECT COUNT(*) FROM missions) as totalMissions,
        (SELECT SUM(stock) FROM rewards) as totalStock,
        (SELECT AVG(cost_points) FROM rewards) as avgPointsCost
    `);

    res.json(stats[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erro ao buscar resumo" });
  }
});

module.exports = router;
