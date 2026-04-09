const express = require("express");
const router = express.Router();
const { auth, adminOnly } = require("../../authMiddleware");
const {
  getMissions,
  getMission,
  createMission,
  updateMission,
  deleteMission,
  submitMission,
  redeemMission,
  getPendingMissions,
  verifyMission,
} = require("../../controllers/admin/missionsController");

// todas as rotas precisam de autenticação
router.use(auth);

// rotas estáticas primeiro (antes dos parâmetros)
router.get("/", adminOnly, getMissions);
router.post("/", adminOnly, createMission);
router.get("/pending", adminOnly, getPendingMissions);
router.post("/admin/create", adminOnly, createMission);
router.get("/admin/pending", adminOnly, getPendingMissions);

// rotas com parâmetros
router.get("/:id", adminOnly, getMission);
router.put("/:id", adminOnly, updateMission);
router.delete("/:id", adminOnly, deleteMission);
router.post("/admin/:userMissionId/verify", adminOnly, verifyMission);
router.post("/:userMissionId/verify", adminOnly, verifyMission);
router.post("/:missionId/complete", submitMission);
router.post("/:missionId/redeem", redeemMission);

module.exports = router;
