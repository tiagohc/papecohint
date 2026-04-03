const express = require("express");
const router = express.Router();
const {
  createReward,
  getRewards,
  getReward,
  updateReward,
  deleteReward,
} = require("../../controllers/admin/rewardsController");
const { auth, adminOnly } = require("../../authMiddleware");

// todas as rotas precisam de autenticação
router.use(auth);

// CRUD rewards - só admin
router.post("/", adminOnly, createReward);
router.get("/", adminOnly, getRewards);
router.get("/:id", adminOnly, getReward);
router.put("/:id", adminOnly, updateReward);
router.delete("/:id", adminOnly, deleteReward);

module.exports = router;
