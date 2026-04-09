const express = require("express");
const router = express.Router();
const { auth } = require("../../authMiddleware");
const { createEasypayCheckout } = require("../../controllers/user/easypayController");

router.post("/checkout", auth, createEasypayCheckout);

module.exports = router;
