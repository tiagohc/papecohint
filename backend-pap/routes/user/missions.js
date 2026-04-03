const express = require("express");
const router = express.Router();
const { getUserMissions, getUserMission, completeUserMission } = require("../../controllers/user/missionsController");
const { auth } = require("../../authMiddleware");

router.use(auth);

// Listar todas as missões do usuário
router.get("/", getUserMissions);

// Obter detalhes de uma missão
router.get("/:id", getUserMission);

// Completar uma missão
router.post("/:id/complete", completeUserMission);

module.exports = router;
