const db = require("../../db");

// Obter relatório de usuários
async function getUsersReport() {
  const [data] = await db.query(
    `SELECT COUNT(*) as total_users, 
            SUM(CASE WHEN role = 'user' THEN 1 ELSE 0 END) as regular_users,
            SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admins,
            SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_users,
            SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive_users
     FROM users`
  );
  return data.length > 0 ? data[0] : null;
}

// Obter relatório de missões
async function getMissionsReport() {
  const [data] = await db.query(
    `SELECT COUNT(*) as total_missions,
            SUM(CASE WHEN public = 1 THEN 1 ELSE 0 END) as public_missions,
            SUM(CASE WHEN public = 0 THEN 1 ELSE 0 END) as private_missions
     FROM missions`
  );
  return data.length > 0 ? data[0] : null;
}

// Obter relatório de recompensas
async function getRewardsReport() {
  const [data] = await db.query(
    `SELECT COUNT(*) as total_rewards,
            SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_rewards,
            SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive_rewards,
            SUM(stock) as total_stock
     FROM rewards`
  );
  return data.length > 0 ? data[0] : null;
}

// Obter relatório de parceiros
async function getPartnersReport() {
  const [data] = await db.query(
    `SELECT COUNT(*) as total_partners,
            SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) as active_partners,
            SUM(CASE WHEN status = 'inactive' THEN 1 ELSE 0 END) as inactive_partners
     FROM partners`
  );
  return data.length > 0 ? data[0] : null;
}

// Obter relatório geral/dashboard
async function getGeneralReport() {
  const users = await getUsersReport();
  const missions = await getMissionsReport();
  const rewards = await getRewardsReport();
  const partners = await getPartnersReport();

  return {
    users,
    missions,
    rewards,
    partners,
    timestamp: new Date().toISOString()
  };
}

module.exports = {
  getUsersReport,
  getMissionsReport,
  getRewardsReport,
  getPartnersReport,
  getGeneralReport,
};
