const express = require("express");
const router = express.Router();
const { getUserPoints, getAvailableRewards, redeemReward } = require("../../controllers/user/rewardsController");
const { auth } = require("../../authMiddleware");

router.use(auth);

// Obter pontos do usuário
router.get("/points", getUserPoints);

// Listar recompensas disponíveis
router.get("/", getAvailableRewards);

// Resgatar uma recompensa
router.post("/redeem", redeemReward);

module.exports = router;
