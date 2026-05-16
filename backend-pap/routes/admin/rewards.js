const express = require("express");
const router = express.Router();
const {
  createReward,
  getRewards,
  getReward,
  updateReward,
  deleteReward,
  getPendingRewards,
  approveReward,
  rejectReward,
  getRedemptions,
} = require("../../controllers/admin/rewardsController");
const { auth, adminOnly } = require("../../authMiddleware");

// todas as rotas precisam de autenticação
router.use(auth);

// CRUD rewards - só admin
router.post("/", adminOnly, createReward);
router.get("/", adminOnly, getRewards);
router.get("/pending", adminOnly, getPendingRewards);
router.get("/redemptions", adminOnly, getRedemptions);
router.get("/:id", adminOnly, getReward);
router.put("/:id", adminOnly, updateReward);
router.delete("/:id", adminOnly, deleteReward);
router.post("/:id/approve", adminOnly, approveReward);
router.post("/:id/reject", adminOnly, rejectReward);

module.exports = router;
