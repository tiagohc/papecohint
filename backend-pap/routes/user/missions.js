const express = require("express");
const router = express.Router();
const {
	getUserMissions,
	getUserMission,
	completeUserMission,
	redeemUserMission,
	completeWithTicket,
	previewTicket,
	getMissionsHistory,
} = require("../../controllers/user/missionsController");
const { auth } = require("../../authMiddleware");

router.use(auth);

// Listar todas as missões do usuário
router.get("/", getUserMissions);

// Histórico de missões expiradas do utilizador
router.get("/history", getMissionsHistory);

// Obter detalhes de uma missão
router.get("/:id", getUserMission);

// Completar uma missão (foto base64)
router.post("/:id/complete", completeUserMission);

// Completar missão de transporte com bilhete verificado por IA (multipart)
router.post("/:id/complete-with-ticket", completeWithTicket);

// Preview bilhete antes de confirmar — sem side effects
router.post("/:id/preview-ticket", previewTicket);

// Resgatar pontos de missão verificada
router.post("/:id/redeem", redeemUserMission);

module.exports = router;
