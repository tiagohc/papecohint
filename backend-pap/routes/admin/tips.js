const express = require("express");
const router = express.Router();
const { createTipCtrl, getTips, getTip, updateTipCtrl, deleteTipCtrl } = require("../../controllers/admin/tipsController");
const { auth, adminOnly } = require("../../authMiddleware");

router.use(auth);

// CRUD de dicas (somente admin)
router.post("/", adminOnly, createTipCtrl);
router.get("/", adminOnly, getTips);
router.get("/:id", adminOnly, getTip);
router.put("/:id", adminOnly, updateTipCtrl);
router.delete("/:id", adminOnly, deleteTipCtrl);

module.exports = router;
