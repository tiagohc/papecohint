const express = require("express");
const router = express.Router();
const {
  getStatus,
  createCheckoutSession,
  cancelSubscription,
  activatePremium,
} = require("../../controllers/user/premiumController");
const { auth } = require("../../authMiddleware");

router.use(auth);

router.get("/status", getStatus);
router.post("/checkout", createCheckoutSession);
router.post("/cancel", cancelSubscription);
router.post("/activate", activatePremium);

module.exports = router;
