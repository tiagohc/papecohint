const express = require("express");
const router = express.Router();
const { getStats, getUsersByRole, getRewardsByPartner, getTopRewards, getSummary, getUsersRep, getMissionsRep, getRewardsRep, getPartnersRep, getGeneralRep } = require("../../controllers/admin/reportsController");
const { auth, adminOnly } = require("../../authMiddleware");

// todas as rotas precisam de autenticação
router.use(auth);

// ESTATÍSTICAS GERAIS
router.get("/stats", adminOnly, getStats);

// USUÁRIOS POR TIPO
router.get("/users-by-role", adminOnly, getUsersByRole);

// REWARDS POR PARTNER
router.get("/rewards-by-partner", adminOnly, getRewardsByPartner);

// TOP REWARDS
router.get("/top-rewards", adminOnly, getTopRewards);

// RESUMO GERAL
router.get("/summary", adminOnly, getSummary);

// RELATÓRIOS DETALHADOS
router.get("/users", adminOnly, getUsersRep);
router.get("/missions", adminOnly, getMissionsRep);
router.get("/rewards", adminOnly, getRewardsRep);
router.get("/partners", adminOnly, getPartnersRep);
router.get("/general", adminOnly, getGeneralRep);

module.exports = router;
